/**
 * @fileoverview Type definitions for the Node Support Range extension
 */

import { Hover } from 'vscode'

/**
 * @typedef {import('vscode').Uri} VSCodeUri
 * @typedef {import('vscode').ExtensionContext} VSCodeExtensionContext
 * @typedef {import('vscode').TextDocument} VSCodeTextDocument
 * @typedef {import('vscode').Position} VSCodePosition
 * @typedef {import('vscode').CancellationToken} VSCodeCancellationToken
 * @typedef {import('vscode').ProviderResult<Hover>} VSCodeHoverProviderResult
 * @typedef {import('vscode').Progress<{message?: string; increment?: number}>} VSCodeProgress
 * @typedef {import('vscode').WorkspaceFolder} VSCodeWorkspaceFolder
 * @typedef {import('vscode').WorkspaceEdit} VSCodeWorkspaceEdit
 * @typedef {import('vscode').Range} VSCodeRange
 */

/**
 * @typedef {string[]} SemVer - Array of semantic version strings
 */

/**
 * @typedef {object} DependencyAnalysisOptions
 * @property {boolean} [includeDev=true] - Whether to include devDependencies in the analysis
 * @property {boolean} [includePeer=false] - Whether to include peerDependencies in the analysis
 * @property {boolean} [includeOptional=false] - Whether to include optionalDependencies in the analysis
 */

/**
 * @typedef {object} ProjectAnalysisResult
 * @property {string} projectPackageJsonPath - The path to the project's package.json
 * @property {string | null} minNode - The determined minimum supported Node.js version
 * @property {string | null} maxNode - The determined maximum supported Node.js version
 * @property {string | null} minNpm - The determined minimum supported NPM version
 * @property {string | null} maxNpm - The determined maximum supported NPM version
 * @property {string} [note] - An optional note, e.g., if no dependencies were found
 */

/**
 * @typedef {object} EngineRequirements
 * @property {string[]} nodeRanges - List of Node.js version requirements
 * @property {string[]} npmRanges - List of NPM version requirements
 */

/**
 * @typedef {object} PackageJsonEngines
 * @property {string} [node] - The Node.js version requirement
 * @property {string} [npm] - The NPM version requirement
 */

/**
 * @typedef {object} PackageJson
 * @property {Record<string, string>} [dependencies] - The dependencies
 * @property {Record<string, string>} [devDependencies] - The development dependencies
 * @property {Record<string, string>} [peerDependencies] - The peer dependencies
 * @property {Record<string, string>} [optionalDependencies] - The optional dependencies
 * @property {PackageJsonEngines} [engines] - The engine requirements
 */

export { }
