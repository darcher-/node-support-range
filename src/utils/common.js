/**
 * @fileoverview Common utility functions for the extension
 */

/**
 * Safely stringify an error to a JSON-serializable format
 * @param {unknown} error - The error to stringify
 * @returns {string} A string representation of the error
 */
export const stringifyError = (error) => {
    if (error instanceof Error) {
        return error.message
    }

    try {
        return JSON.stringify(error)
    } catch {
        return String(error)
    }
}

/**
 * Safely parse JSON with error handling
 * @param {string} json - The JSON string to parse
 * @returns {any} The parsed JSON object
 * @throws {Error} If the JSON is invalid
 */
export const safeJsonParse = (json) => {
    try {
        return JSON.parse(json)
    } catch (error) {
        throw new Error(`Invalid JSON: ${stringifyError(error)}`)
    }
}

/**
 * Formats a version range string in the format used by package.json engines field
 * @param {string|null} minVersion - The minimum version to include in the range
 * @param {string|null} maxVersion - The maximum version to include in the range
 * @returns {string|null} A formatted version range string, or null if both inputs are null
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
 * Check if an object is empty
 * @param {object|null|undefined} obj - The object to check
 * @returns {boolean} True if the object is null, undefined, or has no own properties
 */
export const isEmptyObject = (obj) => {
    if (obj == null) {
        return true
    }

    return Object.keys(obj).length === 0
}
