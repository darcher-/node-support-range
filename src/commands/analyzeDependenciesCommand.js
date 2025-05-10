/**
 * @fileoverview Command handler for analyzing dependencies
 */
import { STATUS, UI } from "../config/constants.js"
import { DependencyAnalyzerService } from "../services/dependencyAnalyzerService.js"
import { PackageJsonService } from "../services/fileSystemService.js"
import { UIService } from "../services/uiService.js"
import { WorkspaceService } from "../services/workspaceService.js"

/**
 * @typedef {import('../types/index.js').VSCodeUri} VSCodeUri
 */

/**
 * Handler for the analyze dependencies command
 */
export class AnalyzeDependenciesCommand {
    /**
     * Execute the analyze dependencies command
     * @param {VSCodeUri | undefined} uri - The URI provided by the command context
     * @param {typeof import('vscode').window} vscodeWindow - VS Code window API
     * @param {typeof import('vscode').workspace} vscodeWorkspace - VS Code workspace API
     * @returns {Promise<void>}
     */
    static async execute(uri, vscodeWindow, vscodeWorkspace) {
        // Determine the workspace folder to analyze
        const workspaceFolder = await WorkspaceService.determineWorkspaceFolder(
            uri,
            vscodeWindow,
            vscodeWorkspace
        )

        if (!workspaceFolder) {
            await UIService.showError(UI.MESSAGES.NO_WORKSPACE_FOLDER)
            return
        }

        // Run the analysis with a progress indicator
        await UIService.runWithProgress(async (progress) => {
            try {
                // Initial progress
                progress.report({
                    increment: 0,
                    message: UI.PROGRESS.READING_PACKAGE_JSON
                })

                // Analyze project dependencies
                const result = await DependencyAnalyzerService.analyzeProject(
                    workspaceFolder.uri.fsPath,
                    progress
                )

                if (!result) {
                    return
                }

                // Handle case with no dependencies
                if (result.note === STATUS.NO_DEPENDENCIES) {
                    await UIService.showInfo(UI.MESSAGES.NO_DEPENDENCIES)
                    return
                }

                // Format version ranges
                const nodeEngineString = result.minNode && result.maxNode
                    ? DependencyAnalyzerService.formatVersionRange(result.minNode, result.maxNode)
                    : null

                const npmEngineString = result.minNpm && result.maxNpm
                    ? DependencyAnalyzerService.formatVersionRange(result.minNpm, result.maxNpm)
                    : null

                // Validate Node.js range
                if (!nodeEngineString) {
                    await UIService.showError(UI.MESSAGES.NO_NODE_RANGE)
                    return
                }

                // Show results and offer to update package.json
                const message = UI.MESSAGES.ENGINES_RECOMMENDATION(
                    workspaceFolder.name,
                    nodeEngineString,
                    npmEngineString
                )

                const selection = await UIService.showInfoWithActions(
                    message,
                    [UI.BUTTONS.UPDATE_PACKAGE_JSON],
                    true
                )

                // Update package.json if requested
                if (selection === UI.BUTTONS.UPDATE_PACKAGE_JSON) {
                    const updated = await PackageJsonService.updateEngines(
                        result.projectPackageJsonPath,
                        nodeEngineString,
                        npmEngineString
                    )

                    await UIService.showInfo(
                        updated ? UI.MESSAGES.UPDATE_SUCCESS : UI.MESSAGES.ALREADY_UP_TO_DATE
                    )
                }
            } catch (error) {
                console.error("Error analyzing dependencies:", error)
                const errorMessage = error instanceof Error ? error.message : String(error)
                await UIService.showError(`Error analyzing dependencies: ${errorMessage}`)
            }
        })
    }
}
