# Node Support range VS Code Extension

This extension helps Node.js developers by analyzing project dependencies to determine the collective supported Node.js and NPM version range. It then prompts the user to update their `package.json`'s `engines` property accordingly.

## Features

- Analyzes `dependencies` and `devDependencies`.
- Calculates the most restrictive compatible Node.js and NPM version range.
- Offers to update your project's `package.json` with the suggested `engines`.
- Triggers via command palette, directory context menu, or hovering over a dependency in `package.json`.

### Activation & Command

The extension will activate and register a command (`node-support-limits.analyzeDependencies`) that can be triggered from the command palette or a directory's context menu.

### Project Discovery

Locates the `package.json` in the active workspace.

### Dependency Crawling

Reads dependencies and devDependencies from the project's `package.json`. For each dependency, reads its own `package.json` from `node_modules` to find its `engines.node` and `engines.npm` requirements.

### Version Range Calculation

- Uses a predefined list of known NodeJS and NPM versions.
- Filters these lists to find versions that satisfy all collected dependency engine requirements using `semver.satisfies()`.
- The minimum and maximum from these filtered lists will define the suggested engines range.

### User Prompt & Update

Displays the calculated `node` & `npm` version range and offers to update the project's `package.json` `"engines"` property.

### Trigger (Hover Provider)

When hovering over a dependency in `package.json`, provides a link to trigger the main analysis command.

## File Structure

The project's file structure:

```sh
node-support-range/
├── .github/            # GitHub Actions workflows and configs
├── .vscode/
│   └── launch.json     # For debugging the extension
├── src/
│   ├── constants.js    # Project constants
│   ├── extension.js    # Main extension logic
│   └── helper.utils.js # Helper functions
├── test/
│   ├── run.js          # Test runner script for @vscode/test-electron
│   ├── sample_project/ # Sample project for integration tests
│   └── suite/          # Test suites (unit, integration)
│       ├── extension.test.js
│       ├── helper.utils.test.js
│       └── index.js      # Mocha test suite entry point
├── .eslintignore
├── .eslintrc.js        # ESLint configuration (or similar, e.g. in .github/configs)
├── .gitignore
├── .prettierignore
├── .prettierrc.yaml    # Prettier configuration (or similar, e.g. in .github/configs)
├── CHANGELOG.md
├── jsconfig.json       # JavaScript language service configuration
├── package-lock.json
├── package.json        # Extension manifest, dependencies, scripts
└── README.md
```
*(Note: Paths to ESLint/Prettier configs might vary, e.g., they could be in `.github/configs/` as used by CI.)*

## Testing

This extension uses Mocha for testing, run via `@vscode/test-electron` to simulate the VS Code environment. Tests include both unit tests for helper utilities and integration tests for extension commands and features.

To run all tests:

```bash
npm test
```

## Development Workflow

This project uses ESLint for JavaScript linting and Prettier for code formatting. These are enforced by a GitHub Actions workflow (`.github/workflows/lint-format.yml`) that runs on every push, performing tests, linting, and formatting checks.

### Local Development Steps

1.  **Install dependencies:**
    ```bash
    npm ci
    ```
    (`npm ci` is recommended for clean installs, especially in CI environments, but `npm install` can also be used for local development.)

2.  **Run tests:**
    Ensure all tests pass before committing changes.
    ```bash
    npm test
    ```

3.  **Lint and Format (Optional but Recommended):**
    While the CI workflow will catch linting and formatting issues, running these locally can speed up the development cycle. The exact commands depend on your project's script setup or direct npx calls. Example direct calls:
    ```bash
    # Run ESLint to check for and fix linting issues (config path may vary)
    npx eslint . --fix --ext=js,json --config=.github/configs/.eslintrc

    # Run Prettier to format code (config path may vary)
    npx prettier . --write --config=.github/configs/.prettierrc
    ```
    Refer to `package.json` scripts or the GitHub Actions workflow for the precise commands used by the project if available as npm scripts.

4.  **Debugging the Extension:**
    *   Open the `node-support-range` project folder in VS Code.
    *   Go to the "Run and Debug" view (Cmd/Ctrl+Shift+D).
    *   Select "Run Extension" from the dropdown and press F5.
        *   This will open a new VS Code window (the Extension Development Host) where your extension is active and can be tested manually.

By following these steps, you can contribute to the project while maintaining code quality and consistency.
