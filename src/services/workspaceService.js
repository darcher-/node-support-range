/**
 * @fileoverview Service for working with VS Code workspace folders
 */
import { FileType } from "vscode"

/**
 * @typedef {import('../types/index.js').VSCodeUri} VSCodeUri
 * @typedef {import('../types/index.js').VSCodeWorkspaceFolder} VSCodeWorkspaceFolder
 */

/**
 * Service for working with VS Code workspace folders
 */
export class WorkspaceService {
    /**
     * Determine the workspace folder to analyze
     * @param {VSCodeUri | undefined} initialUri - URI if command was executed with context
     * @param {typeof import('vscode').window} vscodeWindow - VS Code window API
     * @param {typeof import('vscode').workspace} vscodeWorkspace - VS Code workspace API
     * @returns {Promise<VSCodeWorkspaceFolder | undefined>} Workspace folder or undefined
     */
    static async determineWorkspaceFolder(initialUri, vscodeWindow, vscodeWorkspace) {
        let folderToAnalyze

        // Case 1: URI was provided (from context menu)
        if (initialUri) {
            try {
                const stats = await vscodeWorkspace.fs.stat(initialUri)
                if (stats.type === FileType.Directory) {
                    folderToAnalyze = vscodeWorkspace.getWorkspaceFolder(initialUri)
                }
            } catch (error) {
                console.warn(`Error stating URI ${initialUri.toString()}:`, error)
            }
        }
        // Case 2: Try to use active editor
        else if (vscodeWindow.activeTextEditor?.document.uri) {
            folderToAnalyze = vscodeWorkspace.getWorkspaceFolder(
                vscodeWindow.activeTextEditor.document.uri
            )
        }

        // Case 3: If still no folder, try workspace folders
        if (!folderToAnalyze && vscodeWorkspace.workspaceFolders?.length > 0) {
            folderToAnalyze = vscodeWorkspace.workspaceFolders.length === 1
                ? vscodeWorkspace.workspaceFolders[0]
                : await vscodeWindow.showWorkspaceFolderPick()
        }

        return folderToAnalyze
    }
}
