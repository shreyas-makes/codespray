import express from 'express';
import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import * as path from 'path';
import * as vscode from 'vscode';
import { AuthManager } from './auth';

export class RemoteServer {
    private app: express.Application;
    private server: HttpServer | undefined;
    private io: SocketIOServer | undefined;
    private port: number;
    private enableAuth: boolean;
    private authManager: AuthManager;
    private running: boolean = false;

    constructor(port: number, enableAuth: boolean = true) {
        this.port = port;
        this.enableAuth = enableAuth;
        this.app = express();
        this.authManager = new AuthManager();
        this.setupExpress();
    }

    private setupExpress() {
        // Serve static files
        this.app.use(express.static(path.join(__dirname, '../web')));
        this.app.use(express.json());

        // API endpoints
        this.app.get('/api/status', (req: any, res: any) => {
            res.json({ 
                status: 'running',
                version: '1.0.0',
                auth: this.enableAuth
            });
        });

        // File explorer API
        this.app.get('/api/files', async (req: any, res: any) => {
            try {
                const workspaceFolders = vscode.workspace.workspaceFolders;
                if (!workspaceFolders) {
                    return res.json({ files: [] });
                }

                const files = await this.getWorkspaceFiles();
                res.json({ files });
            } catch (error) {
                res.status(500).json({ error: 'Failed to get files' });
            }
        });

        // File content API
        this.app.get('/api/file/:path(*)', async (req: any, res: any) => {
            try {
                const filePath = req.params.path;
                const document = await vscode.workspace.openTextDocument(filePath);
                res.json({ 
                    content: document.getText(),
                    language: document.languageId
                });
            } catch (error) {
                res.status(404).json({ error: 'File not found' });
            }
        });

        // Update file content API
        this.app.post('/api/file/:path(*)', async (req: any, res: any) => {
            try {
                const filePath = req.params.path;
                const { content } = req.body;
                
                const document = await vscode.workspace.openTextDocument(filePath);
                const edit = new vscode.WorkspaceEdit();
                const fullRange = new vscode.Range(
                    document.positionAt(0),
                    document.positionAt(document.getText().length)
                );
                edit.replace(document.uri, fullRange, content);
                
                await vscode.workspace.applyEdit(edit);
                res.json({ success: true });
            } catch (error) {
                res.status(500).json({ error: 'Failed to update file' });
            }
        });

        // Terminal API
        this.app.post('/api/terminal/execute', (req: any, res: any) => {
            try {
                const { command } = req.body;
                const terminal = vscode.window.createTerminal('Cursor Remote');
                terminal.sendText(command);
                terminal.show();
                res.json({ success: true });
            } catch (error) {
                res.status(500).json({ error: 'Failed to execute command' });
            }
        });
    }

    private async getWorkspaceFiles(): Promise<any[]> {
        const files: any[] = [];
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

    private setupSocketIO() {
        if (!this.server) return;

        this.io = new SocketIOServer(this.server, {
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
                    const fullRange = new vscode.Range(
                        document.positionAt(0),
                        document.positionAt(document.getText().length)
                    );
                    edit.replace(document.uri, fullRange, content);
                    await vscode.workspace.applyEdit(edit);
                    
                    socket.emit('file-updated', { success: true, path: filePath });
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    socket.emit('file-updated', { success: false, error: errorMessage });
                }
            });

            socket.on('disconnect', () => {
                console.log('Mobile client disconnected:', socket.id);
            });
        });
    }

    async start(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.running) {
                console.log(`Cursor Remote server is already running on port ${this.port}`);
                return resolve();
            }
            try {
                this.server = this.app.listen(this.port, () => {
                    this.setupSocketIO();
                    this.running = true;
                    console.log(`Cursor Remote server running on port ${this.port}`);
                    resolve();
                });

                if (this.server) {
                    this.server.on('error', (error: NodeJS.ErrnoException) => {
                        console.error(`Server failed to start on port ${this.port}:`, error);
                        this.running = false;
                        if (error.code === 'EADDRINUSE') {
                            reject(new Error(`Port ${this.port} is already in use.`));
                        } else {
                            reject(error);
                        }
                    });
                } else {
                    reject(new Error("Server instance was not created."));
                }
            } catch (error) {
                console.error("Error during server start setup:", error);
                this.running = false;
                reject(error);
            }
        });
    }

    async stop(): Promise<void> {
        return new Promise((resolve) => {
            if (this.server) {
                this.server.close(() => {
                    this.running = false;
                    console.log('Cursor Remote server stopped');
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }

    isRunning(): boolean {
        return this.running;
    }

    getPort(): number {
        return this.port;
    }
} 