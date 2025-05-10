import { glob } from 'glob'
import Mocha from 'mocha'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url'

// Define __dirname and __filename equivalents for ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * Runs all the tests in the test suite
 * @returns {Promise<string>} A promise that resolves when all tests are complete
 */
export async function run() {
    // Create the mocha test
    const mocha = new Mocha({
        ui: 'tdd',
        color: true
    })

    const testsRoot = path.resolve(__dirname, '.')

    // Use glob to find all test files
    const files = await glob.glob('**/*.test.js', { cwd: testsRoot })

    // Add files to the test suite
    files.forEach((/** @type {string} */ f) => mocha.addFile(path.resolve(testsRoot, f)))

    return new Promise((resolve, reject) => {
        // Run the mocha test
        mocha.run(failures => {
            if (failures > 0) {
                reject(new Error(`${failures} tests failed.`))
            } else {
                resolve('All unit tests passed!')
            }
        })
    })
}