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
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = __importStar(require("vscode"));
const server_1 = require("./server");
const qrcode_1 = require("./qrcode");
let server;
let statusBarItem;
function activate(context) {
    console.log('Cursor Remote extension is now active!');
    // Create status bar item
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.text = "$(globe) Cursor Remote";
    statusBarItem.tooltip = "Click to manage Cursor Remote";
    statusBarItem.command = 'cursorRemote.showMenu';
    statusBarItem.show();
    // Register commands
    const commands = [
        vscode.commands.registerCommand('cursorRemote.start', startServer),
        vscode.commands.registerCommand('cursorRemote.stop', stopServer),
        vscode.commands.registerCommand('cursorRemote.openBrowser', openBrowser),
        vscode.commands.registerCommand('cursorRemote.showQR', showQRCode),
        vscode.commands.registerCommand('cursorRemote.showMenu', showMenu)
    ];
    context.subscriptions.push(statusBarItem, ...commands);
    // Auto-start if enabled
    const config = vscode.workspace.getConfiguration('cursorRemote');
    if (config.get('autoStart')) {
        startServer();
    }
}
exports.activate = activate;
async function startServer() {
    if (server && server.isRunning()) {
        vscode.window.showInformationMessage('Cursor Remote server is already running!');
        return;
    }
    try {
        const config = vscode.workspace.getConfiguration('cursorRemote');
        const port = config.get('port') || 8080;
        const enableAuth = config.get('enableAuth') || true;
        server = new server_1.RemoteServer(port, enableAuth);
        await server.start();
        statusBarItem.text = `$(globe) Remote: ${port}`;
        statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.prominentBackground');
        const url = `http://localhost:${port}`;
        const action = await vscode.window.showInformationMessage(`Cursor Remote started on port ${port}`, 'Open Browser', 'Show QR Code');
        if (action === 'Open Browser') {
            openBrowser();
        }
        else if (action === 'Show QR Code') {
            showQRCode();
        }
    }
    catch (error) {
        vscode.window.showErrorMessage(`Failed to start Cursor Remote: ${error}`);
    }
}
async function stopServer() {
    if (!server || !server.isRunning()) {
        vscode.window.showInformationMessage('Cursor Remote server is not running!');
        return;
    }
    try {
        await server.stop();
        statusBarItem.text = "$(globe) Cursor Remote";
        statusBarItem.backgroundColor = undefined;
        vscode.window.showInformationMessage('Cursor Remote server stopped');
    }
    catch (error) {
        vscode.window.showErrorMessage(`Failed to stop Cursor Remote: ${error}`);
    }
}
async function openBrowser() {
    if (!server || !server.isRunning()) {
        vscode.window.showErrorMessage('Cursor Remote server is not running!');
        return;
    }
    const open = require('open');
    const url = `http://localhost:${server.getPort()}`;
    await open(url);
}
async function showQRCode() {
    if (!server || !server.isRunning()) {
        vscode.window.showErrorMessage('Cursor Remote server is not running!');
        return;
    }
    const qrGenerator = new qrcode_1.QRCodeGenerator();
    const url = `http://localhost:${server.getPort()}`;
    await qrGenerator.showQRCode(url);
}
async function showMenu() {
    const isRunning = server && server.isRunning();
    const options = isRunning ? [
        'Stop Server',
        'Open Browser',
        'Show QR Code',
        'Settings'
    ] : [
        'Start Server',
        'Settings'
    ];
    const selection = await vscode.window.showQuickPick(options, {
        placeHolder: 'Choose an action'
    });
    switch (selection) {
        case 'Start Server':
            startServer();
            break;
        case 'Stop Server':
            stopServer();
            break;
        case 'Open Browser':
            openBrowser();
            break;
        case 'Show QR Code':
            showQRCode();
            break;
        case 'Settings':
            vscode.commands.executeCommand('workbench.action.openSettings', 'cursorRemote');
            break;
    }
}
function deactivate() {
    if (server) {
        server.stop();
    }
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map