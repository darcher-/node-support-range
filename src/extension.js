import { statSync } from "fs"
import { basename } from "path"
import {
	commands,
	Hover,
	languages,
	MarkdownString,
	ProgressLocation,
	window,
	workspace,
} from "vscode"
import { analyzeProjectIncludes } from "./utils/analyzeProjectIncludes.js"
import { updateVersionRanges } from "./utils/updateVersionRanges.js"

/**
 * @typedef {object} ProjectAnalysisResult
 * @property {string} projectPackageJsonPath - The path to the project's package.json.
 * @property {string | null} minNode - The determined minimum supported Node.js version.
 * @property {string | null} maxNode - The determined maximum supported Node.js version.
 * @property {string | null} minNpm - The determined minimum supported NPM version.
 * @property {string | null} maxNpm - The determined maximum supported NPM version.
 * @property {string} [note] - An optional note, e.g., if no dependencies were found or other information.
 */

/**
 * Activates the VSCode Extension
 * @param {import('vscode').ExtensionContext} context
 */
export const activate = context => {
	console.log('Extension "node-support-limits" is now active.')

	const analyzeCommand = commands.registerCommand(
		"node-support-limits.analyzeDependencies",
		/**
		 * Command to analyze project dependencies for Node/NPM compatibility.
		 * @param {import('vscode').Uri | undefined} uri - The URI of the folder/workspace to analyze.
		 */
		async uri => {
			/** @type {import('vscode').WorkspaceFolder | undefined} */
			let workspaceFolder
			if (uri && uri.fsPath && statSync(uri.fsPath).isDirectory()) {
				workspaceFolder = workspace.getWorkspaceFolder(uri)
			} else if (
				window?.activeTextEditor &&
				window?.activeTextEditor.document.uri
			) {
				workspaceFolder = workspace.getWorkspaceFolder(
					window?.activeTextEditor.document.uri
				)
			}

			if (
				!workspaceFolder &&
				workspace.workspaceFolders &&
				workspace.workspaceFolders.length > 0
			) {
				if (workspace.workspaceFolders.length === 1) {
					workspaceFolder = workspace.workspaceFolders[0]
				} else {
					const picked = await window?.showWorkspaceFolderPick()
					if (!picked) {
						window?.showInformationMessage("No workspace folder selected.")
						return
					}
					workspaceFolder = picked
				}
			}

			if (!workspaceFolder) {
				window?.showErrorMessage(
					"No workspace folder found. Open a project to analyze dependencies."
				)
				return
			}

			const projectPath = workspaceFolder.uri.fsPath
			window?.withProgress(
				{
					location: ProgressLocation.Notification,
					title: "Analyzing Node/NPM Support Limits...",
					cancellable: false,
				},
				/**
				 * API that allows the extension to report progress updates (like messages and percentage increments) to a user-visible notification.
				 * @param {import('vscode').Progress<{ message?: string; increment?: number }>} progress
				 */
				async progress => {
					try {
						progress.report({
							increment: 0,
							message: "Reading project package.json...",
						})
						/** @type {ProjectAnalysisResult | null} */
						const result = await analyzeProjectIncludes(projectPath, progress)

						if (result) {
							if (result.note === "No dependencies to analyze.") {
								window?.showInformationMessage(
									"No dependencies in project. Cannot determine support limits based on dependencies."
								)
								return
							}

							const nodeEngineString =
								result.minNode && result.maxNode
									? `>=${result.minNode} <=${result.maxNode}`
									: null
							const npmEngineString =
								result.minNpm && result.maxNpm
									? `>=${result.minNpm} <=${result.maxNpm}`
									: null

							if (!nodeEngineString) {
								window?.showErrorMessage(
									"Could not determine a compatible Node.js version range for the project dependencies."
								)
								return
							}

							let message = `Recommended 'engines' for ${basename(projectPath)}:\nNode: "${nodeEngineString}"`
							if (npmEngineString) {
								message += `\nNPM: "${npmEngineString}"`
							} else {
								message += `\nNPM: (Could not determine a specific range from dependencies; consider adding manually if needed)`
							}

							const updateAction = "Update package.json"
							const selection = await window?.showInformationMessage(
								message,
								{ modal: true },
								updateAction
							)
							if (selection === updateAction) {
								await updateVersionRanges(
									result.projectPackageJsonPath,
									nodeEngineString,
									npmEngineString
								)
							}
						}
					} catch (error) {
						console.error("Error analyzing dependencies:", error)
						window?.showErrorMessage(
							`Error analyzing dependencies: ${JSON.parse(JSON.stringify(error))?.message ?? error}`
						)
					}
				}
			)
		}
	)

	context.subscriptions.push(analyzeCommand)

	//? Hover provider for package.json dependencies
	const hoverProvider = languages.registerHoverProvider(
		{ scheme: "file", language: "json", pattern: "**/package.json" },
		{
			/**
			 * Displays a tooltip message "Analyze Node/NPM Support Limits for project" when the user hovers over a dependency line within a package.json file.
			 * @param {import('vscode').TextDocument} document
			 * @param {import('vscode').Position} position
			 * @param {import('vscode').CancellationToken} _token
			 * @returns {import('vscode').ProviderResult<import('vscode').Hover>}
			 */
			provideHover(document, position, _token) {
				console.info("Hover triggered for package.json", { position, _token }) // More informative log
				const range = document.getWordRangeAtPosition(
					position,
					/"([^"]+)":\s*"([^"]+)"/
				)
				if (range) {
					//? Basic check: is the hover within a dependencies/devDependencies block? A full JSON AST parse would be more robust.
					let inDepsBlock = false
					for (let lineNum = position.line; lineNum >= 0; lineNum--) {
						const lineText = document.lineAt(lineNum).text
						if (
							lineText.includes('"dependencies":') ||
							lineText.includes('"devDependencies":') ||
							lineText.includes('"peerDependencies":')
						) {
							inDepsBlock = true
							break
						}
						if (lineText.match(/^\s*{/) && lineNum !== position.line) break //* Start of a new object, not the one we are in.
					}

					if (inDepsBlock) {
						const contents = new MarkdownString(
							`Analyze Node/NPM Support Limits for project`
						)
						contents.isTrusted = true //* Allow command execution
						return new Hover(contents, range)
					}
				}
				return null
			},
		}
	)
	context.subscriptions.push(hoverProvider)
}

export default activate