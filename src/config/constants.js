/**
 * @fileoverview Configuration constants for the Node Support Range extension
 */
import { compare, valid } from "semver"

/**
 * @typedef {import('../types/index.js').SemVer} SemVer
 */

/**
 * Extension constants
 */
export const EXTENSION = {
    ID: 'node-support-range',
    COMMAND_ID: 'node-support-limits.analyzeDependencies',
    ACTIVATION_LOG: 'Extension "node-support-limits" is now active.',
}

/**
 * UI-related constants
 */
export const UI = {
    PROGRESS: {
        TITLE: "Analyzing Node/NPM Support Limits...",
        READING_PACKAGE_JSON: "Reading project package.json...",
        SCANNING_DEPENDENCIES: "Scanning dependencies...",
        CALCULATING_RANGES: "Calculating version ranges...",
    },
    MESSAGES: {
        NO_WORKSPACE_FOLDER: "No workspace folder found. Open a project to analyze dependencies.",
        NO_DEPENDENCIES: "No dependencies in project. Cannot determine support limits based on dependencies.",
        NO_NODE_RANGE: "Could not determine a compatible Node.js version range for the project dependencies.",
        NPM_RANGE_UNAVAILABLE: "(Could not determine a specific range from dependencies; consider adding manually if needed)",
        UPDATE_SUCCESS: "package.json has been updated with new 'engines' settings.",
        ALREADY_UP_TO_DATE: "package.json 'engines' are already up-to-date.",
        NPM_RANGE_TEMPLATE: (npmEngineString) => `\nNPM: "${npmEngineString}"`,
        NODE_RANGE_TEMPLATE: (nodeEngineString) => `Node: "${nodeEngineString}"`,
        ENGINES_RECOMMENDATION: (workspaceName, nodeEngineString, npmEngineString) => {
            let message = `Recommended 'engines' for ${workspaceName}:\n${UI.MESSAGES.NODE_RANGE_TEMPLATE(nodeEngineString)}`

            if (npmEngineString) {
                message += UI.MESSAGES.NPM_RANGE_TEMPLATE(npmEngineString)
            } else {
                message += `\nNPM: ${UI.MESSAGES.NPM_RANGE_UNAVAILABLE}`
            }

            return message
        }
    },
    BUTTONS: {
        UPDATE_PACKAGE_JSON: "Update package.json"
    },
    HOVER: {
        ANALYZE_PROJECT: "Analyze Node/NPM Support Limits for project",
        PACKAGE_JSON_SELECTOR: { scheme: "file", language: "json", pattern: "**/package.json" }
    }
}

/**
 * File system constants
 */
export const FILE = {
    PACKAGE_JSON: "package.json",
    NODE_MODULES: "node_modules",
    ENCODING: "utf8",
    DEFAULT_JSON_INDENT: 2
}

/**
 * Node and NPM version-related constants
 */
export const VERSION = {
    /**
     * Static list of Node.js versions to test compatibility against.
     * @type {string[]}
     */
    NODE_VERSIONS_WITH_ALIASES: [
        "lts/hydrogen", // 18.x
        "18.20.8", // lts/hydrogen
        "lts/iron", // 20.x
        "20.19.1", // lts/iron
        "lts/jod", // 22.x
        "22.15.0", // lts/jod
        "24.0.1", // current
    ],

    /**
     * Default fallback Node.js version requirement
     */
    DEFAULT_NODE_RANGE: ">=0.10.0",

    /**
     * Default fallback NPM version requirement
     */
    DEFAULT_NPM_RANGE: ">=5.0.0",

    /**
     * Get a filtered and sorted list of valid Node.js versions
     * @returns {SemVer} - Sorted array of valid Node.js versions
     */
    getNodeVersions() {
        return VERSION.NODE_VERSIONS_WITH_ALIASES
            .filter(v => valid(v))
            .sort(compare)
    },

    /**
     * List of common NPM versions to test compatibility against
     * @type {SemVer}
     */
    NPM_VERSIONS: [
        "10.8.2", // lts/(iron & hydrogen) npm
        "10.9.2", // lts/jod npm
        "11.3.0", // latest-npm
    ].sort(compare)
}

/**
 * Constants related to what dependency types to check in package.json
 */
export const DEPENDENCY_TYPES = {
    STANDARD: "dependencies",
    DEV: "devDependencies",
    PEER: "peerDependencies",
    OPTIONAL: "optionalDependencies",

    /**
     * Keys to check for hovering in package.json
     */
    KEYS_FOR_HOVER: ["dependencies", "devDependencies", "peerDependencies"]
}

/**
 * Status and error message constants
 */
export const STATUS = {
    NO_DEPENDENCIES: "No dependencies to analyze."
}
