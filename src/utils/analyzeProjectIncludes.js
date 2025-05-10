import { existsSync, readFileSync } from "fs"
import { join } from "path"
import { satisfies } from "semver"
import { window } from "vscode"
import {
	COMMON_NODEJS_VERSIONS,
	COMMON_NPM_VERSIONS,
} from "../shared/constants.js"

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
 * Analyzes the project to find the supported Node and NPM version ranges.
 * @param {string} projectPath The root path of the project.
 * @param {import('vscode').Progress<{ message?: string; increment?: number }>} progress
 * @returns {Promise<ProjectAnalysisResult | null>}
 */
export const analyzeProjectIncludes = async (projectPath, progress) => {
	/** @type {string|URL} */
	const projectPackageJsonPath = join(projectPath, "package.json")
	if (!existsSync(projectPackageJsonPath)) {
		window?.showErrorMessage(`package.json not found in ${projectPath}`)
		return null
	}

	let projectPackageJson
	try {
		projectPackageJson = JSON.parse(
			readFileSync(projectPackageJsonPath, "utf8")
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
			note: "No dependencies to analyze.",
		}
	}

	progress.report({ increment: 10, message: "Scanning dependencies..." })

	/** @type {String|URL} */
	const nodeModulesPath = join(projectPath, "node_modules")

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
		progress.report({
			increment: (depCount / totalDeps) * 80,
			message: `Analyzing ${depName}...`,
		})

		const depPackageJsonPath = join(nodeModulesPath, depName, "package.json")
		if (existsSync(depPackageJsonPath)) {
			try {
				const depPackageJson = JSON.parse(
					readFileSync(depPackageJsonPath, "utf8")
				)
				if (depPackageJson.engines) {
					if (depPackageJson.engines.node) {
						allNodeRanges.push(depPackageJson.engines.node)
					}
					if (depPackageJson.engines.npm) {
						allNpmRanges.push(depPackageJson.engines.npm)
					}
				} else {
					//? No engines field implies compatibility with a wide range. For Node, effectively ">=0.10.0" or similar very old version. This won't unduly restrict the lower bound unless other packages are more restrictive.
					allNodeRanges.push(">=0.10.0")
				}
			} catch (error) {
				console.warn(
					`Could not parse package.json for dependency ${depName}: ${JSON.parse(JSON.stringify(error))?.message ?? error}. Assuming non-restrictive.`
				)
				allNodeRanges.push(">=0.10.0")
			}
		} else {
			console.warn(
				`package.json not found for ${depName}. It might be bundled or not installed. Assuming non-restrictive.`
			)
			allNodeRanges.push(">=0.10.0") //* Assume non-restrictive if not found
		}
	}

	progress.report({ increment: 90, message: "Calculating version ranges..." })

	//? Calculate Node range
	let minNode = null,
		maxNode = null
	if (allNodeRanges.length > 0) {
		const compatibleNodeVersions = COMMON_NODEJS_VERSIONS.filter(version =>
			allNodeRanges.every(rangeStr => {
				try {
					return satisfies(version, rangeStr, { includePrerelease: false })
				} catch (_error) {
					console.error({ _error })
					console.warn(
						`Invalid semver range "${rangeStr}" for Node for dep. Assuming it doesn't match version ${version}.`
					)
					return false
				}
			})
		)
		if (compatibleNodeVersions.length > 0) {
			minNode = compatibleNodeVersions[0]
			maxNode = compatibleNodeVersions[compatibleNodeVersions.length - 1]
		}
	} else if (Object.keys(dependencies).length > 0) {
		//* Has dependencies, but none specified engines
		minNode = COMMON_NODEJS_VERSIONS[0] //* Default to oldest known if deps exist but don't constrain
		maxNode = COMMON_NODEJS_VERSIONS[COMMON_NODEJS_VERSIONS.length - 1]
	}

	//? Calculate NPM range
	let minNpm = null,
		maxNpm = null
	if (allNpmRanges.length > 0) {
		const compatibleNpmVersions = COMMON_NPM_VERSIONS.filter(version =>
			allNpmRanges.every(rangeStr => {
				try {
					return satisfies(version, rangeStr, { includePrerelease: false })
				} catch (_error) {
					console.error({ _error })
					console.warn(
						`Invalid semver range "${rangeStr}" for NPM. Assuming it doesn't match version ${version}.`
					)
					return false
				}
			})
		)
		if (compatibleNpmVersions.length > 0) {
			minNpm = compatibleNpmVersions[0]
			maxNpm = compatibleNpmVersions[compatibleNpmVersions.length - 1]
		}
	}
	progress.report({ increment: 100 })
	return { projectPackageJsonPath, minNode, maxNode, minNpm, maxNpm }
}

export default analyzeProjectIncludes