const assert = require('assert');
const vscode = require('vscode');
const sinon = require('sinon');
const path = require('path');
const fs = require('fs'); // For creating temp workspace for one test

// It's good practice to ensure the extension is activated.
// The test runner usually handles this, but explicit activation can be useful.
// We might need to import 'activate' from '../../src/extension.js' if we want to spy on its internals
// before it runs, e.g., for vscode.languages.registerHoverProvider.
// For now, assume activation happens automatically or test post-activation state.
// const { activate } = require('../../src/extension'); // Assuming 'activate' is exported

suite('Extension Test Suite', () => {
  let sandbox;
  let workspaceRootPath; // Path to the 'sample_project' workspace
  let generalWorkspacePath; // Path for a generic workspace for other tests

  suiteSetup(async () => {
    // Determine workspace path - this assumes the test runner opens sample_project as the first folder
    if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
      // Prioritize a folder named 'sample_project' if multiple are open, otherwise take the first.
      const sampleFolder = vscode.workspace.workspaceFolders.find(f => f.name === 'sample_project');
      if (sampleFolder) {
        workspaceRootPath = sampleFolder.uri.fsPath;
      } else {
        console.warn("sample_project folder not found, using first workspace folder.");
        workspaceRootPath = vscode.workspace.workspaceFolders[0].uri.fsPath;
      }
    } else {
      // This case should ideally not happen if test/run.js is configured correctly.
      console.error("Test suite running without an open workspace. `sample_project` tests will likely fail.");
      // Fallback to a relative path, hoping it resolves correctly. This is risky.
      workspaceRootPath = path.resolve(__dirname, '../sample_project');
    }

    // Define a general workspace path for tests that shouldn't depend on sample_project contents.
    // This could be the parent of sample_project or another temp dir.
    // For simplicity, let's use a sub-directory that we can ensure is empty for certain tests.
    generalWorkspacePath = path.resolve(__dirname, '../temp_empty_ws');
    if (!fs.existsSync(generalWorkspacePath)) {
        fs.mkdirSync(generalWorkspacePath, { recursive: true });
    }

    // Ensure the extension is activated before tests run
    // This is often handled by the test environment, but can be explicit.
    // Attempt to get the extension and wait for its activation.
    const extension = vscode.extensions.getExtension('darcher-.node-support-range'); // Use your extension's ID
    if (extension && !extension.isActive) {
        console.log('Activating extension...');
        await extension.activate();
        console.log('Extension activated.');
    } else if (!extension) {
        console.error('Extension not found! Tests might not run correctly.');
    } else {
        console.log('Extension already active.');
    }
  });

  setup(() => {
    sandbox = sinon.createSandbox();
    // Common stubs/spies
    sandbox.spy(vscode.window, 'showInformationMessage');
    sandbox.spy(vscode.window, 'showErrorMessage');
    sandbox.spy(vscode.window, 'withProgress');
    // Spy on registerHoverProvider before each test that might check it
    sandbox.spy(vscode.languages, 'registerHoverProvider');
  });

  teardown(() => {
    sandbox.restore();
  });

  suite('Commands', () => {
    test('Analyze Dependencies Command - Successful Analysis on sample_project', async () => {
      assert.ok(workspaceRootPath, 'Workspace root path for sample_project must be defined');
      assert.ok(fs.existsSync(path.join(workspaceRootPath, 'package.json')), 'sample_project/package.json should exist');

      const projectFolderUri = vscode.Uri.file(workspaceRootPath);

      // The command might be registered with a different ID if it's context-specific.
      // Assuming 'node-support-limits.analyzeDependencies' is the general command ID.
      await vscode.commands.executeCommand('node-support-limits.analyzeDependencies', projectFolderUri);

      assert(vscode.window.withProgress.calledOnce, 'vscode.window.withProgress should have been called');

      // Check for the success message.
      // The exact message format depends on the implementation.
      // It should mention the project name "sample-test-project" from sample_project/package.json
      assert(
        vscode.window.showInformationMessage.calledWith(sinon.match(/Recommended 'engines' for sample-test-project/)),
        `showInformationMessage spy was called with: ${vscode.window.showInformationMessage.getCall(0)?.args[0]}`
      );
      // Also check that no error message was shown
      assert(vscode.window.showErrorMessage.notCalled, 'showErrorMessage should not have been called');
    });

    test('Analyze Dependencies Command - Project without package.json', async () => {
      assert.ok(generalWorkspacePath, 'General workspace path must be defined');
      // Ensure this directory is empty and does not contain a package.json
      const emptyProjectUri = vscode.Uri.file(generalWorkspacePath);

      // Clean up any stray package.json from previous test runs in this specific directory
      const strayPackageJson = path.join(generalWorkspacePath, 'package.json');
      if (fs.existsSync(strayPackageJson)) {
          fs.unlinkSync(strayPackageJson);
      }

      await vscode.commands.executeCommand('node-support-limits.analyzeDependencies', emptyProjectUri);

      // analyzeProjectDependencies itself is expected to call showErrorMessage when package.json is not found.
      assert(vscode.window.showErrorMessage.calledOnce, 'showErrorMessage should be called for missing package.json');
      assert(
        vscode.window.showErrorMessage.calledWith(sinon.match(`Project package.json not found at ${path.join(generalWorkspacePath, 'package.json')}`)),
        `showErrorMessage was called with: ${vscode.window.showErrorMessage.getCall(0)?.args[0]}`
      );
      // And no success message
      assert(vscode.window.showInformationMessage.notCalled, 'showInformationMessage should not be called');
    });
  });

  suite('Hover Provider', () => {
    // This test verifies if the hover provider was registered during extension activation.
    // It relies on the spy being set up *before* activation, or that activation happens per-test or is idempotent.
    // If activate() is only run once by the test runner, this spy needs to be set in a `suiteSetup`
    // that somehow re-triggers or pre-spies activation.
    // For now, assuming the extension is activated by the time this test runs and `registerHoverProvider` has been called.
    test('Hover provider should be registered for package.json files', () => {
        // The extension should activate automatically. If it doesn't, or if activation needs to be controlled,
        // this test would need to call `await extension.activate(mockContext);`
        // and `vscode.languages.registerHoverProvider` would be spied on before that.

        // Check if registerHoverProvider was called at least once with the correct selector.
        // This is a basic check. A more thorough test would capture the arguments
        // and verify the provider object itself if possible.
        const HOVER_SELECTOR_PACKAGE_JSON = { pattern: '**/package.json', scheme: 'file' };

        let foundRegistration = false;
        for (const call of vscode.languages.registerHoverProvider.getCalls()) {
            const selector = call.args[0];
            if (typeof selector === 'object' && selector.pattern === HOVER_SELECTOR_PACKAGE_JSON.pattern && selector.scheme === HOVER_SELECTOR_PACKAGE_JSON.scheme) {
                foundRegistration = true;
                break;
            }
        }
        assert(foundRegistration, 'registerHoverProvider should have been called with the package.json selector.');
    });

    // Testing the actual hover content is more complex and would typically involve:
    // 1. Opening a TextDocument for `sample_project/package.json`.
    // 2. Setting the cursor position within that document over a dependency.
    // 3. Directly invoking the `provideHover` method of the registered provider instance.
    //    (This requires getting a handle to the provider instance, which might mean exporting it from extension.js
    //     or capturing it when `registerHoverProvider` is called).
    // 4. Asserting the content of the returned Hover object.
    // This is closer to a unit test for the `provideHover` method itself, but with real VSCode objects.
    // For this integration test suite, confirming registration is a key first step.
  });

  suiteTeardown(() => {
    // Clean up the temp workspace if created
    if (fs.existsSync(generalWorkspacePath)) {
        // fs.rmSync(generalWorkspacePath, { recursive: true, force: true }); // Node 14.14+
        // For older Node versions:
        fs.readdirSync(generalWorkspacePath).forEach(file => {
            fs.unlinkSync(path.join(generalWorkspacePath, file));
        });
        fs.rmdirSync(generalWorkspacePath);
    }
  });
});
