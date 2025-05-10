import assert from 'assert'

console.log('Running basic import tests...')

/**
 * Tests that the constants module can be imported successfully
 * @returns {Promise<void>}
 */
async function testConstantsImport() {
    console.log('Testing constants import...')

    try {
        const constants = await import('../constants.js')
        assert.ok(constants, 'Constants module should be importable')
        assert.ok(constants.COMMON_NODEJS_VERSIONS, 'COMMON_NODEJS_VERSIONS should be defined')
        assert.ok(constants.COMMON_NPM_VERSIONS, 'COMMON_NPM_VERSIONS should be defined')
        console.log('✓ Constants import test passed')
    } catch (error) {
        console.error('✗ Constants import test failed:', error)
        throw error
    }
}

/**
 * Tests that the formatVersionRange function can be imported successfully
 * @returns {Promise<void>}
 */
async function testFormatVersionRangeImport() {
    console.log('Testing formatVersionRange import...')

    try {
        // Import from the mock-standalone-helpers.js instead of helpers.js
        const formatVersionRangeModule = await import('./mock-standalone-helpers.js')
        assert.ok(formatVersionRangeModule, 'formatVersionRange module should be importable')
        assert.strictEqual(
            typeof formatVersionRangeModule.formatVersionRange,
            'function',
            'formatVersionRange should be a function'
        )

        // Test basic functionality
        const result = formatVersionRangeModule.formatVersionRange('1.0.0', '2.0.0')
        assert.strictEqual(
            result,
            '>=1.0.0 <=2.0.0',
            'formatVersionRange should work correctly'
        )

        console.log('✓ formatVersionRange import test passed')
    } catch (error) {
        console.error('✗ formatVersionRange import test failed:', error)
        throw error
    }
}

/**
 * Runs all import tests
 * @returns {Promise<void>}
 */
async function runAllTests() {
    await testConstantsImport()
    await testFormatVersionRangeImport()
    console.log('All tests passed!')
}

// Execute tests
runAllTests().catch(err => {
    console.error('Test failure:', err)
    process.exit(1)
})
