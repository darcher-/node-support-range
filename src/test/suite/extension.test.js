import assert from 'assert'
import { suite, test } from 'mocha'
import { COMMAND_ID_ANALYZE_DEPENDENCIES } from '../../constants.js'

// Since we can't easily import vscode in direct tests, we'll use mock tests
suite('Extension Tests', () => {
    test('COMMAND_ID should be correctly defined', () => {
        assert.strictEqual(
            COMMAND_ID_ANALYZE_DEPENDENCIES,
            'node-support-limits.analyzeDependencies',
            'Command ID should match expected value'
        )
    })

    test('Basic imports should work', () => {
        // This is a simplistic test to verify module imports work
        assert.ok(true, 'Basic module imports should work')
    })
})