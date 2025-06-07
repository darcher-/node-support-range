const assert = require('assert');
const sinon = require('sinon');
const fs = require('fs');
const vscode = require('vscode'); // Will be mocked

// Assuming helper.utils.js is in src and constants.js is in src
const { analyzeProjectDependencies, updatePackageJsonEngines } = require('../../src/helper.utils');
const {
  NOTE_NO_DEPENDENCIES,
  COMMON_NODEJS_VERSIONS,
  DEFAULT_NODE_VERSION_RANGE,
  DEFAULT_NPM_VERSION_RANGE,
  PACKAGE_JSON_FILENAME,
  DEFAULT_JSON_INDENT
} = require('../../src/constants');

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
    sandbox.stub(vscode, 'WorkspaceEdit').returns(mockWorkspaceEdit); // Ensure mockWorkspaceEdit is returned

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

  // Removed 'Initial Sample Test (to be removed or replaced)'
  // test('Initial Sample Test (to be removed or replaced)', () => {
  //   // This test was from the initial setup, can be removed once real tests are added.
  //   assert.strictEqual(1, 1, 'Sample assertion');
  // });

  suite('analyzeProjectDependencies', () => {
    test('should return NOTE_NO_DEPENDENCIES if package has no dependencies', async () => {
      const projectPath = 'project';
      const packageJsonPath = `${projectPath}/package.json`;
      fs.existsSync.withArgs(packageJsonPath).returns(true);
      fs.readFileSync.withArgs(packageJsonPath, 'utf8').returns(JSON.stringify({ name: 'test-project' }));

      const result = await analyzeProjectDependencies(projectPath, mockProgress);

      assert.deepStrictEqual(result, {
        projectPackageJsonPath: packageJsonPath,
        minNode: null,
        maxNode: null,
        minNpm: null,
        maxNpm: null,
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
      // The dependencies field is no longer returned, so these assertions are removed.
      // assert.ok(result.dependencies['dep1'].node, 'dep1 node range should be recorded');
      // assert.strictEqual(result.dependencies['dep1'].node.range, '>=18.0.0 <20.0.0');
      assert(mockProgress.report.called, 'Progress should be reported');
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

      // The dependencies field is no longer returned, so these assertions are removed.
      // assert.ok(result.dependencies['dep_missing'], 'Dependency should be listed');
      // assert.strictEqual(result.dependencies['dep_missing'].node.range, DEFAULT_NODE_VERSION_RANGE.range, 'Node range should be default');
      // assert.strictEqual(result.dependencies['dep_missing'].npm.range, DEFAULT_NPM_VERSION_RANGE.range, 'Npm range should be default');

      // Since DEFAULT_NODE_VERSION_RANGE ('>=0.10.0') includes all COMMON_NODEJS_VERSIONS
      assert.strictEqual(result.minNode, COMMON_NODEJS_VERSIONS[0], 'Min node should be the earliest common version');
      assert.strictEqual(result.maxNode, COMMON_NODEJS_VERSIONS[COMMON_NODEJS_VERSIONS.length - 1], 'Max node should be the latest common version');

      // NPM versions are not constrained by this dependency, so they should be null if no other deps constrain them.
      // Or, if we assume DEFAULT_NPM_VERSION_RANGE is also applied, it would be similar to node.
      // Based on current logic, if allNpmRanges is empty, minNpm/maxNpm will be null.
      // If dep_missing pushes DEFAULT_NPM_VERSION_RANGE, then it would be full range of COMMON_NPM_VERSIONS.
      // The current code pushes DEFAULT_NODE_VERSION_RANGE for node, but doesn't explicitly push a default for npm. Let's verify this.
      // On review of `analyzeProjectDependencies`: if `depPackageJson.engines.npm` is missing, nothing is pushed to `allNpmRanges`.
      // If `allNpmRanges` remains empty, `minNpm` and `maxNpm` will be `null`.
      assert.strictEqual(result.minNpm, null, 'Min NPM should be null as no NPM engine specified');
      assert.strictEqual(result.maxNpm, null, 'Max NPM should be null as no NPM engine specified');
      assert(mockProgress.report.called, 'Progress should be reported');
      assert(console.warn.calledWithMatch(/package.json not found for dep_missing/i), 'Warning for missing package.json should be logged');
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

      assert(console.warn.calledWithMatch(/Could not parse package.json for dependency dep_bad/i), 'Warning for unparsable package.json should be logged');
      // The dependencies field is no longer returned
      // assert.ok(result.dependencies['dep_bad'], 'Dependency should be listed');
      // assert.strictEqual(result.dependencies['dep_bad'].node.range, DEFAULT_NODE_VERSION_RANGE.range, 'Node range should be default after error');

      // Since DEFAULT_NODE_VERSION_RANGE ('>=0.10.0') includes all COMMON_NODEJS_VERSIONS
      assert.strictEqual(result.minNode, COMMON_NODEJS_VERSIONS[0], 'Min node should be the earliest common version');
      assert.strictEqual(result.maxNode, COMMON_NODEJS_VERSIONS[COMMON_NODEJS_VERSIONS.length - 1], 'Max node should be the latest common version');

      // NPM versions are not constrained by this dependency as its package.json is unparsable.
      assert.strictEqual(result.minNpm, null, 'Min NPM should be null as no NPM engine specified');
      assert.strictEqual(result.maxNpm, null, 'Max NPM should be null as no NPM engine specified');
      assert(mockProgress.report.called, 'Progress should be reported');
    });

    test('should return null for versions if no common compatible version is found', async () => {
      const projectPath = 'project_no_overlap';
      const packageJsonPath = `${projectPath}/package.json`;
      const dep1PackageJsonPath = `${projectPath}/node_modules/dep1/package.json`;
      const dep2PackageJsonPath = `${projectPath}/node_modules/dep2/package.json`;

      fs.existsSync.withArgs(packageJsonPath).returns(true);
      fs.readFileSync.withArgs(packageJsonPath, 'utf8').returns(JSON.stringify({
        name: 'test-project-no-overlap',
        dependencies: {
          'dep1': '^1.0.0',
          'dep2': '^1.0.0'
        }
      }));

      fs.existsSync.withArgs(dep1PackageJsonPath).returns(true);
      fs.readFileSync.withArgs(dep1PackageJsonPath, 'utf8').returns(JSON.stringify({
        name: 'dep1',
        version: '1.0.0',
        engines: {
          node: '>=18.0.0 <19.0.0', // Node 18.x
          npm: '>=8.0.0 <9.0.0'    // NPM 8.x
        }
      }));

      fs.existsSync.withArgs(dep2PackageJsonPath).returns(true);
      fs.readFileSync.withArgs(dep2PackageJsonPath, 'utf8').returns(JSON.stringify({
        name: 'dep2',
        version: '1.0.0',
        engines: {
          node: '>=20.0.0 <21.0.0', // Node 20.x
          npm: '>=10.0.0 <11.0.0'   // NPM 10.x
        }
      }));

      // We use the default COMMON_NODEJS_VERSIONS and COMMON_NPM_VERSIONS here
      // as the test ensures no overlap within these common versions.
      const result = await analyzeProjectDependencies(projectPath, mockProgress);

      assert.strictEqual(result.minNode, null, 'Min node should be null due to no overlap');
      assert.strictEqual(result.maxNode, null, 'Max node should be null due to no overlap');
      assert.strictEqual(result.minNpm, null, 'Min NPM should be null due to no overlap');
      assert.strictEqual(result.maxNpm, null, 'Max NPM should be null due to no overlap');
      assert(mockProgress.report.called, 'Progress should be reported');
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
      // The function should use replace for the whole document content
      await updatePackageJsonEngines(projectPackageJsonPath, nodeEngineString, null);

      assert(mockWorkspaceEdit.replace.calledOnce, "WorkspaceEdit's replace should have been called once");
      assert.isFalse(mockWorkspaceEdit.insert.called, "WorkspaceEdit's insert should not have been called");

      const [uri, range, newText] = mockWorkspaceEdit.replace.getCall(0).args;
      assert.deepStrictEqual(uri, mockTextDocument.uri, "URI for replace should match document URI");
      // Range should cover the entire document, which is implicitly tested by replacing the whole content.

      const updatedPackageJson = JSON.parse(newText);
      assert.ok(updatedPackageJson.engines, "Engines property should exist");
      assert.strictEqual(updatedPackageJson.engines.node, nodeEngineString, "Node engine string is incorrect");
      assert.strictEqual(updatedPackageJson.name, "test-project", "Original properties should be preserved");

      // Verify indentation (initial content used indent 2, DEFAULT_JSON_INDENT is 2)
      // This regex checks if the 'engines' line is indented with 2 spaces.
      assert.ok(newText.includes(`\n  "engines": {`), "Indentation of engines block seems incorrect.");
      assert.ok(newText.includes(`\n    "node": "${nodeEngineString}"`), "Indentation of node property seems incorrect.");


      assert(vscode.window.showInformationMessage.calledWithMatch(`${PACKAGE_JSON_FILENAME} has been updated`), "Success message should be shown");
    });

    test('should not remove existing npm engine if npmEngineString is null', async () => {
      const initialNodeVersion = '>=16.0.0';
      const initialNpmVersion = '>=7.0.0';
      const initialContent = JSON.stringify({
        name: 'test-project-keep-npm',
        engines: {
          node: initialNodeVersion,
          npm: initialNpmVersion
        }
      }, null, 2);
      mockTextDocument.getText.returns(initialContent);

      const newNodeEngineString = '>=18.0.0'; // New node version
      await updatePackageJsonEngines(projectPackageJsonPath, newNodeEngineString, null); // npmEngineString is null

      assert(mockWorkspaceEdit.replace.calledOnce, "WorkspaceEdit's replace should have been called once");
      const [, , newText] = mockWorkspaceEdit.replace.getCall(0).args;
      const updatedPackageJson = JSON.parse(newText);

      assert.ok(updatedPackageJson.engines, "Engines property should exist");
      assert.strictEqual(updatedPackageJson.engines.node, newNodeEngineString, "Node engine string should be updated");
      assert.strictEqual(updatedPackageJson.engines.npm, initialNpmVersion, "NPM engine should remain unchanged");
      assert.strictEqual(updatedPackageJson.name, "test-project-keep-npm", "Original properties should be preserved");

      // Verify indentation
      assert.ok(newText.includes(`\n  "engines": {`), "Indentation of engines block seems incorrect.");
      assert.ok(newText.includes(`\n    "node": "${newNodeEngineString}"`), "Indentation of node property seems incorrect.");
      assert.ok(newText.includes(`\n    "npm": "${initialNpmVersion}"`), "Indentation of npm property seems incorrect.");

      assert(vscode.window.showInformationMessage.calledWithMatch(`${PACKAGE_JSON_FILENAME} has been updated`), "Success message should be shown");
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
      // sandbox.stub(vscode, 'WorkspaceEdit').returns(mockWorkspaceEdit); // Already stubbed in setup

      await updatePackageJsonEngines(projectPackageJsonPath, newNodeEngineString, null);

      assert(mockWorkspaceEdit.replace.calledOnce, "WorkspaceEdit's replace should be called once");
      const [uri, range, newText] = mockWorkspaceEdit.replace.getCall(0).args;

      assert.deepStrictEqual(uri, mockTextDocument.uri);
      const updatedPackageJson = JSON.parse(newText);

      assert.deepStrictEqual(updatedPackageJson.name, "test-project", "Original 'name' property should be preserved.");
      assert.ok(updatedPackageJson.engines, "Engines property should exist.");
      assert.strictEqual(updatedPackageJson.engines.node, newNodeEngineString, "Node engine string was not updated.");
      assert.ok(!updatedPackageJson.engines.npm, "NPM engine should not be present if not specified and not existing.");

      // Verify indentation (initial content used indent 2)
      assert.ok(newText.includes(`\n  "engines": {`), "Indentation of engines block seems incorrect.");
      assert.ok(newText.includes(`\n    "node": "${newNodeEngineString}"`), "Indentation of node property seems incorrect.");

      assert(vscode.window.showInformationMessage.calledWithMatch(`${PACKAGE_JSON_FILENAME} has been updated`), "Success message should be shown");
    });

    test('should not update if engines are the same', async () => {
      const nodeEngineString = '>=18.0.0';
      const initialContent = JSON.stringify({ name: 'test-project', engines: { node: nodeEngineString } }, null, 2);
      mockTextDocument.getText.returns(initialContent);
      // sandbox.stub(vscode, 'WorkspaceEdit').returns(mockWorkspaceEdit); // Already stubbed in setup

      await updatePackageJsonEngines(projectPackageJsonPath, nodeEngineString, null);

      assert.isFalse(mockWorkspaceEdit.replace.called, "WorkspaceEdit's replace should not be called");
      assert.isFalse(mockWorkspaceEdit.insert.called, "WorkspaceEdit's insert should not be called");
      assert(vscode.window.showInformationMessage.calledWithMatch(`${PACKAGE_JSON_FILENAME} 'engines' are already up-to-date.`), "Info message for no change should be shown");
    });

    test('should add npm engine alongside node engine', async () => {
      const initialContent = JSON.stringify({ name: 'test-project', version: "1.0.0" }, null, 2);
      mockTextDocument.getText.returns(initialContent);
      // sandbox.stub(vscode, 'WorkspaceEdit').returns(mockWorkspaceEdit); // Already stubbed in setup

      const nodeEngineString = '>=18.0.0';
      const npmEngineString = '>=9.0.0';
      await updatePackageJsonEngines(projectPackageJsonPath, nodeEngineString, npmEngineString);

      assert(mockWorkspaceEdit.replace.calledOnce, "WorkspaceEdit's replace should have been called once");
      assert.isFalse(mockWorkspaceEdit.insert.called, "WorkspaceEdit's insert should not have been called");

      const [uri, range, newText] = mockWorkspaceEdit.replace.getCall(0).args;
      assert.deepStrictEqual(uri, mockTextDocument.uri);

      const updatedPackageJson = JSON.parse(newText);
      assert.strictEqual(updatedPackageJson.name, "test-project", "Original 'name' property should be preserved.");
      assert.strictEqual(updatedPackageJson.version, "1.0.0", "Original 'version' property should be preserved.");
      assert.ok(updatedPackageJson.engines, "Engines property should exist");
      assert.strictEqual(updatedPackageJson.engines.node, nodeEngineString, "Node engine string is incorrect");
      assert.strictEqual(updatedPackageJson.engines.npm, npmEngineString, "NPM engine string is incorrect");

      // Verify indentation (initial content used indent 2)
      assert.ok(newText.includes(`\n  "engines": {`), "Indentation of engines block seems incorrect.");
      assert.ok(newText.includes(`\n    "node": "${nodeEngineString}"`), "Indentation of node property seems incorrect.");
      assert.ok(newText.includes(`\n    "npm": "${npmEngineString}"`), "Indentation of npm property seems incorrect.");

      assert(vscode.window.showInformationMessage.calledWithMatch(`${PACKAGE_JSON_FILENAME} has been updated`), "Success message should be shown");
    });

    test('should only add node engine if npmEngineString is null and npm engine does not exist', async () => {
      const initialContent = JSON.stringify({ name: 'test-project-only-node' }, null, 2);
      mockTextDocument.getText.returns(initialContent);

      const nodeEngineString = '>=18.0.0';
      await updatePackageJsonEngines(projectPackageJsonPath, nodeEngineString, null);

      assert(mockWorkspaceEdit.replace.calledOnce, "WorkspaceEdit's replace should have been called once");
      const [, , newText] = mockWorkspaceEdit.replace.getCall(0).args;
      const updatedPackageJson = JSON.parse(newText);

      assert.ok(updatedPackageJson.engines, "Engines property should exist");
      assert.strictEqual(updatedPackageJson.engines.node, nodeEngineString, "Node engine string is incorrect");
      assert.strictEqual(updatedPackageJson.engines.npm, undefined, "NPM engine should not be present");
      assert.strictEqual(updatedPackageJson.name, "test-project-only-node", "Original properties should be preserved");
      assert(vscode.window.showInformationMessage.calledWithMatch(`${PACKAGE_JSON_FILENAME} has been updated`), "Success message should be shown");
    });

    test('should use detected 4-space indentation', async () => {
      const initialContent = JSON.stringify({ name: 'test-project-4spaces' }, null, 4);
      mockTextDocument.getText.returns(initialContent); // getText will provide this content with 4 spaces

      const nodeEngineString = '>=18.0.0';
      await updatePackageJsonEngines(projectPackageJsonPath, nodeEngineString, null);

      assert(mockWorkspaceEdit.replace.calledOnce, "Replace not called or called too many times");
      const [, , newText] = mockWorkspaceEdit.replace.getCall(0).args;
      const updatedPackageJson = JSON.parse(newText);

      assert.ok(updatedPackageJson.engines.node, "Node engine not added");
      assert.strictEqual(updatedPackageJson.name, "test-project-4spaces", "Name property altered");

      // Check for 4-space indentation in the output
      assert.ok(newText.includes(`\n    "engines": {`), "Indentation of engines block is not 4 spaces.");
      assert.ok(newText.includes(`\n        "node": "${nodeEngineString}"`), "Indentation of node property is not 4 spaces (nested).");
      assert(vscode.window.showInformationMessage.calledWithMatch(`${PACKAGE_JSON_FILENAME} has been updated`), "Success message should be shown");
    });

    test('should use detected tab indentation', async () => {
      const initialContent = JSON.stringify({ name: 'test-project-tabs' }, null, '\t');
      mockTextDocument.getText.returns(initialContent); // getText will provide this content with tabs

      const nodeEngineString = '>=18.0.0';
      await updatePackageJsonEngines(projectPackageJsonPath, nodeEngineString, null);

      assert(mockWorkspaceEdit.replace.calledOnce, "Replace not called or called too many times");
      const [, , newText] = mockWorkspaceEdit.replace.getCall(0).args;
      const updatedPackageJson = JSON.parse(newText);

      assert.ok(updatedPackageJson.engines.node, "Node engine not added");
      assert.strictEqual(updatedPackageJson.name, "test-project-tabs", "Name property altered");

      // Check for tab indentation in the output
      assert.ok(newText.includes(`\n\t"engines": {`), "Indentation of engines block is not tab.");
      assert.ok(newText.includes(`\n\t\t"node": "${nodeEngineString}"`), "Indentation of node property is not tab (nested).");
      assert(vscode.window.showInformationMessage.calledWithMatch(`${PACKAGE_JSON_FILENAME} has been updated`), "Success message should be shown");
    });

    test('should use default indentation if none detected', async () => {
      // Simulate no detectable indentation (e.g. first line doesn't have quotes or it's all one line)
      const initialContent = '{ "name": "test-project-no-indent" }';
      mockTextDocument.getText.returns(initialContent);

      const nodeEngineString = '>=18.0.0';
      await updatePackageJsonEngines(projectPackageJsonPath, nodeEngineString, null);

      assert(mockWorkspaceEdit.replace.calledOnce, "Replace not called or called too many times");
      const [, , newText] = mockWorkspaceEdit.replace.getCall(0).args;
      const updatedPackageJson = JSON.parse(newText);

      assert.ok(updatedPackageJson.engines.node, "Node engine not added");
      assert.strictEqual(updatedPackageJson.name, "test-project-no-indent", "Name property altered");

      // Check for default indentation (assuming DEFAULT_JSON_INDENT is 2 spaces)
      const expectedIndent = ' '.repeat(DEFAULT_JSON_INDENT);
      assert.ok(newText.includes(`\n${expectedIndent}"engines": {`), `Engines block not using default indent of ${DEFAULT_JSON_INDENT} spaces.`);
      assert.ok(newText.includes(`\n${expectedIndent}${expectedIndent}"node": "${nodeEngineString}"`), `Node property not using default indent of ${DEFAULT_JSON_INDENT} spaces (nested).`);
      assert(vscode.window.showInformationMessage.calledWithMatch(`${PACKAGE_JSON_FILENAME} has been updated`), "Success message should be shown");
    });

  });
});
