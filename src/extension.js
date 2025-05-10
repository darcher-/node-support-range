/**
 * @fileoverview Main entry point for the Node Support Range extension
 */
import { commands, languages, window, workspace } from "vscode"
import { AnalyzeDependenciesCommand } from "./commands/analyzeDependenciesCommand.js"
import { EXTENSION, UI } from "./config/constants.js"
import { PackageJsonHoverProvider } from "./providers/hoverProvider.js"

/**
 * @typedef {import('./types/index.js').VSCodeExtensionContext} VSCodeExtensionContext
 * @typedef {import('./types/index.js').VSCodeUri} VSCodeUri
 */

/**
 * Activates the extension
 * @param {VSCodeExtensionContext} context - The extension context provided by VS Code
 * @returns {object} Extension API
 */
export const activate = (context) => {
	console.info(EXTENSION.ACTIVATION_LOG);

	// Register the analyze dependencies command
	const analyzeCommand = commands.registerCommand(
		EXTENSION.COMMAND_ID,
        /**
         * Command handler for analyzing dependencies
         * @param {VSCodeUri | undefined} uri - The URI of the file/folder from the command context
         */
		(uri) => AnalyzeDependenciesCommand.execute(uri, window, workspace)
	);

	// Register the hover provider for package.json files
	const hoverProvider = languages.registerHoverProvider(
		UI.HOVER.PACKAGE_JSON_SELECTOR,
		PackageJsonHoverProvider.create()
	);

	// Add disposables to context
	context.subscriptions.push(analyzeCommand, hoverProvider);

	// Return public API
	return {
		context
	}
}

export default activate