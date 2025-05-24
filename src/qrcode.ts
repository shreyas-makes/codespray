import * as vscode from 'vscode';
import * as QRCode from 'qrcode';

export class QRCodeGenerator {
    async showQRCode(url: string): Promise<void> {
        try {
            // Generate QR code as data URL
            const qrDataUrl = await QRCode.toDataURL(url, {
                width: 300,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            });

            // Create and show webview panel
            const panel = vscode.window.createWebviewPanel(
                'cursorRemoteQR',
                'Cursor Remote - QR Code',
                vscode.ViewColumn.Beside,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true
                }
            );

            panel.webview.html = this.getWebviewContent(qrDataUrl, url);

        } catch (error) {
            vscode.window.showErrorMessage(`Failed to generate QR code: ${error}`);
        }
    }

    private getWebviewContent(qrDataUrl: string, url: string): string {
        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Cursor Remote QR Code</title>
            <style>
                body {
                    font-family: var(--vscode-font-family);
                    background-color: var(--vscode-editor-background);
                    color: var(--vscode-editor-foreground);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    margin: 0;
                    padding: 20px;
                }
                .container {
                    text-align: center;
                    max-width: 400px;
                }
                .qr-code {
                    background: white;
                    padding: 20px;
                    border-radius: 8px;
                    margin: 20px 0;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }
                .qr-code img {
                    display: block;
                    margin: 0 auto;
                }
                .url {
                    background-color: var(--vscode-textBlockQuote-background);
                    border: 1px solid var(--vscode-textBlockQuote-border);
                    border-radius: 4px;
                    padding: 12px;
                    font-family: var(--vscode-editor-font-family);
                    font-size: 14px;
                    word-break: break-all;
                    margin: 20px 0;
                }
                .instructions {
                    margin-top: 20px;
                    line-height: 1.6;
                    opacity: 0.8;
                }
                h1 {
                    margin-bottom: 10px;
                    color: var(--vscode-titleBar-activeForeground);
                }
                .step {
                    margin: 10px 0;
                    padding: 8px;
                    background-color: var(--vscode-textCodeBlock-background);
                    border-radius: 4px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>📱 Cursor Remote</h1>
                <p>Scan this QR code with your phone to access the mobile coding interface:</p>
                
                <div class="qr-code">
                    <img src="${qrDataUrl}" alt="QR Code for ${url}" />
                </div>
                
                <div class="url">
                    ${url}
                </div>
                
                <div class="instructions">
                    <h3>📋 Instructions:</h3>
                    <div class="step">1. Scan the QR code with your phone's camera</div>
                    <div class="step">2. Open the link in your mobile browser</div>
                    <div class="step">3. Start coding on your phone!</div>
                </div>
                
                <p><strong>Note:</strong> Make sure your phone is connected to the same network as this computer.</p>
            </div>
        </body>
        </html>
        `;
    }
} 