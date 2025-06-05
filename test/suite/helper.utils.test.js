const assert = require('assert');
const sinon = require('sinon');
const fs = require('fs');
const vscode = require('vscode'); // Will be mocked

// Assuming helper.utils.js is in src and constants.js is in src
const { analyzeProjectDependencies, updatePackageJsonEngines } = require('../../src/helper.utils');
const { NOTE_NO_DEPENDENCIES, COMMON_NODEJS_VERSIONS, DEFAULT_NODE_VERSION_RANGE, DEFAULT_NPM_VERSION_RANGE } = require('../../src/constants');

suite('Helper Utils Test Suite', () => {
  let sandbox;
  let mockProgress;

  // Define a mock TextDocument object structure for use in tests
  const mockTextDocument = {
    uri: { fsPath: 'project/package.json' },
    getText: sinon.stub(),
    positionAt: sinon.stub(),
    lineAt: sinon.stub(),
    offsetAt: sinon.stub(),
    getWordRangeAtPosition: sinon.stub(),
  };

  // Define a mock WorkspaceEdit
  const mockWorkspaceEdit = {
    replace: sinon.spy(),
    insert: sinon.spy(),
    set: sinon.spy(),
  };


  setup(() => {
    sandbox = sinon.createSandbox();

    // Mock vscode APIs
    sandbox.stub(vscode.window, 'showErrorMessage');
    sandbox.stub(vscode.window, 'showInformationMessage');
    sandbox.stub(vscode.workspace, 'openTextDocument').resolves(mockTextDocument);
    sandbox.stub(vscode.workspace, 'applyEdit').resolves(true);
    sandbox.stub(vscode.workspace, 'saveAll').resolves(true);

    // Mock vscode.Progress
    mockProgress = { report: sinon.spy(), token: { isCancellationRequested: false, onCancellationRequested: sinon.stub() } };
    // Mock the Progress constructor behavior if needed, or specific instances
    // For simplicity, assuming `vscode.Progress` itself isn't directly instantiated by the functions under test,
    // but rather an object conforming to its interface is passed in (like mockProgress).

    // Mock fs module
    sandbox.stub(fs, 'existsSync');
    sandbox.stub(fs, 'readFileSync');

    // Mock console methods
    sandbox.stub(console, 'warn');
    sandbox.stub(console, 'error');
    sandbox.stub(console, 'log'); // Added for general logging if any

    // Reset stubs/spies on mock objects that might retain state across tests
    mockTextDocument.getText.resetHistory();
    mockTextDocument.positionAt.resetHistory();
    // ... reset other mockTextDocument methods if necessary

    mockWorkspaceEdit.replace.resetHistory();
    mockWorkspaceEdit.insert.resetHistory();
    mockWorkspaceEdit.set.resetHistory();

    // It's also good practice to make vscode.Range and vscode.Position constructors available
    // if they are used by the code under test to create new instances.
    // sinon.stub(vscode, 'Range').callsFake((start, end) => ({ start, end }));
    // sinon.stub(vscode, 'Position').callsFake((line, character) => ({ line, character }));
    // For now, assume direct creation of Range/Position objects is not what we need to intercept,
    // but rather the methods that *use* them (like applyEdit).
  });

  teardown(() => {
    sandbox.restore();
  });

  test('Initial Sample Test (to be removed or replaced)', () => {
    // This test was from the initial setup, can be removed once real tests are added.
    assert.strictEqual(1, 1, 'Sample assertion');
  });

  suite('analyzeProjectDependencies', () => {
    test('should return NOTE_NO_DEPENDENCIES if package has no dependencies', async () => {
      const projectPath = 'project';
      const packageJsonPath = `${projectPath}/package.json`;
      fs.existsSync.withArgs(packageJsonPath).returns(true);
      fs.readFileSync.withArgs(packageJsonPath, 'utf8').returns(JSON.stringify({ name: 'test-project' }));

      const result = await analyzeProjectDependencies(projectPath, mockProgress);

      assert.deepStrictEqual(result, {
        projectPackageJsonPath: packageJsonPath,
        minNode: DEFAULT_NODE_VERSION_RANGE.minVersion, // Based on DEFAULT_NODE_VERSION_RANGE
        maxNode: DEFAULT_NODE_VERSION_RANGE.maxVersion, // Based on DEFAULT_NODE_VERSION_RANGE
        minNpm: DEFAULT_NPM_VERSION_RANGE.minVersion,
        maxNpm: DEFAULT_NPM_VERSION_RANGE.maxVersion,
        dependencies: {},
        note: NOTE_NO_DEPENDENCIES,
      });
      assert(mockProgress.report.called, 'Progress should be reported');
    });

    test('should return null and show error if project package.json not found', async () => {
      const projectPath = 'nonexistent_project';
      fs.existsSync.withArgs(`${projectPath}/package.json`).returns(false);

      const result = await analyzeProjectDependencies(projectPath, mockProgress);

      assert.strictEqual(result, null);
      assert(vscode.window.showErrorMessage.calledOnceWith(`Project package.json not found at ${projectPath}/package.json`), "Error message should be shown");
    });

    test('should correctly determine node versions from a single dependency', async () => {
      const projectPath = 'project_with_deps';
      const packageJsonPath = `${projectPath}/package.json`;
      const dep1PackageJsonPath = `${projectPath}/node_modules/dep1/package.json`;

      fs.existsSync.withArgs(packageJsonPath).returns(true);
      fs.readFileSync.withArgs(packageJsonPath, 'utf8').returns(JSON.stringify({
        name: 'test-project',
        dependencies: { 'dep1': '^1.0.0' }
      }));

      fs.existsSync.withArgs(dep1PackageJsonPath).returns(true);
      fs.readFileSync.withArgs(dep1PackageJsonPath, 'utf8').returns(JSON.stringify({
        name: 'dep1',
        version: '1.0.0',
        engines: { node: '>=18.0.0 <20.0.0' } // Example specific range
      }));

      // Mock COMMON_NODEJS_VERSIONS to control the test environment
      const relevantNodeVersions = COMMON_NODEJS_VERSIONS.filter(v => v.startsWith('18.') || v.startsWith('19.'));


      const result = await analyzeProjectDependencies(projectPath, mockProgress, relevantNodeVersions);

      assert.strictEqual(result.minNode, '18.0.0', 'Min node version mismatch');
      // Max will be the highest of the 19.x series from COMMON_NODEJS_VERSIONS that fits "<20.0.0"
      // This depends on the exact content of COMMON_NODEJS_VERSIONS. For this test, let's assume '19.9.0' is the max relevant.
      // To make it robust, we should calculate expectedMax based on the mocked relevantNodeVersions
      const expectedMaxNode = relevantNodeVersions.filter(v => v.startsWith('19.')).pop() || null; // Simplified, real logic is more complex

      // The actual logic in `analyzeProjectDependencies` uses semver.maxSatisfying,
      // so we need to ensure our expectation aligns with that.
      // For "<20.0.0", maxSatisfying from a list like ['18.0.0', '19.0.0', '19.9.0', '20.0.0'] would be '19.9.0'.
      // Let's assume COMMON_NODEJS_VERSIONS contains '19.9.0' for this test.
      // A more robust way:
      const semver = require('semver'); // Make sure semver is available in test context
      const expectedMax = semver.maxSatisfying(relevantNodeVersions, '<20.0.0');

      assert.strictEqual(result.maxNode, expectedMax, 'Max node version mismatch');
      assert.ok(result.dependencies['dep1'].node, 'dep1 node range should be recorded');
      assert.strictEqual(result.dependencies['dep1'].node.range, '>=18.0.0 <20.0.0');
    });

    test('should handle dependency missing package.json by using default range', async () => {
      const projectPath = 'project_missing_dep_pkg';
      const packageJsonPath = `${projectPath}/package.json`;
      const depPackageJsonPath = `${projectPath}/node_modules/dep_missing/package.json`;

      fs.existsSync.withArgs(packageJsonPath).returns(true);
      fs.readFileSync.withArgs(packageJsonPath, 'utf8').returns(JSON.stringify({
        name: 'test-project',
        dependencies: { 'dep_missing': '^1.0.0' }
      }));
      fs.existsSync.withArgs(depPackageJsonPath).returns(false); // dep_missing's package.json does not exist

      const result = await analyzeProjectDependencies(projectPath, mockProgress);

      assert.ok(result.dependencies['dep_missing'], 'Dependency should be listed');
      assert.strictEqual(result.dependencies['dep_missing'].node.range, DEFAULT_NODE_VERSION_RANGE.range, 'Node range should be default');
      assert.strictEqual(result.dependencies['dep_missing'].npm.range, DEFAULT_NPM_VERSION_RANGE.range, 'Npm range should be default');
      assert.strictEqual(result.minNode, DEFAULT_NODE_VERSION_RANGE.minVersion);
      assert.strictEqual(result.maxNode, DEFAULT_NODE_VERSION_RANGE.maxVersion);
    });

    test('should handle unparsable dependency package.json by using default range and warning', async () => {
      const projectPath = 'project_bad_dep_pkg';
      const packageJsonPath = `${projectPath}/package.json`;
      const depPackageJsonPath = `${projectPath}/node_modules/dep_bad/package.json`;

      fs.existsSync.withArgs(packageJsonPath).returns(true);
      fs.readFileSync.withArgs(packageJsonPath, 'utf8').returns(JSON.stringify({
        name: 'test-project',
        dependencies: { 'dep_bad': '^1.0.0' }
      }));
      fs.existsSync.withArgs(depPackageJsonPath).returns(true);
      fs.readFileSync.withArgs(depPackageJsonPath, 'utf8').returns('this is not valid JSON'); // Invalid JSON

      const result = await analyzeProjectDependencies(projectPath, mockProgress);

      assert(console.warn.calledWithMatch(/Failed to parse package.json for dep_bad/), 'Warning for unparsable package.json should be logged');
      assert.ok(result.dependencies['dep_bad'], 'Dependency should be listed');
      assert.strictEqual(result.dependencies['dep_bad'].node.range, DEFAULT_NODE_VERSION_RANGE.range, 'Node range should be default after error');
      assert.strictEqual(result.minNode, DEFAULT_NODE_VERSION_RANGE.minVersion);
      assert.strictEqual(result.maxNode, DEFAULT_NODE_VERSION_RANGE.maxVersion);
    });

  });

  suite('updatePackageJsonEngines', () => {
    const projectPackageJsonPath = 'project/package.json';

    test('should add new engines node if none exists', async () => {
      const initialContent = JSON.stringify({ name: 'test-project' }, null, 2);
      mockTextDocument.getText.returns(initialContent);
      // Mock positionAt to return a specific position for insertion if needed,
      // though the helper function might calculate this based on content.
      // For simplicity, assume it inserts at a known position or appends.
      // The function calculates insertion position, so specific mock for positionAt might not be critical here
      // unless the logic for finding "}" is complex.

      const nodeEngineString = '>=18.0.0';
      await updatePackageJsonEngines(projectPackageJsonPath, nodeEngineString, null, mockProgress);

      assert(vscode.workspace.applyEdit.calledOnce, 'applyEdit should be called once');
      const appliedEdit = vscode.workspace.applyEdit.getCall(0).args[0];
      // We need to inspect what `appliedEdit.set` or `appliedEdit.replace` was called with.
      // This requires the mockWorkspaceEdit to be used by vscode.WorkspaceEdit constructor or similar.
      // For now, let's assume applyEdit directly receives the changes.
      // This part of the test needs refinement based on how vscode.WorkspaceEdit is instantiated and used.
      // For now, we'll check that applyEdit was called. A more robust test would check the *content* of the edit.
      // This will require a deeper mock of the edit application process.

      // To actually check the content, we'd need to see what arguments `mockWorkspaceEdit.insert` or `mockWorkspaceEdit.replace` got.
      // This means `vscode.WorkspaceEdit` needs to be stubbed to return our `mockWorkspaceEdit`.

      await updatePackageJsonEngines(projectPackageJsonPath, nodeEngineString, null, mockProgress); // Call again with the stub active

      assert(mockWorkspaceEdit.insert.called || mockWorkspaceEdit.replace.called, "WorkspaceEdit's insert or replace should be called");
      // Example check if insert was called (most likely for new field)
      if (mockWorkspaceEdit.insert.called) {
        const [uri, position, text] = mockWorkspaceEdit.insert.getCall(0).args;
        assert.deepStrictEqual(uri.fsPath, projectPackageJsonPath);
        assert.ok(text.includes('"engines": {\n    "node": ">=18.0.0"\n  }'));
      }
      assert(vscode.window.showInformationMessage.calledWithMatch('Successfully updated package.json engines'), "Success message should be shown");
    });

    test('should update existing engines node', async () => {
      const initialContent = JSON.stringify({ name: 'test-project', engines: { node: '>=16.0.0' } }, null, 2);
      mockTextDocument.getText.returns(initialContent);
      sandbox.stub(vscode, 'Range').callsFake((start, end) => ({ start, end, _isRange: true })); // Mock vscode.Range
      sandbox.stub(vscode, 'Position').callsFake((line, char) => ({ line, char, _isPosition: true })); // Mock vscode.Position

      // Need to ensure positionAt and lineAt return values that allow finding the existing 'engines' field.
      // This is complex because it depends on the exact text manipulation logic in the function.
      // For a robust test, you'd set up getText, positionAt, lineAt to simulate the structure.
      // Let's assume the function correctly finds the range for "engines": { "node": ">=16.0.0" }
      // For the sake of this example, we'll focus on applyEdit being called with the right intent.

      const newNodeEngineString = '>=20.0.0';
      sandbox.stub(vscode, 'WorkspaceEdit').returns(mockWorkspaceEdit); // Ensure our mock edit is used

      await updatePackageJsonEngines(projectPackageJsonPath, newNodeEngineString, null, mockProgress);

      assert(mockWorkspaceEdit.replace.calledOnce, "WorkspaceEdit's replace should be called");
      if (mockWorkspaceEdit.replace.called) {
        const [uri, range, text] = mockWorkspaceEdit.replace.getCall(0).args;
        assert.deepStrictEqual(uri.fsPath, projectPackageJsonPath);
        assert.ok(text.includes(`"node": "${newNodeEngineString}"`)); // Check if the new string is part of the replacement
        assert.ok(!text.includes('>=16.0.0')); // Old string should not be there if simple replacement
      }
      assert(vscode.window.showInformationMessage.calledWithMatch('Successfully updated package.json engines'));
    });

    test('should not update if engines are the same', async () => {
      const nodeEngineString = '>=18.0.0';
      const initialContent = JSON.stringify({ name: 'test-project', engines: { node: nodeEngineString } }, null, 2);
      mockTextDocument.getText.returns(initialContent);
      sandbox.stub(vscode, 'WorkspaceEdit').returns(mockWorkspaceEdit);

      await updatePackageJsonEngines(projectPackageJsonPath, nodeEngineString, null, mockProgress);

      assert.isFalse(mockWorkspaceEdit.replace.called, "WorkspaceEdit's replace should not be called");
      assert.isFalse(mockWorkspaceEdit.insert.called, "WorkspaceEdit's insert should not be called");
      assert(vscode.window.showInformationMessage.calledWithMatch('Engines are already up-to-date.'), "Info message for no change should be shown");
    });

    test('should add npm engine alongside node engine', async () => {
      const initialContent = JSON.stringify({ name: 'test-project' }, null, 2);
      mockTextDocument.getText.returns(initialContent);
      sandbox.stub(vscode, 'WorkspaceEdit').returns(mockWorkspaceEdit);

      const nodeEngineString = '>=18.0.0';
      const npmEngineString = '>=9.0.0';
      await updatePackageJsonEngines(projectPackageJsonPath, nodeEngineString, npmEngineString, mockProgress);

      assert(mockWorkspaceEdit.insert.called || mockWorkspaceEdit.replace.called, "WorkspaceEdit's insert or replace should be called");
      if (mockWorkspaceEdit.insert.called) { // Assuming insertion for a new engines block
        const [, , text] = mockWorkspaceEdit.insert.getCall(0).args;
        assert.ok(text.includes(`"node": "${nodeEngineString}"`));
        assert.ok(text.includes(`"npm": "${npmEngineString}"`));
      } else if (mockWorkspaceEdit.replace.called) { // Or replacement if it adds to an empty object or similar
         const [, , text] = mockWorkspaceEdit.replace.getCall(0).args;
        assert.ok(text.includes(`"node": "${nodeEngineString}"`));
        assert.ok(text.includes(`"npm": "${npmEngineString}"`));
      }
      assert(vscode.window.showInformationMessage.calledWithMatch('Successfully updated package.json engines'));
    });

  });
});
