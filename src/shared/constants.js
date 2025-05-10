import { compare } from "semver"

/**
 * @typedef {string[]} SemVer
 */

/**
 * Static list of common Node.js versions to test against for compatibility.
 * Includes LTS, active, and recent versions. Sorted for reliable min/max determination.
 * @type {SemVer} - Consider fetching this dynamically or updating periodically. */
export const COMMON_NODEJS_VERSIONS = [
	"18.0.0",
	"18.12.0",
	"18.19.1",
	"18.20.3", //* LTS
	"20.0.0",
	"20.5.0",
	"20.11.1",
	"20.15.1", //* LTS
	"21.0.0",
	"21.7.3",
	"22.0.0",
	"22.4.1", //* Current (as of mid-2024)
].sort(compare)

/**
 * Static list of common NPM versions to test against for compatibility.
 * Sorted for reliable min/max determination.
 * @type {SemVer} */
export const COMMON_NPM_VERSIONS = [
	"8.0.0",
	"8.19.4",
	"9.0.0",
	"9.9.3",
	"10.0.0",
	"10.8.1", //* Recent versions (as of mid-2024)
].sort(compare)

export default { COMMON_NPM_VERSIONS, COMMON_NODEJS_VERSIONS }
