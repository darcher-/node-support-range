import { execSync } from 'child_process'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * List of test files to run
 * @type {string[]}
 */
const testFiles = [
    'basic-import-test.js',
    'constants-test.js',
    'helper-module-test.js',
    'helper-test.js'
]

console.log('Running standalone tests...')

// Run each test file
let failures = 0
for (const testFile of testFiles) {
    const testPath = join(__dirname, testFile)
    console.log(`\nRunning ${testFile}...`)

    try {
        // Execute the test file directly
        execSync(`node --experimental-vm-modules ${testPath}`, {
            stdio: 'inherit'
        })
        console.log(`✓ ${testFile} passed\n`)
    } catch (error) {
        console.error(`✗ ${testFile} failed with exit code ${JSON.parse(JSON.stringify(error))?.status}\n`)
        failures++
    }
}

console.log(`\nTest summary: ${testFiles.length - failures}/${testFiles.length} passed`)

// Exit with appropriate code
process.exit(failures > 0 ? 1 : 0)
