/**
 * @fileoverview Provider for hover functionality in package.json files
 */
import { Hover, MarkdownString } from "vscode"
import { DEPENDENCY_TYPES, UI } from "../config/constants.js"

/**
 * @typedef {import('../types/index.js').VSCodeTextDocument} VSCodeTextDocument
 * @typedef {import('../types/index.js').VSCodePosition} VSCodePosition
 * @typedef {import('../types/index.js').VSCodeCancellationToken} VSCodeCancellationToken
 * @typedef {import('../types/index.js').VSCodeHoverProviderResult} VSCodeHoverProviderResult
 */

/**
 * Provider for hover functionality in package.json files
 */
export class PackageJsonHoverProvider {
    /**
     * Create a hover provider for package.json files
     * @returns {import('vscode').HoverProvider} The hover provider
     */
    static create() {
        return {
            /**
             * Provides a hover tooltip for package.json dependencies
             * @param {VSCodeTextDocument} document - The document in which the hover was triggered
             * @param {VSCodePosition} position - The position at which the hover was triggered
             * @param {VSCodeCancellationToken} _token - A cancellation token
             * @returns {VSCodeHoverProviderResult} The hover result
             */
            provideHover(document, position, _token) {
                const range = document.getWordRangeAtPosition(
                    position,
                    /"([^"]+)":\s*"([^"]+)"/
                )

                if (!range) {
                    return null
                }

                // Check if hover is within a dependencies block
                let inDepsBlock = false
                for (let lineNum = position.line; lineNum >= 0; lineNum--) {
                    const lineText = document.lineAt(lineNum).text

                    if (DEPENDENCY_TYPES.KEYS_FOR_HOVER.some(key =>
                        lineText.includes(`"${key}":`))) {
                        inDepsBlock = true
                        break
                    }

                    // Start of a new object, not the one we are in
                    if (lineText.match(/^\s*{/) && lineNum !== position.line) {
                        break
                    }
                }

                if (inDepsBlock) {
                    const contents = new MarkdownString(UI.HOVER.ANALYZE_PROJECT)
                    // Mark as trusted to allow command execution
                    contents.isTrusted = true
                    return new Hover(contents, range)
                }

                return null
            }
        }
    }
}
