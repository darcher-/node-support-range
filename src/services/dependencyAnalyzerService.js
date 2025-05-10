/**
 * @fileoverview Service for analyzing project dependencies to determine Node.js and NPM version constraints
 */
import { satisfies } from "semver"
import { STATUS, VERSION } from "../config/constants.js"
import { PackageJsonService } from "./fileSystemService.js"

/**
 * @typedef {import('../types/index.js').ProjectAnalysisResult} ProjectAnalysisResult
 * @typedef {import('../types/index.js').DependencyAnalysisOptions} DependencyAnalysisOptions
 * @typedef {import('../types/index.js').EngineRequirements} EngineRequirements
 * @typedef {import('../types/index.js').VSCodeProgress} VSCodeProgress
 */

/**
 * Service for analyzing project dependencies to determine Node.js and NPM version constraints
 */
export class DependencyAnalyzerService {
    /**
     * Cached Node.js versions to check against
     * @type {string[]}
     * @private
     */
    static #nodeVersions = VERSION.getNodeVersions();

    /**
     * Cached NPM versions to check against
     * @type {string[]}
     * @private
     */
    static #npmVersions = VERSION.NPM_VERSIONS;

    /**
     * Analyze a project to determine compatible Node.js and NPM version ranges
     * @param {string} projectPath - The root path of the project
     * @param {VSCodeProgress} progress - VS Code progress reporter
     * @param {DependencyAnalysisOptions} [options] - Analysis options
     * @returns {Promise<ProjectAnalysisResult | null>} Analysis result or null if analysis failed
     */
    static async analyzeProject(projectPath, progress, options = { includeDev: true }) {
        const packageJsonPath = PackageJsonService.getPackageJsonPath(projectPath)
        const packageJson = PackageJsonService.readPackageJson(packageJsonPath)

        if (!packageJson) {
            return null
        }

        // Get all dependencies to analyze based on options
        const dependencies = DependencyAnalyzerService.#collectDependencies(packageJson, options)

        if (Object.keys(dependencies).length === 0) {
            return {
                projectPackageJsonPath: packageJsonPath,
                minNode: null,
                maxNode: null,
                minNpm: null,
                maxNpm: null,
                note: STATUS.NO_DEPENDENCIES
            }
        }

        // Analyze dependencies
        progress.report({ increment: 10, message: VERSION.UI_PROGRESS_SCANNING_DEPENDENCIES })
        const engineRequirements = await DependencyAnalyzerService.#collectEngineRequirements(
            projectPath,
            dependencies,
            progress
        )

        // Calculate compatible version ranges
        progress.report({
            increment: 90,
            message: "Calculating version ranges..."
        })

        const { minNode, maxNode } = DependencyAnalyzerService.#calculateNodeRange(
            engineRequirements.nodeRanges,
            Object.keys(dependencies).length > 0
        )

        const { minNpm, maxNpm } = DependencyAnalyzerService.#calculateNpmRange(
            engineRequirements.npmRanges
        )

        progress.report({ increment: 100 })

        return {
            projectPackageJsonPath: packageJsonPath,
            minNode,
            maxNode,
            minNpm,
            maxNpm
        }
    }

    /**
     * Collect all dependencies to analyze based on options
     * @param {import('../types/index.js').PackageJson} packageJson - The package.json content
     * @param {DependencyAnalysisOptions} options - Analysis options
     * @returns {Record<string, string>} Combined dependencies object
     * @private
     */
    static #collectDependencies(packageJson, options) {
        const dependencies = {}

        // Standard dependencies are always included
        if (packageJson.dependencies) {
            Object.assign(dependencies, packageJson.dependencies)
        }

        if (options.includeDev && packageJson.devDependencies) {
            Object.assign(dependencies, packageJson.devDependencies)
        }

        if (options.includePeer && packageJson.peerDependencies) {
            Object.assign(dependencies, packageJson.peerDependencies)
        }

        if (options.includeOptional && packageJson.optionalDependencies) {
            Object.assign(dependencies, packageJson.optionalDependencies)
        }

        return dependencies
    }

    /**
     * Collect engine requirements from dependencies
     * @param {string} projectPath - The project root path
     * @param {Record<string, string>} dependencies - Dependencies object
     * @param {VSCodeProgress} progress - VS Code progress reporter
     * @returns {Promise<EngineRequirements>} Collected engine requirements
     * @private
     */
    static async #collectEngineRequirements(projectPath, dependencies, progress) {
        const nodeRanges = []
        const npmRanges = []

        let depCount = 0
        const totalDeps = Object.keys(dependencies).length

        for (const depName of Object.keys(dependencies)) {
            depCount++
            progress.report({
                increment: (depCount / totalDeps) * 80,
                message: `Analyzing ${depName}...`
            })

            const depPackageJsonPath = PackageJsonService.getDependencyPackageJsonPath(projectPath, depName)
            const depPackageJson = PackageJsonService.readPackageJson(depPackageJsonPath)

            if (depPackageJson) {
                if (depPackageJson.engines) {
                    if (depPackageJson.engines.node) {
                        nodeRanges.push(depPackageJson.engines.node)
                    }
                    if (depPackageJson.engines.npm) {
                        npmRanges.push(depPackageJson.engines.npm)
                    }
                } else {
                    // No engines field implies wide compatibility
                    nodeRanges.push(VERSION.DEFAULT_NODE_RANGE)
                }
            } else {
                // Package not found, assume non-restrictive
                nodeRanges.push(VERSION.DEFAULT_NODE_RANGE)
            }
        }

        return { nodeRanges, npmRanges }
    }

    /**
     * Calculate the compatible Node.js version range
     * @param {string[]} nodeRanges - Node.js version ranges
     * @param {boolean} hasDependencies - Whether the project has dependencies
     * @returns {{minNode: string|null, maxNode: string|null}} Min and max Node.js versions
     * @private
     */
    static #calculateNodeRange(nodeRanges, hasDependencies) {
        let minNode = null
        let maxNode = null

        if (nodeRanges.length > 0) {
            const compatibleVersions = DependencyAnalyzerService.#nodeVersions.filter(version =>
                nodeRanges.every(rangeStr => {
                    try {
                        return satisfies(version, rangeStr, { includePrerelease: false })
                    } catch (error) {
                        console.warn(`Invalid semver range "${rangeStr}" for Node. Assuming it doesn't match version ${version}.`)
                        return false
                    }
                })
            )

            if (compatibleVersions.length > 0) {
                minNode = compatibleVersions[0]
                maxNode = compatibleVersions[compatibleVersions.length - 1]
            }
        } else if (hasDependencies) {
            // Has dependencies, but none specified engines
            minNode = DependencyAnalyzerService.#nodeVersions[0]
            maxNode = DependencyAnalyzerService.#nodeVersions[DependencyAnalyzerService.#nodeVersions.length - 1]
        }

        return { minNode, maxNode }
    }

    /**
     * Calculate the compatible NPM version range
     * @param {string[]} npmRanges - NPM version ranges
     * @returns {{minNpm: string|null, maxNpm: string|null}} Min and max NPM versions
     * @private
     */
    static #calculateNpmRange(npmRanges) {
        let minNpm = null
        let maxNpm = null

        if (npmRanges.length > 0) {
            const compatibleVersions = DependencyAnalyzerService.#npmVersions.filter(version =>
                npmRanges.every(rangeStr => {
                    try {
                        return satisfies(version, rangeStr, { includePrerelease: false })
                    } catch (error) {
                        console.warn(`Invalid semver range "${rangeStr}" for NPM. Assuming it doesn't match version ${version}.`)
                        return false
                    }
                })
            )

            if (compatibleVersions.length > 0) {
                minNpm = compatibleVersions[0]
                maxNpm = compatibleVersions[compatibleVersions.length - 1]
            }
        }

        return { minNpm, maxNpm }
    }

    /**
     * Format a version range string
     * @param {string|null} minVersion - Minimum version
     * @param {string|null} maxVersion - Maximum version
     * @returns {string|null} Formatted version range or null if both inputs are null
     */
    static formatVersionRange(minVersion, maxVersion) {
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
}
