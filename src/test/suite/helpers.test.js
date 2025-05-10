import assert from 'assert'
import { suite, test } from 'mocha'
import { formatVersionRange } from './mockHelpers.js'

suite('Helpers Tests', () => {
    test('formatVersionRange should format node and npm ranges correctly', () => {
        // Test with provided min and max versions
        const formattedNode = formatVersionRange('10.0.0', '14.0.0')
        assert.strictEqual(formattedNode, '>=10.0.0 <=14.0.0')

        // Test with only min version
        const formattedMinOnly = formatVersionRange('10.0.0', null)
        assert.strictEqual(formattedMinOnly, '>=10.0.0')

        // Test with only max version
        const formattedMaxOnly = formatVersionRange(null, '14.0.0')
        assert.strictEqual(formattedMaxOnly, '<=14.0.0')

        // Test with no versions
        const formattedNone = formatVersionRange(null, null)
        assert.strictEqual(formattedNone, null)
    })
})