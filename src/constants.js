/**
 * @typedef {string[]} SemVer
 */
import { compare, valid } from "semver"

/** @type {boolean} */
export const ENABLE_CONSOLE_LOGS = false

/**
 * Static list of common Node.js versions to test against for compatibility.
 * Includes LTS, active, and recent versions. Sorted for reliable min/max determination.
 * @type {SemVer} - Consider fetching this dynamically or updating periodically. */
const NODEJS_VERSIONS_WITH_ALIASES = [
    "lts/hydrogen", //? 18.x
    "18.20.8", //* lts/hydrogen
    "lts/iron", //? 20.x
    "20.19.1", //* lts/iron
    "lts/jod", //? 22.x
    "22.15.0", //* lts/jod
    "24.0.1", //* current // Example, ensure this is a valid current version
]

export const COMMON_NODEJS_VERSIONS = NODEJS_VERSIONS_WITH_ALIASES
    .filter(v => valid(v)) // Keep only valid semver strings
    .sort(compare)
/**
 * Static list of common NPM versions to test against for compatibility.
 * Sorted for reliable min/max determination.
 * @type {SemVer} */
export const COMMON_NPM_VERSIONS = [
    "10.8.2", //* lts/(iron & hydrogen) npm
    "10.9.2", //* lts/jod npm
    "11.3.0", //* latest-npm
].sort(compare)

// File and Directory Names
export const PACKAGE_JSON_FILENAME = "package.json"
export const NODE_MODULES_DIRNAME = "node_modules"

// Default Values
export const DEFAULT_NODE_VERSION_RANGE = ">=0.10.0"
export const DEFAULT_NPM_VERSION_RANGE = ">=5.0.0"
export const DEFAULT_JSON_INDENT = 2
export const UTF8_ENCODING = "utf8"

// Notes and Messages
export const NOTE_NO_DEPENDENCIES = "No dependencies to analyze."

// Extension-specific constants
export const COMMAND_ID_ANALYZE_DEPENDENCIES = "node-support-limits.analyzeDependencies"
export const LOG_EXTENSION_ACTIVE = 'Extension "node-support-limits" is now active.'

// Progress Messages
export const PROGRESS_TITLE_ANALYZE_DEPENDENCIES = "Analyzing Node/NPM Support Limits..."
export const PROGRESS_MSG_READING_PACKAGE_JSON = "Reading project package.json..."

// UI Texts
export const ACTION_BUTTON_UPDATE_PACKAGE_JSON = "Update package.json"

// Hover Provider Constants
export const HOVER_SELECTOR_PACKAGE_JSON = { scheme: "file", language: "json", pattern: `**/package.json` } // Using literal here for simplicity, or use `**/` + PACKAGE_JSON_FILENAME
export const HOVER_MARKDOWN_ANALYZE_PROJECT = `Analyze Node/NPM Support Limits for project`
export const DEPENDENCY_KEYS_FOR_HOVER = ["dependencies", "devDependencies", "peerDependencies"]