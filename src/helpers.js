/**
 * @typedef {import('vscode').Uri} VSCodeUri
 * @typedef {import('vscode').WorkspaceFolder} VSCodeWorkspaceFolder
 * @typedef {import('vscode').TextDocument} VSCodeTextDocument
 * @typedef {import('vscode').Progress<{message?: string; increment?: number}>} VSCodeProgress
 * @typedef {import('vscode').WorkspaceEdit} VSCodeWorkspaceEdit
 * @typedef {import('vscode').Range} VSCodeRange
 */
import { existsSync, readFileSync } from "fs"
import { join } from "path"
import { satisfies } from "semver"
import { FileType, Range, window, workspace, WorkspaceEdit } from "vscode"
import {
    COMMON_NODEJS_VERSIONS,
    COMMON_NPM_VERSIONS,
    DEFAULT_JSON_INDENT,
    DEFAULT_NODE_VERSION_RANGE,
    NODE_MODULES_DIRNAME,
    NOTE_NO_DEPENDENCIES,
    PACKAGE_JSON_FILENAME,
    UTF8_ENCODING,
} from "./constants.js"

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
 * Updates the project's package.json with the new engines.
 * @param {string} packageJsonPath - The file path to the project's package.json.
 * @param {string | null} nodeEngineString - The Node.js engine string to update or add. If null, no changes are made to the Node.js engine.
 * @param {string | null} npmEngineString - The NPM engine string to update or add. If null, no changes are made to the NPM engine.
 * @returns {Promise<void>}
 */
export const updatePackageJsonEngines = async (
    packageJsonPath,
    nodeEngineString,
    npmEngineString
) => {
    try {
        /** @type {VSCodeTextDocument} */
        const doc = await workspace.openTextDocument(packageJsonPath)
        const packageJson = JSON.parse(doc.getText())

        //? Ensure the 'engines' property exists in the package.json
        if (!packageJson.engines) {
            packageJson.engines = {}
        }

        //? Flag to track if any updates were made to the 'engines' property
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
        } else { //? TODO: Consider removing the NPM engine if no specific range is provided
            //? If no specific NPM range, remove it if it exists? Or leave it? For now, only add/update if `npmEngineString` is present.
            /**
             * TODO If you want to remove it:
             * if (packageJson.engines.hasOwnProperty('npm')) {
             *   delete packageJson.engines.npm;
             *   updated = true;
             * }
             */
        }

        if (updated) { //? Apply the updates to the package.json file
            //? Using VS Code's edit API is better for preserving formatting and undo history. However, JSON.stringify is simpler for a quick update. For production, consider using `jsonc-parser` to modify specific nodes.
            const edit = new WorkspaceEdit()
            const fullRange = new Range(
                doc.positionAt(0),
                doc.positionAt(doc.getText().length)
            )

            //? Attempt to preserve some formatting by getting indent from original file
            const indentMatch = doc.getText().match(/^(\s+)"/m)
            const indent = indentMatch ? indentMatch[1].length : DEFAULT_JSON_INDENT

            edit.replace(
                doc.uri,
                fullRange,
                JSON.stringify(packageJson, null, indent)
            )
            await workspace.applyEdit(edit)
            //? Show a success message to the user
            window?.showInformationMessage(
                `${PACKAGE_JSON_FILENAME} has been updated with new 'engines' settings.`
            )
            await window?.showTextDocument(doc) //* Show the updated file
        } else {
            window?.showInformationMessage(
                `${PACKAGE_JSON_FILENAME} 'engines' are already up-to-date.`
            )
        }
    } catch (error) {
        console.error(`Failed to update ${PACKAGE_JSON_FILENAME}:`, error)
        window?.showErrorMessage(
            `Failed to update ${PACKAGE_JSON_FILENAME}: ${JSON.parse(JSON.stringify(error))?.message ?? error}`
        )
    }
}

/**
 * Analyzes the project to find the supported Node and NPM version ranges.
 * @param {string} projectPath The root path of the project.
 * @param {VSCodeProgress} progress
 * @returns {Promise<ProjectAnalysisResult | null>}
 */
export const analyzeProjectDependencies = async (projectPath, progress) => {
    /** @type {string|URL} */
    const projectPackageJsonPath = join(projectPath, PACKAGE_JSON_FILENAME)
    if (!existsSync(projectPackageJsonPath)) {
        window?.showErrorMessage(`${PACKAGE_JSON_FILENAME} not found in ${projectPath}`)
        return null
    }

    let projectPackageJson
    try {
        projectPackageJson = JSON.parse(
            readFileSync(projectPackageJsonPath, UTF8_ENCODING)
        )
    } catch (error) {
        window?.showErrorMessage(
            `Error parsing ${projectPackageJsonPath}: ${JSON.parse(JSON.stringify(error))?.message ?? error}`
        )
        return null
    }

    const dependencies = {
        ...(projectPackageJson.dependencies || {}),
        ...(projectPackageJson.devDependencies || {}),
    }

    if (Object.keys(dependencies).length === 0) {
        return {
            projectPackageJsonPath,
            minNode: null,
            maxNode: null,
            minNpm: null,
            maxNpm: null,
            note: NOTE_NO_DEPENDENCIES,
        }
    }

    progress.report({ increment: 10, message: "Scanning dependencies..." }) //? Report initial progress for dependency scanning

    /** @type {String|URL} */
    const nodeModulesPath = join(projectPath, NODE_MODULES_DIRNAME)

    /** @type {*[]} */
    const allNodeRanges = []

    /** @type {*[]} */
    const allNpmRanges = []

    /** @type {Number} */
    let depCount = 0

    /** @type {Number} */
    const totalDeps = Object.keys(dependencies).length

    for (const depName of Object.keys(dependencies)) {
        depCount++
        progress.report({ //? Report progress for each dependency being analyzed
            increment: (depCount / totalDeps) * 80,
            message: `Analyzing ${depName}...`,
        })

        const depPackageJsonPath = join(nodeModulesPath, depName, PACKAGE_JSON_FILENAME)
        if (existsSync(depPackageJsonPath)) {
            try {
                const depPackageJson = JSON.parse(readFileSync(depPackageJsonPath, UTF8_ENCODING))
                if (depPackageJson.engines) { //? Check if the dependency has an "engines" field
                    if (depPackageJson.engines.node) { //? If it specifies a Node.js version
                        allNodeRanges.push(depPackageJson.engines.node)
                    }
                    if (depPackageJson.engines.npm) { //? If it specifies an NPM version
                        allNpmRanges.push(depPackageJson.engines.npm) //? Add the NPM range to the list
                    }
                } else {
                    //? No engines field implies compatibility with a wide range. For Node, effectively ">=0.10.0" or similar very old version. This won't unduly restrict the lower bound unless other packages are more restrictive.
                    allNodeRanges.push(DEFAULT_NODE_VERSION_RANGE)
                }
            } catch (error) {
                console.warn(
                    `Could not parse ${PACKAGE_JSON_FILENAME} for dependency ${depName}: ${JSON.parse(JSON.stringify(error))?.message ?? error}. Assuming non-restrictive.`
                )
                allNodeRanges.push(DEFAULT_NODE_VERSION_RANGE)
            }
        } else {
            console.warn(
                `${PACKAGE_JSON_FILENAME} not found for ${depName}. It might be bundled or not installed. Assuming non-restrictive.`
            )
            allNodeRanges.push(DEFAULT_NODE_VERSION_RANGE) //* Assume non-restrictive if not found
        }
    }

    progress.report({ increment: 90, message: "Calculating version ranges..." }) //? Report progress for calculating the final version ranges

    //? Calculate Node range
    let minNode = null,
        maxNode = null
    if (allNodeRanges.length > 0) {
        const compatibleNodeVersions = COMMON_NODEJS_VERSIONS.filter(version =>
            allNodeRanges.every(rangeStr => {
                try {
                    return satisfies(version, rangeStr, { includePrerelease: false }) //? Check if the Node.js version satisfies the given range
                } catch (_error) {
                    console.error({ _error })
                    console.warn( //? Warn about invalid semver ranges and assume no match
                        `Invalid semver range "${rangeStr}" for Node for dep. Assuming it doesn't match version ${version}.`
                    )
                    return false
                }
            })
        )
        if (compatibleNodeVersions.length > 0) {
            minNode = compatibleNodeVersions[0] //? The first compatible version is the minimum
            maxNode = compatibleNodeVersions[compatibleNodeVersions.length - 1] //? The last compatible version is the maximum
        }
    } else if (Object.keys(dependencies).length > 0) {
        //* Has dependencies, but none specified engines
        minNode = COMMON_NODEJS_VERSIONS[0] //* Default to oldest known if deps exist but don't constrain
        maxNode = COMMON_NODEJS_VERSIONS[COMMON_NODEJS_VERSIONS.length - 1]
    } //? If no compatible versions are found, the range remains null

    //? Calculate NPM range
    let minNpm = null,
        maxNpm = null
    if (allNpmRanges.length > 0) {
        const compatibleNpmVersions = COMMON_NPM_VERSIONS.filter(version =>
            allNpmRanges.every(rangeStr => {
                try {
                    return satisfies(version, rangeStr, { includePrerelease: false }) //? Check if the NPM version satisfies the given range
                } catch (_error) {
                    console.error({ _error })
                    console.warn( //? Warn about invalid semver ranges and assume no match
                        `Invalid semver range "${rangeStr}" for NPM. Assuming it doesn't match version ${version}.`
                    )
                    return false
                }
            })
        )
        if (compatibleNpmVersions.length > 0) {
            minNpm = compatibleNpmVersions[0] //? The first compatible version is the minimum
            maxNpm = compatibleNpmVersions[compatibleNpmVersions.length - 1] //? The last compatible version is the maximum
        }
    }
    progress.report({ increment: 100 }) //? Report completion of the analysis
    return { projectPackageJsonPath, minNode, maxNode, minNpm, maxNpm }
}

// Ensure ProjectAnalysisResult is defined above its use in analyzeProjectDependencies JSDoc

/**
 * Determines the workspace folder to operate on.
 * @param {VSCodeUri | undefined} initialUri - The URI of the folder/workspace to analyze, if provided.
 * @param {typeof window} vscodeWindow - The VS Code window object.
 * @param {typeof workspace} vscodeWorkspace - The VS Code workspace object.
 * @returns {Promise<VSCodeWorkspaceFolder | undefined>} The determined workspace folder, or undefined if none could be determined.
 */
export const determineWorkspaceFolder = async (initialUri, vscodeWindow, vscodeWorkspace) => {
    /** @type {VSCodeWorkspaceFolder | undefined} */
    let folderToAnalyze

    if (initialUri) {
        try {
            const stats = await vscodeWorkspace.fs.stat(initialUri)
            if (stats.type === FileType.Directory) {
                folderToAnalyze = vscodeWorkspace.getWorkspaceFolder(initialUri)
            }
        } catch (e) {
            console.warn(`Error stating URI ${initialUri.toString()}:`, e)
            // folderToAnalyze remains undefined
        }
    } else if (
        vscodeWindow.activeTextEditor &&
        vscodeWindow.activeTextEditor.document.uri
    ) {
        folderToAnalyze = vscodeWorkspace.getWorkspaceFolder(
            vscodeWindow.activeTextEditor.document.uri
        )
    }

    if (
        !folderToAnalyze &&
        vscodeWorkspace.workspaceFolders &&
        vscodeWorkspace.workspaceFolders.length > 0
    ) {
        folderToAnalyze = vscodeWorkspace.workspaceFolders.length === 1 ? vscodeWorkspace.workspaceFolders[0] : await vscodeWindow.showWorkspaceFolderPick()
        // If showWorkspaceFolderPick returns undefined (no folder picked), folderToAnalyze will be undefined.
    }
    return folderToAnalyze
}

/**
 * Formats a version range string in the format used by package.json engines field.
 * @param {string|null} minVersion - The minimum version to include in the range.
 * @param {string|null} maxVersion - The maximum version to include in the range.
 * @returns {string|null} A formatted version range string, or null if both inputs are null.
 */
export const formatVersionRange = (minVersion, maxVersion) => {
    if (!minVersion && !maxVersion) {
        return null
    }

    let range = ''

    if (minVersion) {
        range += `>=${minVersion}`
    }

    if (maxVersion) {
        if (minVersion) {
            range += ' '
        }
        range += `<=${maxVersion}`
    }

    return range
}
