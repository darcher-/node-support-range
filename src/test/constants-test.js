import assert from 'assert'
import { compare, valid } from 'semver'
import {
    COMMAND_ID_ANALYZE_DEPENDENCIES,
    COMMON_NODEJS_VERSIONS,
    COMMON_NPM_VERSIONS,
    DEFAULT_NODE_VERSION_RANGE,
    DEFAULT_NPM_VERSION_RANGE,
    ENABLE_CONSOLE_LOGS,
    NODE_MODULES_DIRNAME,
    PACKAGE_JSON_FILENAME
} from '../constants.js'

console.log('Running constants tests...')

/**
 * Tests that Node.js versions are valid and sorted correctly
 */
function testNodeVersions() {
    console.log('Testing Node.js versions...')

    // Verify that the array exists and has content
    assert.ok(Array.isArray(COMMON_NODEJS_VERSIONS), 'COMMON_NODEJS_VERSIONS should be an array')
    assert.ok(COMMON_NODEJS_VERSIONS.length > 0, 'COMMON_NODEJS_VERSIONS should have entries')

    // Verify each version is a valid semver
    COMMON_NODEJS_VERSIONS.forEach(version => {
        assert.ok(valid(version), `${version} should be a valid semver string`)
    })

    // Verify versions are sorted
    const sorted = [...COMMON_NODEJS_VERSIONS].sort(compare)
    assert.deepStrictEqual(
        COMMON_NODEJS_VERSIONS,
        sorted,
        'Node.js versions should be sorted'
    )

    console.log('✓ Node.js versions tests passed')
}

/**
 * Tests that NPM versions are valid and sorted correctly
 */
function testNpmVersions() {
    console.log('Testing NPM versions...')

    // Verify that the array exists and has content
    assert.ok(Array.isArray(COMMON_NPM_VERSIONS), 'COMMON_NPM_VERSIONS should be an array')
    assert.ok(COMMON_NPM_VERSIONS.length > 0, 'COMMON_NPM_VERSIONS should have entries')

    // Verify each version is a valid semver
    COMMON_NPM_VERSIONS.forEach(version => {
        assert.ok(valid(version), `${version} should be a valid semver string`)
    })

    // Verify versions are sorted
    const sorted = [...COMMON_NPM_VERSIONS].sort(compare)
    assert.deepStrictEqual(
        COMMON_NPM_VERSIONS,
        sorted,
        'NPM versions should be sorted'
    )

    console.log('✓ NPM versions tests passed')
}

/**
 * Tests that other constants have the expected values
 */
function testOtherConstants() {
    console.log('Testing other constants...')

    // Verify file and directory names
    assert.strictEqual(PACKAGE_JSON_FILENAME, 'package.json', 'PACKAGE_JSON_FILENAME should be "package.json"')
    assert.strictEqual(NODE_MODULES_DIRNAME, 'node_modules', 'NODE_MODULES_DIRNAME should be "node_modules"')

    // Verify default ranges
    assert.strictEqual(DEFAULT_NODE_VERSION_RANGE, '>=0.10.0', 'DEFAULT_NODE_VERSION_RANGE should be ">=0.10.0"')
    assert.strictEqual(DEFAULT_NPM_VERSION_RANGE, '>=5.0.0', 'DEFAULT_NPM_VERSION_RANGE should be ">=5.0.0"')

    // Verify command ID
    assert.strictEqual(
        COMMAND_ID_ANALYZE_DEPENDENCIES,
        'node-support-limits.analyzeDependencies',
        'COMMAND_ID_ANALYZE_DEPENDENCIES should match expected value'
    )

    // Verify console logs flag is a boolean
    assert.strictEqual(
        typeof ENABLE_CONSOLE_LOGS,
        'boolean',
        'ENABLE_CONSOLE_LOGS should be a boolean'
    )

    console.log('✓ Other constants tests passed')
}

/**
 * Runs all constants tests
 */
function runAllTests() {
    testNodeVersions()
    testNpmVersions()
    testOtherConstants()
    console.log('All tests passed!')
}

// Execute tests
runAllTests()
