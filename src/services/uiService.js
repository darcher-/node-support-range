/**
 * @fileoverview Service for handling UI interactions
 */
import { ProgressLocation, window } from "vscode"
import { UI } from "../config/constants.js"

/**
 * Service for handling UI interactions
 */
export class UIService {
    /**
     * Show an error message
     * @param {string} message - The error message
     * @returns {Promise<void>}
     */
    static async showError(message) {
        return window.showErrorMessage(message)
    }

    /**
     * Show an information message
     * @param {string} message - The information message
     * @returns {Promise<void>}
     */
    static async showInfo(message) {
        return window.showInformationMessage(message)
    }

    /**
     * Show an information message with action buttons
     * @param {string} message - The information message
     * @param {string[]} actions - Action button labels
     * @param {boolean} [modal=false] - Whether to show as modal dialog
     * @returns {Promise<string|undefined>} The selected action or undefined
     */
    static async showInfoWithActions(message, actions, modal = false) {
        return window.showInformationMessage(message, { modal }, ...actions)
    }

    /**
     * Run a task with a progress indicator
     * @param {() => Promise<T>} task - The task to run
     * @param {string} [title=UI.PROGRESS.TITLE] - The progress title
     * @returns {Promise<T>} The task result
     * @template T
     */
    static runWithProgress(task, title = UI.PROGRESS.TITLE) {
        return window.withProgress(
            {
                location: ProgressLocation.Notification,
                title,
                cancellable: false
            },
            task
        )
    }
}
