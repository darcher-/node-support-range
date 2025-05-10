# Testing Strategy

> **Note**: This is the detailed testing documentation. For a high-level overview, see the [Testing section in the main README](../../README.md#testing).

This directory contains all tests for the Node Support Range extension. There are two main types of tests:

1. **VS Code Extension Tests** - These tests run within the VS Code Extension Host environment.
2. **Standalone Tests** - These tests run directly with Node.js, without requiring the VS Code API.

## Test Structure

- `runTest.js` - Entry point for VS Code Extension tests, runs the tests in the VS Code Extension Host.
- `suite/` - Contains the Mocha test suite for VS Code Extension testing.
- `suite/index.js` - Sets up and runs the Mocha test suite.
- `suite/mockHelpers.js` - Provides mock implementations of the helper functions for Mocha tests.
- `mock-standalone-helpers.js` - Provides mock implementations for standalone tests.
- `mockVscode.js` - Provides mock implementations of VS Code APIs (not currently used).

## Running Tests

### VS Code Extension Tests

Run all VS Code extension tests:
```
npm test
```

Run specific test categories:
```
npm run test:extension   # Run Extension structure tests
npm run test:constants   # Run Constants tests
npm run test:helper      # Run Helper tests
npm run test:basic       # Run Basic tests
npm run test:standalone  # Run all tests in the suite
```

### Standalone Tests

Run all standalone tests:
```
npm run test:standalone:all
```

Run individual standalone tests:
```
npm run test:standalone:helper        # Standalone helper tests
npm run test:standalone:helper:module # Standalone helper module tests
npm run test:standalone:basic         # Standalone basic import tests
npm run test:standalone:constants     # Standalone constants tests
```

### Using VS Code Tasks

The extension workspace includes preconfigured VS Code tasks for all test scenarios:

- **Run All Tests**: Runs both VS Code extension tests and standalone tests
- **Run Extension Tests**: Runs tests in the VS Code Extension Host
- **Run All Suite Tests**: Runs all Mocha tests in the suite directory
- **Run All Standalone Tests**: Runs all standalone Node.js tests
- **Individual Test Tasks**: Run specific test categories or standalone tests

To run these tasks in VS Code:
1. Press `Cmd+Shift+P` (macOS) or `Ctrl+Shift+P` (Windows/Linux)
2. Type "Run Task" and select "Tasks: Run Task"
3. Select the desired test task from the list

## Testing Strategy

Since the extension relies on VS Code APIs which aren't available in a standard Node.js environment, we use separate mocks for tests:

1. For VS Code Extension Tests, we use `mockHelpers.js` in the suite directory.
2. For standalone tests, we use `mock-standalone-helpers.js`.

This approach allows us to test the core functionality of our helpers and utilities without requiring the VS Code API in standalone tests.
