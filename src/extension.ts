import * as vscode from 'vscode';
import { RemoteServer } from './server';
import { QRCodeGenerator } from './qrcode';
import { AuthManager } from './auth';

let server: RemoteServer | undefined;
let statusBarItem: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {
    console.log('Codespray extension is now active!');

    // Create status bar item
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.text = "$(globe) Codespray";
    statusBarItem.tooltip = "Click to manage Codespray";
    statusBarItem.command = 'codespray.showMenu';
    statusBarItem.show();

    // Register commands
    const commands = [
        vscode.commands.registerCommand('codespray.start', startServer),
        vscode.commands.registerCommand('codespray.stop', stopServer),
        vscode.commands.registerCommand('codespray.openBrowser', openBrowser),
        vscode.commands.registerCommand('codespray.showQR', showQRCode),
        vscode.commands.registerCommand('codespray.showMenu', showMenu)
    ];

    context.subscriptions.push(statusBarItem, ...commands);

    // Auto-start if enabled
    const config = vscode.workspace.getConfiguration('codespray');
    if (config.get('autoStart')) {
        startServer();
    }
}

async function startServer() {
    if (server && server.isRunning()) {
        vscode.window.showInformationMessage('Codespray server is already running!');
        return;
    }

    try {
        const config = vscode.workspace.getConfiguration('codespray');
        const port = config.get<number>('port') || 8080;
        const enableAuth = config.get<boolean>('enableAuth') || true;

        server = new RemoteServer(port, enableAuth);
        await server.start();

        statusBarItem.text = `$(globe) Codespray: ${port}`;
        statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.prominentBackground');

        const url = `http://localhost:${port}`;
        const action = await vscode.window.showInformationMessage(
            `Codespray started on port ${port}`,
            'Open Browser',
            'Show QR Code'
        );

        if (action === 'Open Browser') {
            openBrowser();
        } else if (action === 'Show QR Code') {
            showQRCode();
        }
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to start Codespray: ${error}`);
    }
}

async function stopServer() {
    if (!server || !server.isRunning()) {
        vscode.window.showInformationMessage('Codespray server is not running!');
        return;
    }

    try {
        await server.stop();
        statusBarItem.text = "$(globe) Codespray";
        statusBarItem.backgroundColor = undefined;
        vscode.window.showInformationMessage('Codespray server stopped');
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to stop Codespray: ${error}`);
    }
}

async function openBrowser() {
    if (!server || !server.isRunning()) {
        vscode.window.showErrorMessage('Codespray server is not running!');
        return;
    }

    const open = require('open');
    const url = `http://localhost:${server.getPort()}`;
    await open(url);
}

async function showQRCode() {
    if (!server || !server.isRunning()) {
        vscode.window.showErrorMessage('Codespray server is not running!');
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
            vscode.commands.executeCommand('workbench.action.openSettings', 'codespray');
            break;
    }
}

export function deactivate() {
    if (server) {
        server.stop();
    }
} 