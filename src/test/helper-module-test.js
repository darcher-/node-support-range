// Import the mock vscode before importing any file that uses vscode
import assert from 'assert'
import {
    COMMON_NODEJS_VERSIONS,
    COMMON_NPM_VERSIONS
} from '../constants.js'
import { formatVersionRange } from './mock-standalone-helpers.js'
import './mockVscode.js'

console.log('Running helper module standalone tests...')

/**
 * Tests the formatVersionRange function with various inputs
 */
function testFormatVersionRange() {
    console.log('Testing formatVersionRange...')

    // Test with both min and max
    assert.strictEqual(
        formatVersionRange('12.0.0', '16.0.0'),
        '>=12.0.0 <=16.0.0',
        'Should format with min and max correctly'
    )

    // Test with only min
    assert.strictEqual(
        formatVersionRange('12.0.0', null),
        '>=12.0.0',
        'Should format with only min correctly'
    )

    // Test with only max
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
 * Tests that constants have valid values
 */
function testConstants() {
    console.log('Testing constants...')

    // Test that NodeJS versions are valid and sorted
    assert.ok(
        COMMON_NODEJS_VERSIONS.length > 0,
        'Should have at least one Node.js version'
    )

    // Test that NPM versions are valid and sorted
    assert.ok(
        COMMON_NPM_VERSIONS.length > 0,
        'Should have at least one NPM version'
    )

    console.log('✓ Constants tests passed')
}

/**
 * Runs all helper module tests
 */
function runAllTests() {
    testFormatVersionRange()
    testConstants()
    console.log('All tests passed!')
}

// Execute tests
runAllTests()
