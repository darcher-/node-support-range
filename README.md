# Node Support Range VS Code Extension

A Visual Studio Code extension that analyzes your project's dependencies to determine the collective Node.js and NPM version range compatibility, and helps you maintain accurate `engines` specifications in your `package.json`.

## Overview

This extension addresses a common challenge in Node.js development: ensuring your project correctly specifies its Node.js and NPM version requirements based on the dependencies you use. It does this by examining your project's dependencies, analyzing their engine requirements, and calculating the most restrictive version range that satisfies all dependencies.

## Features

- Analyzes `dependencies` and `devDependencies` in your package.json
- Calculates the compatible Node.js and NPM version range across all dependencies
- Updates your project's `engines` field with the recommended version constraints
- Offers multiple activation methods: command palette, context menu, or dependency hover

## Usage

Access the extension in one of three ways:

1. **Command Palette**: Run "NodeJS/NPM minimum/maximum versions" from the command palette
2. **Explorer Context Menu**: Right-click on a package.json file and select "Supported NodeJS/NPM versions range"
3. **Hover Interface**: Hover over a dependency in package.json to see a link to analyze dependencies

The extension will:
1. Locate and analyze your project's dependencies
2. Calculate the compatible version ranges
3. Display the results with an option to update your package.json

## Technical Implementation

### Core Modules

#### `extension.js`

Main entry point that registers:

- **`activate(context)`**: Initializes the extension, registers commands and hover providers
- **`analyzeCommand`**: Command handler for the dependency analysis functionality
- **`hoverProvider`**: Provides hover analysis trigger in package.json dependencies

#### `helpers.js`

Contains utility functions for dependency analysis and package.json operations:

- **`updatePackageJsonEngines(packageJsonPath, nodeEngineString, npmEngineString)`**: Updates the engines field in package.json
- **`analyzeProjectDependencies(projectPath, progress)`**: Scans dependencies and determines compatible version ranges
- **`determineWorkspaceFolder(initialUri, vscodeWindow, vscodeWorkspace)`**: Resolves the target workspace folder for analysis
- **`formatVersionRange(minVersion, maxVersion)`**: Formats version ranges for package.json engines field

#### `constants.js`

Defines constants used throughout the extension:

- **`COMMON_NODEJS_VERSIONS`**: List of Node.js versions to check compatibility against
- **`COMMON_NPM_VERSIONS`**: List of NPM versions to check compatibility against
- **`PACKAGE_JSON_FILENAME`**, **`NODE_MODULES_DIRNAME`**: Common file and directory names
- Extension-specific command IDs, messages, and UI texts

### Analysis Algorithm

The extension performs these steps:

1. **Workspace Detection**: Determines the appropriate workspace folder to analyze
2. **Package Scanning**: Reads package.json and identifies all dependencies
3. **Engine Requirements Collection**:
   - For each dependency, reads its package.json from node_modules
   - Extracts its Node.js and NPM version requirements
4. **Compatibility Calculation**:
   - Tests each version in COMMON_NODEJS_VERSIONS against all collected engine requirements
   - Identifies the minimum and maximum compatible versions
   - Does the same for NPM versions
5. **Result Presentation**: Displays compatible ranges and offers to update package.json

## Testing Framework

The project uses a comprehensive two-tier testing approach:

### Standalone Tests

Tests that run directly in Node.js without VS Code dependencies:

- **`helper-test.js`**: Tests helper functions independently
- **`helper-module-test.js`**: Tests helper modules
- **`basic-import-test.js`**: Verifies basic imports work correctly
- **`constants-test.js`**: Tests constants module functionality

### VS Code Extension Tests

Tests that run in a VS Code context using the Extension Host:

- **`basic.test.js`**: Basic tests for the extension
- **`constants.test.js`**: Tests the constants module
- **`extension.test.js`**: Tests the extension activation and commands
- **`helpers.test.js`**: Tests the helper functions in a VS Code context
- **`index.js`**: Sets up the test suite
- **`mockHelpers.js`**: Provides mocks for VS Code APIs

## CI/CD

The project uses GitHub Actions for continuous integration:

- **Linting & Formatting**: Automatically enforces code style through ESLint, Markdownlint, and Prettier
- **Automated Testing**: Runs the test suite on push

## Requirements

- VS Code 1.100.0 or higher
- Node.js 18.0.0 or higher
- npm 10.8.2 or higher

## Development

The extension is built with an ESM structure. Key development scripts:

- `npm test`: Run all extension tests
- `npm run test:standalone`: Run all standalone tests
- `npm run test:standalone:helper`: Run standalone helper tests
- `npm run test:extension`: Run extension structure tests

## File Structure

```
node-support-range/
├── .github/                  # GitHub configurations
│   ├── configs/              # Linter and formatter configs
│   └── workflows/            # GitHub Actions workflows
├── .vscode/                  # VS Code settings and tasks
├── src/                      # Source code
│   ├── constants.js          # Constants and version data
│   ├── extension.js          # Extension activation and commands
│   ├── helpers.js            # Utility functions
│   └── test/                 # Test files
│       ├── suite/            # VS Code extension tests
│       └── ...               # Standalone tests
└── package.json              # Extension manifest
```

## Installation

Install from the VS Code Marketplace or search for "Node Support Range" within VS Code's Extensions view.
