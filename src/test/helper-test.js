// filepath: /Users/darcher/dev/node-support-range/src/test/helper-test.js
import assert from 'assert'
import { formatVersionRange } from './mock-standalone-helpers.js'

console.log('Running helper tests...')

/**
 * Tests the formatVersionRange helper function with various inputs
 */
function testFormatVersionRange() {
    console.log('Testing formatVersionRange...')

    // Test with both min and max
    assert.strictEqual(
        formatVersionRange('12.0.0', '16.0.0'),
        '>=12.0.0 <=16.0.0',
        'Should format with min and max correctly'
    )

    // Test with only min version
    assert.strictEqual(
        formatVersionRange('12.0.0', null),
        '>=12.0.0',
        'Should format with only min correctly'
    )

    // Test with only max version
    assert.strictEqual(
        formatVersionRange(null, '16.0.0'),
        '<=16.0.0',
        'Should format with only max correctly'
    )

    // Test with neither
    assert.strictEqual(
        formatVersionRange(null, null),
        null,
        'Should return null when no versions provided'
    )

    console.log('✓ formatVersionRange tests passed')
}

/**
 * Runs all test functions
 */
function runAllTests() {
    testFormatVersionRange()
    console.log('All tests passed!')
}

// Execute tests
runAllTests()
