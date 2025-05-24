"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemoteServer = void 0;
const express_1 = __importDefault(require("express"));
const socket_io_1 = require("socket.io");
const path = __importStar(require("path"));
const vscode = __importStar(require("vscode"));
const auth_1 = require("./auth");
class RemoteServer {
    constructor(port, enableAuth = true) {
        this.running = false;
        this.port = port;
        this.enableAuth = enableAuth;
        this.app = (0, express_1.default)();
        this.authManager = new auth_1.AuthManager();
        this.setupExpress();
    }
    setupExpress() {
        // Serve static files
        this.app.use(express_1.default.static(path.join(__dirname, '../web')));
        this.app.use(express_1.default.json());
        // API endpoints
        this.app.get('/api/status', (req, res) => {
            res.json({
                status: 'running',
                version: '1.0.0',
                auth: this.enableAuth
            });
        });
        // File explorer API
        this.app.get('/api/files', async (req, res) => {
            try {
                const workspaceFolders = vscode.workspace.workspaceFolders;
                if (!workspaceFolders) {
                    return res.json({ files: [] });
                }
                const files = await this.getWorkspaceFiles();
                res.json({ files });
            }
            catch (error) {
                res.status(500).json({ error: 'Failed to get files' });
            }
        });
        // File content API
        this.app.get('/api/file/:path(*)', async (req, res) => {
            try {
                const filePath = req.params.path;
                const document = await vscode.workspace.openTextDocument(filePath);
                res.json({
                    content: document.getText(),
                    language: document.languageId
                });
            }
            catch (error) {
                res.status(404).json({ error: 'File not found' });
            }
        });
        // Update file content API
        this.app.post('/api/file/:path(*)', async (req, res) => {
            try {
                const filePath = req.params.path;
                const { content } = req.body;
                const document = await vscode.workspace.openTextDocument(filePath);
                const edit = new vscode.WorkspaceEdit();
                const fullRange = new vscode.Range(document.positionAt(0), document.positionAt(document.getText().length));
                edit.replace(document.uri, fullRange, content);
                await vscode.workspace.applyEdit(edit);
                res.json({ success: true });
            }
            catch (error) {
                res.status(500).json({ error: 'Failed to update file' });
            }
        });
        // Terminal API
        this.app.post('/api/terminal/execute', (req, res) => {
            try {
                const { command } = req.body;
                const terminal = vscode.window.createTerminal('Cursor Remote');
                terminal.sendText(command);
                terminal.show();
                res.json({ success: true });
            }
            catch (error) {
                res.status(500).json({ error: 'Failed to execute command' });
            }
        });
    }
    async getWorkspaceFiles() {
        const files = [];
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            return files;
        }
        for (const folder of workspaceFolders) {
            const pattern = new vscode.RelativePattern(folder, '**/*');
            const uris = await vscode.workspace.findFiles(pattern, '**/node_modules/**');
            for (const uri of uris) {
                files.push({
                    path: vscode.workspace.asRelativePath(uri),
                    name: path.basename(uri.fsPath),
                    isDirectory: false
                });
            }
        }
        return files;
    }
    setupSocketIO() {
        if (!this.server)
            return;
        this.io = new socket_io_1.Server(this.server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });
        this.io.on('connection', (socket) => {
            console.log('Mobile client connected:', socket.id);
            socket.on('file-change', async (data) => {
                try {
                    const { path: filePath, content } = data;
                    const document = await vscode.workspace.openTextDocument(filePath);
                    const edit = new vscode.WorkspaceEdit();
                    const fullRange = new vscode.Range(document.positionAt(0), document.positionAt(document.getText().length));
                    edit.replace(document.uri, fullRange, content);
                    await vscode.workspace.applyEdit(edit);
                    socket.emit('file-updated', { success: true, path: filePath });
                }
                catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    socket.emit('file-updated', { success: false, error: errorMessage });
                }
            });
            socket.on('disconnect', () => {
                console.log('Mobile client disconnected:', socket.id);
            });
        });
    }
    async start() {
        return new Promise((resolve, reject) => {
            try {
                this.server = this.app.listen(this.port, () => {
                    this.setupSocketIO();
                    this.running = true;
                    console.log(`Cursor Remote server running on port ${this.port}`);
                    resolve();
                });
                if (this.server) {
                    this.server.on('error', (error) => {
                        reject(error);
                    });
                }
            }
            catch (error) {
                reject(error);
            }
        });
    }
    async stop() {
        return new Promise((resolve) => {
            if (this.server) {
                this.server.close(() => {
                    this.running = false;
                    console.log('Cursor Remote server stopped');
                    resolve();
                });
            }
            else {
                resolve();
            }
        });
    }
    isRunning() {
        return this.running;
    }
    getPort() {
        return this.port;
    }
}
exports.RemoteServer = RemoteServer;
//# sourceMappingURL=server.js.map