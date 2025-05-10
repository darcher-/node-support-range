import assert from 'assert'
import { suite, test } from 'mocha'
import { compare, valid } from 'semver'
import {
    COMMAND_ID_ANALYZE_DEPENDENCIES,
    COMMON_NODEJS_VERSIONS,
    COMMON_NPM_VERSIONS,
    DEFAULT_NODE_VERSION_RANGE,
    DEFAULT_NPM_VERSION_RANGE,
    PACKAGE_JSON_FILENAME
} from '../../constants.js'

suite('Constants Tests', () => {
    test('COMMON_NODEJS_VERSIONS should contain valid semver strings', () => {
        COMMON_NODEJS_VERSIONS.forEach(version => {
            assert.ok(valid(version), `${version} should be a valid semver string`)
        })
    })

    test('COMMON_NODEJS_VERSIONS should be sorted', () => {
        const sorted = [...COMMON_NODEJS_VERSIONS].sort(compare)
        assert.deepStrictEqual(COMMON_NODEJS_VERSIONS, sorted, 'Node.js versions should be sorted')
    })

    test('COMMON_NPM_VERSIONS should contain valid semver strings', () => {
        COMMON_NPM_VERSIONS.forEach(version => {
            assert.ok(valid(version), `${version} should be a valid semver string`)
        })
    })

    test('COMMON_NPM_VERSIONS should be sorted', () => {
        const sorted = [...COMMON_NPM_VERSIONS].sort(compare)
        assert.deepStrictEqual(COMMON_NPM_VERSIONS, sorted, 'NPM versions should be sorted')
    })

    test('PACKAGE_JSON_FILENAME should be "package.json"', () => {
        assert.strictEqual(PACKAGE_JSON_FILENAME, 'package.json')
    })

    test('DEFAULT_NODE_VERSION_RANGE should be a valid range', () => {
        assert.strictEqual(DEFAULT_NODE_VERSION_RANGE, '>=0.10.0')
    })

    test('DEFAULT_NPM_VERSION_RANGE should be a valid range', () => {
        assert.strictEqual(DEFAULT_NPM_VERSION_RANGE, '>=5.0.0')
    })

    test('COMMAND_ID_ANALYZE_DEPENDENCIES should be properly formed', () => {
        assert.strictEqual(COMMAND_ID_ANALYZE_DEPENDENCIES, 'node-support-limits.analyzeDependencies')
    })
})