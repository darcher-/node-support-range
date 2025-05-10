# Node Support range VS Code Extension

This extension helps Node.js developers by analyzing project dependencies to determine the collective supported Node.js and NPM version range. It then prompts the user to update their `package.json`'s `engines` property accordingly.

## Features

- Analyzes `dependencies` and `devDependencies`.
- Calculates the most restrictive compatible Node.js and NPM version range.
- Offers to update your project's `package.json` with the suggested `engines`.
- Triggers via command palette, directory context menu, or hovering over a dependency in `package.json`.

### Activation & Command

The extension will activate and register a command (e.g. `node-support-range.analyzeDependencies`) that can be triggered from the command palette or a directory's context menu.

### Project Discovery

Locate the [package.json](./package.json) in the active workspace.

### Dependency Crawling

Read dependencies and devDependencies from the project's package.json. For each dependency, read its own package.json from node_modules to find its engines.node and engines.npm requirements.

### Version Range Calculation

- Use a predefined list of known NodeJS and NPM versions.
- Filter these lists to find versions that satisfy all collected dependency engine requirements using `semver.satisfies()`.
- The minimum and maximum from these filtered lists will define the suggested engines range.

### User Prompt & Update

Display the calculated `node` & `npm` version range and offer to update the project's [package.json](./package.json) `"engines"` property.

### Trigger

> The initial version: `hover` (e.g. `onmouseover`)

When hovering over a dependency in [package.json](./package.json), provide a link to trigger the main analysis command.

### File Structure

```sh
node-support-range/
├── .vscode/
│   └── launch.json       # For debugging the extension
├── .gitignore
├── package.json          # Extension manifest, dependencies, scripts
├── tsconfig.json         # To configure JS type checking and build
├── README.md
└── src/
    └── extension.js      # Main extension logic
```

## Next Steps

### Create the Directory

Make a new folder named `"node-support-range"`.

### Save Files

Save each of the code blocks above into their respective file paths within the `node-support-range/` directory.

### Install Dependencies

Open a terminal in the `node-support-range/` directory and run `npm install` (or `npm i`). This will install `semver`, `typescript`, `@types/vscode`, etc.

### Build

Run npm run compile (or `tsc -p ./`) to "build" the JavaScript from `src/` to `dist/`.

### Run & Debug

1. Open the `node-support-range` folder in VS Code.
2. Go to the "Run and Debug" view (`Cmd`/`Ctrl`+`Shift`+`D`).
3. Select "Run Extension" from the dropdown and press `F5`.
    - This will open a new VS Code window (the Extension Development Host) where your extension is active.

### Test

1. In the Extension Development Host window, open a NodeJS project that has a [package.json](./package.json) and some dependencies.
    - ensure `node_modules/` are installed in that test project.
2. Try the command "Analyze NodeJS/NPM Support range" from the command palette.
3. Right-click on the project folder in the explorer and see if the command appears.
4. Hover over a dependency in the test project's [package.json](./package.json).

From here, we can refine the logic, improve error handling, make the NodeJS/NPM version lists dynamic, and enhance the hover provider's accuracy&hellip;
