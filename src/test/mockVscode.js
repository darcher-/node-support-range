// Modified mockVscode.js with fixed types
/**
 * A simple mock implementation of the VS Code API for testing.
 * This allows us to test modules that use VS Code APIs without running in the VS Code environment.
 * @module mockVscode
 */

/**
 * @typedef {Object} VSCodePosition
 * @property {number} line - The zero-based line value
 * @property {number} character - The zero-based character value
 */

/**
 * @typedef {Object} VSCodeRange
 * @property {VSCodePosition} start - The start position
 * @property {VSCodePosition} end - The end position
 * @property {boolean} isEmpty - Whether the range is empty
 * @property {boolean} isSingleLine - Whether the range is a single line
 */

/**
 * @typedef {Object} VSCodeSelection
 * @property {VSCodePosition} start - The position at which the selection starts
 * @property {VSCodePosition} end - The position at which the selection ends
 * @property {boolean} isEmpty - Whether the selection is empty
 * @property {boolean} isSingleLine - Whether the selection is on a single line
 */

/**
 * @typedef {Object} VSCodeUri
 * @property {string} fsPath - The file system path
 * @property {string} scheme - The Uri scheme
 * @property {string} path - The path part of the Uri
 * @property {Function} toString - Returns string representation of the Uri
 */

/**
 * @typedef {Object} VSCodeTextDocument
 * @property {VSCodeUri} uri - The associated resource identifier
 * @property {string} fileName - The file system path of the document
 * @property {boolean} isUntitled - Whether this document is untitled
 * @property {string} languageId - The language identifier
 * @property {Function} getText - Returns the document text
 * @property {Function} positionAt - Returns a position for the given offset
 * @property {Function} lineAt - Returns the line at the given line number
 */

/**
 * @typedef {Object} VSCodeEditBuilder
 * @property {Function} replace - Replaces the given range with the given text
 * @property {Function} insert - Inserts text at the given position
 * @property {Function} delete - Deletes text at the given range
 * @property {Function} setEndOfLine - Sets the end of line sequence
 */

/**
 * @typedef {Object} VSCodeTextEditor
 * @property {VSCodeTextDocument} document - The document associated with this text editor
 * @property {VSCodeSelection} selection - The primary selection
 * @property {VSCodeSelection[]} selections - All selections
 * @property {VSCodeRange[]} visibleRanges - The visible ranges
 * @property {Object} options - The editor options
 * @property {Function} edit - Performs edits on the document
 * @property {Function} insertSnippet - Inserts a snippet
 * @property {Function} revealRange - Reveals the given range
 * @property {Function} setDecorations - Sets decorations
 * @property {number} viewColumn - The view column
 * @property {Function} show - Shows this editor
 * @property {Function} hide - Hides this editor
 */

/**
 * @typedef {Object} VSCodeWorkspaceFolder
 * @property {VSCodeUri} uri - The associated uri for this workspace folder
 * @property {string} name - The name of this workspace folder
 * @property {number} index - The index of this workspace folder in the workspace
 */

/**
 * @typedef {Object} VSCodeProgressOptions
 * @property {number} location - The location of the progress indicator
 * @property {string} title - The title of the progress
 * @property {boolean} cancellable - Whether the progress is cancellable
 */

/**
 * @typedef {Object} VSCodeProgress
 * @property {Function} report - Reports progress updates
 */

/**
 * @typedef {Object} VSCodeWorkspaceEdit
 * @property {Array<{uri: VSCodeUri, range: VSCodeRange, newText: string}>} edits - The edits to be applied
 * @property {Function} replace - Replaces text at the given position
 */

/**
 * @typedef {Object} VSCodeHover
 * @property {Array<string|VSCodeMarkdownString>} contents - The contents of this hover
 * @property {VSCodeRange} [range] - The range to which this hover applies
 */

/**
 * @typedef {Object} VSCodeMarkdownString
 * @property {string} value - The markdown string contents
 * @property {boolean} isTrusted - Whether the markdown string is trusted
 */

/**
 * @typedef {Object} VSCodeLanguageSelector
 * @property {string} [scheme] - A language id like 'typescript'
 * @property {string} [language] - A Uri scheme like 'file' or 'untitled'
 * @property {string} [pattern] - A glob pattern
 */

/**
 * Mock VS Code window namespace
 * @type {Object}
 */
export const window = {
    /**
     * Shows an information message
     * @param {string} message - The message to show
     * @returns {Promise<string>} A promise that resolves to the selected item or undefined
     */
    showInformationMessage: (message) => {
        console.log('[Mock VSCode]', message)
        return Promise.resolve('OK')
    },

    /**
     * Shows an error message
     * @param {string} message - The message to show
     * @returns {Promise<string>} A promise that resolves to the selected item or undefined
     */
    showErrorMessage: (message) => {
        console.error('[Mock VSCode Error]', message)
        return Promise.resolve('OK')
    },

    /**
     * Shows a warning message
     * @param {string} message - The message to show
     * @returns {Promise<string>} A promise that resolves to the selected item or undefined
     */
    showWarningMessage: (message) => {
        console.warn('[Mock VSCode Warning]', message)
        return Promise.resolve('OK')
    },

    /**
     * Shows a text document in an editor
     * @param {Object} doc - The document or URI to show
     * @returns {Promise<Object>} A promise that resolves to the text editor
     */
    showTextDocument: (doc) => {
        // Safely access property that might not exist
        const docUri = doc && typeof doc === 'object' && 'uri' in doc ? doc.uri : doc
        console.log('[Mock VSCode] Showing document:', docUri)

        // Create a mock document if needed
        const document = doc && typeof doc === 'object' && 'uri' in doc ? doc : {
            uri: doc,
            fileName: (doc && typeof doc === 'object' && 'fsPath' in doc) ? doc.fsPath : '/mock/file.js',
            isUntitled: false,
            languageId: 'javascript',
            getText: () => '',
            positionAt: () => ({ line: 0, character: 0 }),
            lineAt: () => ({ text: '', range: {} })
        }

        // Create a mock text editor with the document
        return Promise.resolve({
            document: document,
            selection: { start: { line: 0, character: 0 }, end: { line: 0, character: 0 }, isEmpty: true, isSingleLine: true },
            selections: [],
            visibleRanges: [],
            options: { tabSize: 4, insertSpaces: true },
            edit: () => Promise.resolve(true),
            insertSnippet: () => Promise.resolve(true),
            revealRange: () => { },
            setDecorations: () => { },
            viewColumn: 1,
            show: () => { },
            hide: () => { }
        })
    },

    /**
     * Shows a workspace folder picker
     * @returns {Promise<Object>} A promise that resolves to the selected workspace folder
     */
    showWorkspaceFolderPick: () => {
        return Promise.resolve({ uri: { fsPath: '/mock/workspace', scheme: 'file', path: '/mock/workspace', toString: () => '/mock/workspace' }, name: 'Mock Workspace', index: 0 })
    },

    /**
     * The currently active text editor
     * @type {Object}
     */
    activeTextEditor: {
        document: {
            uri: { fsPath: '/mock/workspace/file.js', scheme: 'file', path: '/mock/workspace/file.js', toString: () => '/mock/workspace/file.js' },
            fileName: '/mock/workspace/file.js',
            isUntitled: false,
            languageId: 'javascript',
            getText: () => '',
            positionAt: () => ({ line: 0, character: 0 }),
            lineAt: () => ({ text: '', range: {} })
        },
        selection: { start: { line: 0, character: 0 }, end: { line: 0, character: 0 }, isEmpty: true, isSingleLine: true },
        selections: [],
        visibleRanges: [],
        options: { tabSize: 4, insertSpaces: true },
        edit: () => Promise.resolve(true),
        insertSnippet: () => Promise.resolve(true),
        revealRange: () => { },
        setDecorations: () => { },
        viewColumn: 1,
        show: () => { },
        hide: () => { }
    },
}

// Mock VS Code workspace
/**
 * Mock VS Code workspace namespace
 */
export const workspace = {
    /**
     * The workspace folders currently opened
     * @type {Array<Object>}
     */
    workspaceFolders: [
        { uri: { fsPath: '/mock/workspace', scheme: 'file', path: '/mock/workspace', toString: () => '/mock/workspace' }, name: 'Mock Workspace', index: 0 }
    ],

    /**
     * Returns the workspace folder that contains the given uri
     * @returns {Object} The workspace folder that contains the uri
     */
    getWorkspaceFolder: () => {
        return { uri: { fsPath: '/mock/workspace', scheme: 'file', path: '/mock/workspace', toString: () => '/mock/workspace' }, name: 'Mock Workspace', index: 0 }
    },

    /**
     * Opens a document at the given path
     * @param {string|Object} path - The path or uri of the document to open
     * @returns {Promise<Object>} A promise that resolves to the document
     */
    openTextDocument: (path) => {
        return Promise.resolve({
            uri: { fsPath: path.toString(), toString: () => path.toString() },
            getText: () => '{\n  "name": "mock-package",\n  "version": "1.0.0"\n}',
            positionAt: (offset = 0) => ({ line: 0, character: offset }),
            lineAt: () => ({ text: '', range: {} }),
        })
    },

    /**
     * Apply edits to the workspace
     * @returns {Promise<boolean>} A promise that resolves when the edit is applied
     */
    applyEdit: () => {
        console.log('[Mock VSCode] Applied edit')
        return Promise.resolve(true)
    },

    /**
     * File system functionality
     */
    fs: {
        /**
         * Returns file stats for a given uri
         * @returns {Promise<{type: number}>} A promise that resolves to the file stats
         */
        stat: () => {
            return Promise.resolve({ type: 1 }) // FileType.File = 1
        },

        /**
         * Reads a file at the given uri
         * @returns {Promise<Uint8Array>} A promise that resolves to the file contents
         */
        readFile: () => {
            return Promise.resolve(Buffer.from('{"name":"mock-package","version":"1.0.0"}'))
        },
    }
}

/**
 * File types enum
 * @enum {number}
 */
export const FileType = {
    Unknown: 0,
    File: 1,
    Directory: 2,
    SymbolicLink: 64
}

/**
 * Mock VS Code Range class
 */
export class Range {
    /**
     * Creates a new range
     * @param {number} startLine - The start line
     * @param {number} startChar - The start character
     * @param {number} endLine - The end line
     * @param {number} endChar - The end character
     */
    constructor(startLine, startChar, endLine, endChar) {
        this.start = { line: startLine, character: startChar }
        this.end = { line: endLine, character: endChar }
    }
}

/**
 * Mock VS Code Uri class
 */
export class Uri {
    /**
     * Creates a new Uri
     * @param {string} path - The file path
     */
    constructor(path) {
        this.fsPath = path
        this.scheme = 'file'
        this.path = path
    }

    /**
     * Creates a file Uri from a path
     * @param {string} path - The file path
     * @returns {Uri} A new Uri for the given path
     */
    static file(path) {
        return new Uri(path)
    }

    /**
     * Returns string representation of this Uri
     * @returns {string} A string representation of this Uri
     */
    toString() {
        return this.fsPath
    }
}

/**
 * Mock VS Code WorkspaceEdit class
 */
export class WorkspaceEdit {
    constructor() {
        /** @type {Array<{uri: any, range: any, newText: string}>} */
        this.edits = []
    }

    /**
     * Replaces text at the given position
     * @param {any} uri - The document Uri
     * @param {any} range - The range to replace
     * @param {string} newText - The new text
     */
    replace(uri, range, newText) {
        this.edits.push({ uri, range, newText })
    }
}

/**
 * Mock VS Code Hover class
 * @param {string|Object|Array<string|Object>} contents - The contents of the hover
 * @param {Object} [range] - The range to which this hover applies
 * @constructor
 */
export function Hover(contents, range) {
    this.contents = Array.isArray(contents) ? contents : [contents]
    this.range = range
}

/**
 * Mock VS Code commands namespace
 */
export const commands = {
    /**
     * Registers a command handler
     * @param {string} id - The command ID
     * @returns {{dispose: () => void}} A disposable to unregister the command
     */
    registerCommand: (id) => {
        console.log(`[Mock VSCode] Registered command: ${id}`)
        return { dispose: () => { } }
    },

    /**
     * Executes a command
     * @param {string} id - The command ID
     * @param {...any} args - Arguments for the command
     * @returns {Promise<any>} A promise that resolves with the command result
     */
    executeCommand: (id, ...args) => {
        console.log(`[Mock VSCode] Executed command: ${id}`, args)
        return Promise.resolve()
    },

    /**
     * Gets all registered command IDs
     * @returns {Promise<string[]>} A promise that resolves with the command IDs
     */
    getCommands: () => {
        return Promise.resolve(['node-support-limits.analyzeDependencies'])
    }
}

/**
 * Progress location enum
 * @enum {number}
 */
export const ProgressLocation = {
    Notification: 15
}

/**
 * Mock VS Code MarkdownString class
 * @param {string} value - The markdown text
 */
export const MarkdownString = function(value) {
    /** @type {string} */
    this.value = value
}

/**
 * Mock VS Code languages namespace
 */
export const languages = {
    /**
     * Registers a hover provider
     * @returns {{dispose: () => void}} A disposable to unregister the provider
     */
    registerHoverProvider: () => ({ dispose: () => { } })
}

/**
 * Export the full mock
 */
export default {
    window,
    workspace,
    commands,
    Uri,
    FileType,
    Range,
    WorkspaceEdit,
    ProgressLocation,
    MarkdownString,
    languages,
    Hover
}
