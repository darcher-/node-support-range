import { Range, window, workspace, WorkspaceEdit } from "vscode"

/**
 * Updates the project's package.json with the new engines.
 * @param {string} packageJsonPath
 * @param {string | null} nodeEngineString
 * @param {string | null} npmEngineString
 * @returns {Promise<void>}
 */
export const updateVersionRanges = async (
	packageJsonPath,
	nodeEngineString,
	npmEngineString
) => {
	try {
		const doc = await workspace.openTextDocument(packageJsonPath)
		const packageJson = JSON.parse(doc.getText())

		if (!packageJson.engines) {
			packageJson.engines = {}
		}

		let updated = false
		if (nodeEngineString) {
			if (packageJson.engines.node !== nodeEngineString) {
				packageJson.engines.node = nodeEngineString
				updated = true
			}
		}
		if (npmEngineString) {
			if (packageJson.engines.npm !== npmEngineString) {
				packageJson.engines.npm = npmEngineString
				updated = true
			}
		} else {
			//? If no specific NPM range, remove it if it exists? Or leave it? For now, only add/update if `npmEngineString` is present.
			/**
			 * TODO If you want to remove it:
			 * if (packageJson.engines.hasOwnProperty('npm')) {
			 *   delete packageJson.engines.npm;
			 *   updated = true;
			 * }
			 */
		}

		if (updated) {
			//? Using VS Code's edit API is better for preserving formatting and undo history. However, JSON.stringify is simpler for a quick update. For production, consider using `jsonc-parser` to modify specific nodes.
			const edit = new WorkspaceEdit()
			const fullRange = new Range(
				doc.positionAt(0),
				doc.positionAt(doc.getText().length)
			)

			//? Attempt to preserve some formatting by getting indent from original file
			const indentMatch = doc.getText().match(/^(\s+)"/m)
			const indent = indentMatch ? indentMatch[1].length : 2

			edit.replace(
				doc.uri,
				fullRange,
				JSON.stringify(packageJson, null, indent)
			)
			await workspace.applyEdit(edit)
			window?.showInformationMessage(
				`package.json has been updated with new 'engines' settings.`
			)
			await window?.showTextDocument(doc) //* Show the updated file
		} else {
			window?.showInformationMessage(
				`package.json 'engines' are already up-to-date.`
			)
		}
	} catch (error) {
		console.error(`Failed to update package.json:`, error)
		window?.showErrorMessage(
			`Failed to update package.json: ${JSON.parse(JSON.stringify(error))?.message ?? error}`
		)
	}
}

export default updateVersionRanges