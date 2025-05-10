import { runTests } from '@vscode/test-electron'
import * as path from 'path'
import { dirname } from 'path'
import { fileURLToPath } from 'url'

// Define __dirname and __filename equivalents for ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * Main function to run the VSCode extension tests
 */
async function main() {
    try {
        // The folder containing the Extension Manifest package.json
        const extensionDevelopmentPath = path.resolve(__dirname, '../../')

        // The path to the extension test runner script
        const extensionTestsPath = path.resolve(__dirname, './suite/index.js')

        // Download VS Code, unzip it and run the integration test
        await runTests({
            extensionDevelopmentPath,
            extensionTestsPath
        })
    } catch (err) {
        console.error('Failed to run tests:', err)
        process.exit(1)
    }
}

main()