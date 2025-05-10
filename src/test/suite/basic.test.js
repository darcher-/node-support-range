import assert from 'assert'
import { suite, test } from 'mocha'
import * as constants from '../../constants.js'
import { formatVersionRange } from './mockHelpers.js'

suite('Basic Import Tests', () => {
    test('Constants module should be importable', () => {
        assert.ok(constants, 'Constants module should be imported')
        assert.ok(constants.COMMON_NODEJS_VERSIONS, 'COMMON_NODEJS_VERSIONS should be defined')
        assert.ok(constants.COMMON_NPM_VERSIONS, 'COMMON_NPM_VERSIONS should be defined')
    })

    test('Helper utilities should be importable', () => {
        // Basic function from formatVersionRange module
        assert.strictEqual(typeof formatVersionRange, 'function',
            'formatVersionRange should be a function')

        // Test basic functionality
        const result = formatVersionRange('1.0.0', '2.0.0')
        assert.strictEqual(result, '>=1.0.0 <=2.0.0', 'formatVersionRange should work correctly')
    })

    test('Basic math operations work as expected', () => {
        assert.strictEqual(1 + 1, 2, 'Basic math should work')
    })
})
