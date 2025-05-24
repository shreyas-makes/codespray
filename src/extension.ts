import * as vscode from 'vscode';
import { RemoteServer } from './server';
import { QRCodeGenerator } from './qrcode';
import { AuthManager } from './auth';

let server: RemoteServer | undefined;
let statusBarItem: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {
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

async function startServer() {
    if (server && server.isRunning()) {
        vscode.window.showInformationMessage('Cursor Remote server is already running!');
        return;
    }

    try {
        const config = vscode.workspace.getConfiguration('cursorRemote');
        const port = config.get<number>('port') || 8080;
        const enableAuth = config.get<boolean>('enableAuth') || true;

        server = new RemoteServer(port, enableAuth);
        await server.start();

        statusBarItem.text = `$(globe) Remote: ${port}`;
        statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.prominentBackground');

        const url = `http://localhost:${port}`;
        const action = await vscode.window.showInformationMessage(
            `Cursor Remote started on port ${port}`,
            'Open Browser',
            'Show QR Code'
        );

        if (action === 'Open Browser') {
            openBrowser();
        } else if (action === 'Show QR Code') {
            showQRCode();
        }
    } catch (error) {
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
    } catch (error) {
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

    const qrGenerator = new QRCodeGenerator();
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

export function deactivate() {
    if (server) {
        server.stop();
    }
} 