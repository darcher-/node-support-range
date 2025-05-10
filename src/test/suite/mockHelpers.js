import { join } from "path"

// Import constants directly instead of referencing constants.js
export const DEFAULT_JSON_INDENT = 2
export const DEFAULT_NODE_VERSION_RANGE = '>=0.10.0'
export const NODE_MODULES_DIRNAME = 'node_modules'
export const NOTE_NO_DEPENDENCIES = 'No dependencies found in package.json'
export const PACKAGE_JSON_FILENAME = 'package.json'
export const UTF8_ENCODING = 'utf8'

// Mock the vscode imports
export const window = {
    showInformationMessage: () => { },
    showErrorMessage: () => { },
    showTextDocument: () => { }
}

export class WorkspaceEdit {
    constructor() {
        this.edits = []
    }
    replace() { }
}

export class Range {
    constructor() { }
}

export const workspace = {
    openTextDocument: () => Promise.resolve({
        getText: () => '',
        positionAt: () => ({ line: 0, character: 0 })
    }),
    applyEdit: () => Promise.resolve(true)
}

export const FileType = {
    Unknown: 0,
    File: 1,
    Directory: 2,
    SymbolicLink: 64
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

/**
 * A simplified mock version of updatePackageJsonEngines
 * @param {string} packageJsonPath
 * @param {string|null} nodeEngineString
 * @param {string|null} npmEngineString
 * @returns {Promise<void>}
 */
export const updatePackageJsonEngines = async (packageJsonPath, nodeEngineString, npmEngineString) => {
    // This is a mock that does nothing but fulfill the expected interface
    return Promise.resolve()
}

/**
 * A simplified mock version of analyzeProjectDependencies
 * @param {string} projectPath
 * @param {{report: Function}} progress
 * @returns {Promise<{projectPackageJsonPath: string, minNode: string|null, maxNode: string|null, minNpm: string|null, maxNpm: string|null, note?: string}>}
 */
export const analyzeProjectDependencies = async (projectPath, progress) => {
    // This is a mock implementation
    if (typeof progress?.report === 'function') {
        progress.report({ increment: 100 })
    }

    return {
        projectPackageJsonPath: join(projectPath, PACKAGE_JSON_FILENAME),
        minNode: '14.0.0',
        maxNode: '16.0.0',
        minNpm: '6.0.0',
        maxNpm: '8.0.0'
    }
}

/**
 * A simplified mock version of determineWorkspaceFolder
 * @returns {Promise<{uri: {fsPath: string}}>}
 */
export const determineWorkspaceFolder = async () => {
    return Promise.resolve({
        uri: { fsPath: '/mock/workspace' }
    })
}
