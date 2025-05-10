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
