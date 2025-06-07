import {
	commands,
	Hover,
	languages,
	MarkdownString,
	ProgressLocation,
	window,
	workspace,
} from "vscode"
import {
	ACTION_BUTTON_UPDATE_PACKAGE_JSON,
	COMMAND_ID_ANALYZE_DEPENDENCIES,
	DEPENDENCY_KEYS_FOR_HOVER,
	HOVER_MARKDOWN_ANALYZE_PROJECT,
	HOVER_SELECTOR_PACKAGE_JSON,
	LOG_EXTENSION_ACTIVE,
	NOTE_NO_DEPENDENCIES,
	PROGRESS_MSG_READING_PACKAGE_JSON,
	PROGRESS_TITLE_ANALYZE_DEPENDENCIES,
} from "./constants.js"
import {
	analyzeProjectDependencies,
	determineWorkspaceFolder,
	updatePackageJsonEngines,
} from "./helper.utils.js"


/**
 * Activates the VSCode Extension
 * @param {import('vscode').ExtensionContext} context - The context provided by VS Code on activation.
 */
export const activate = context => {
	console.info(LOG_EXTENSION_ACTIVE)

	const analyzeCommand = commands.registerCommand(
		COMMAND_ID_ANALYZE_DEPENDENCIES,
		/**
		 * Analyzes project dependencies for Node/NPM compatibility.
		 * @param {import('vscode').Uri | undefined} uri - The URI of the folder/workspace to analyze.
		 */
		async uri => {
			const workspaceFolder = await determineWorkspaceFolder(
				uri,
				window,
				workspace
			);


			//? If no workspace folder could be determined, show an error message
			if (!workspaceFolder) {
				window?.showErrorMessage(
					"No workspace folder found. Open a project to analyze dependencies."
				)
				return
			}

			window?.withProgress(
				{
					location: ProgressLocation.Notification,
					title: PROGRESS_TITLE_ANALYZE_DEPENDENCIES,
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
							message: PROGRESS_MSG_READING_PACKAGE_JSON,
						})
						//? Perform the project analysis to determine Node.js and NPM version compatibility
						/** @type {Awaited<ReturnType<typeof analyzeProjectDependencies>>} */						const result = await analyzeProjectDependencies(
							workspaceFolder.uri.fsPath,
							progress
						)
						//? If analysis was successful, proceed to display results and offer to update package.json

						if (result) {
							if (result.note === NOTE_NO_DEPENDENCIES) {
								window?.showInformationMessage(
									"No dependencies in project. Cannot determine support limits based on dependencies."
								)
								return
							}

							const nodeEngineString =
								result.minNode && result.maxNode //? If both minNode and maxNode are available, construct the engine string
									? `>=${result.minNode} <=${result.maxNode}`
									: null
							const npmEngineString =
								result.minNpm && result.maxNpm
									? `>=${result.minNpm} <=${result.maxNpm}`
									: null

							if (!nodeEngineString) {
								window?.showErrorMessage( //? If no Node.js version range could be determined, show an error message
									"Could not determine a compatible Node.js version range for the project dependencies."
								)
								return
							}

							let message = `Recommended 'engines' for ${workspaceFolder.name}:\nNode: "${nodeEngineString}"`
							if (npmEngineString) {
								message += `\nNPM: "${npmEngineString}"`
							} else {
								message += `\nNPM: (Could not determine a specific range from dependencies; consider adding manually if needed)`
							}

							//? Offer the user the option to update the package.json with the recommended engine settings
							const updateAction = ACTION_BUTTON_UPDATE_PACKAGE_JSON //? Define the action label for updating package.json
							const selection = await window?.showInformationMessage(
								message,
								{ modal: true },
								updateAction
							)
							if (selection === ACTION_BUTTON_UPDATE_PACKAGE_JSON) {
								await updatePackageJsonEngines(
									result.projectPackageJsonPath,
									nodeEngineString,
									npmEngineString
								)
							}
							//? Handle errors during the analysis process
						}
					} catch (error) {
						console.error("Error analyzing dependencies:", error)
						const errorMessage = error instanceof Error ? error.message : String(error)
						window?.showErrorMessage(
							`Error analyzing dependencies: ${errorMessage}`
						)
					}
				}
			)
		}
	)

	context.subscriptions.push(analyzeCommand)

	//? Hover provider for package.json dependencies
	const packageJsonHoverProvider = {
		/**
		 * Provides a hover tooltip for package.json dependencies to trigger analysis.
		 * @param {import('vscode').TextDocument} document - The document in which the hover was triggered.
		 * @param {import('vscode').Position} position - The position at which the hover was triggered.
		 * @param {import('vscode').CancellationToken} _token - A cancellation token.
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
						if (DEPENDENCY_KEYS_FOR_HOVER.some(key => lineText.includes(`"${key}":`))) {
							inDepsBlock = true
							break
						}
						if (lineText.match(/^\s*{/) && lineNum !== position.line) break //? Start of a new object, not the one we are in.
					}

					if (inDepsBlock) {
						const contents = new MarkdownString(HOVER_MARKDOWN_ANALYZE_PROJECT)
						//? Mark the content as trusted to allow command execution from the hover tooltip
						contents.isTrusted = true //* Allow command execution
						return new Hover(contents, range)
					}
				}
				return null
			},
	}
	const hoverProviderDisposable = languages.registerHoverProvider(
		HOVER_SELECTOR_PACKAGE_JSON,
		packageJsonHoverProvider
	)
	context.subscriptions.push(hoverProviderDisposable)
}

export default activate

// Export for testing purposes
export const { provideHover } = packageJsonHoverProvider;