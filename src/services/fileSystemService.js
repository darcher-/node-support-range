/**
 * @fileoverview File system utilities for reading and updating package.json files
 */
import { existsSync, readFileSync } from "fs"
import { join } from "path"
import { Range, WorkspaceEdit, window, workspace } from "vscode"
import { FILE } from "../config/constants.js"

/**
 * @typedef {import('../types/index.js').PackageJson} PackageJson
 */

/**
 * Utility class for working with package.json files
 */
export class PackageJsonService {
    /**
     * Read a package.json file
     * @param {string} filePath - Path to the package.json file
     * @returns {PackageJson|null} The parsed package.json or null if not found
     * @throws {Error} If the file cannot be parsed
     */
    static readPackageJson(filePath) {
        if (!existsSync(filePath)) {
            return null
        }

        try {
            return JSON.parse(readFileSync(filePath, FILE.ENCODING))
        } catch (error) {
            throw new Error(`Error parsing ${filePath}: ${error instanceof Error ? error.message : String(error)}`)
        }
    }

    /**
     * Get the path to a package.json file
     * @param {string} directory - The directory containing the package.json
     * @returns {string} Path to the package.json file
     */
    static getPackageJsonPath(directory) {
        return join(directory, FILE.PACKAGE_JSON)
    }

    /**
     * Get the path to a dependency's package.json file
     * @param {string} projectPath - The project root path
     * @param {string} dependencyName - The name of the dependency
     * @returns {string} Path to the dependency's package.json file
     */
    static getDependencyPackageJsonPath(projectPath, dependencyName) {
        return join(projectPath, FILE.NODE_MODULES, dependencyName, FILE.PACKAGE_JSON)
    }

    /**
     * Update the engines field in a package.json file
     * @param {string} packageJsonPath - Path to the package.json file
     * @param {string|null} nodeEngineString - Node.js version range or null
     * @param {string|null} npmEngineString - NPM version range or null
     * @returns {Promise<boolean>} True if the file was updated, false otherwise
     */
    static async updateEngines(packageJsonPath, nodeEngineString, npmEngineString) {
        try {
            const doc = await workspace.openTextDocument(packageJsonPath)
            const packageJson = JSON.parse(doc.getText())

            // Ensure the engines property exists
            if (!packageJson.engines) {
                packageJson.engines = {}
            }

            let updated = false

            if (nodeEngineString && packageJson.engines.node !== nodeEngineString) {
                packageJson.engines.node = nodeEngineString
                updated = true
            }

            if (npmEngineString && packageJson.engines.npm !== npmEngineString) {
                packageJson.engines.npm = npmEngineString
                updated = true
            }

            if (!updated) {
                return false
            }

            // Apply the updates
            const edit = new WorkspaceEdit()
            const fullRange = new Range(
                doc.positionAt(0),
                doc.positionAt(doc.getText().length)
            )

            // Attempt to preserve formatting
            const indentMatch = doc.getText().match(/^(\s+)"/m)
            const indent = indentMatch ? indentMatch[1].length : FILE.DEFAULT_JSON_INDENT

            edit.replace(
                doc.uri,
                fullRange,
                JSON.stringify(packageJson, null, indent)
            )

            await workspace.applyEdit(edit)
            await window.showTextDocument(doc)

            return true
        } catch (error) {
            throw new Error(`Failed to update ${FILE.PACKAGE_JSON}: ${error instanceof Error ? error.message : String(error)}`)
        }
    }
}
