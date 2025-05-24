# Cursor Remote 📱

Transform your mobile device into a powerful coding companion for Cursor IDE! Cursor Remote enables you to code, edit files, and run terminal commands directly from your phone or tablet.

## Features

🚀 **Mobile-First Design**
- Responsive interface optimized for touch screens
- Dark theme with VS Code-like styling
- Gesture-friendly controls and navigation

📱 **Real-Time Editing**
- Live synchronization with Cursor IDE
- Auto-save functionality
- Syntax highlighting for multiple languages
- Code formatting and auto-completion

🗂️ **File Management**
- Browse workspace files and folders
- Open, edit, and save files remotely
- File tree explorer with icons

⚡ **Terminal Access**
- Execute terminal commands remotely
- Command history and output display
- Direct integration with Cursor's terminal

🔗 **Easy Connection**
- QR code for instant mobile access
- Local network connectivity
- No internet required

## Installation

### Method 1: VS Code Marketplace (Coming Soon)
1. Open Cursor IDE
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "Cursor Remote"
4. Click Install

### Method 2: Manual Installation
1. Clone this repository:
   ```bash
   git clone https://github.com/cursor-remote/cursor-remote.git
   cd cursor-remote
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Compile the extension:
   ```bash
   npm run compile
   ```

4. Package the extension:
   ```bash
   npm install -g @vscode/vsce
   vsce package
   ```

5. Install the generated `.vsix` file in Cursor:
   - Open Command Palette (Ctrl+Shift+P)
   - Run "Extensions: Install from VSIX..."
   - Select the generated `.vsix` file

## Quick Start

1. **Start the Server**
   - Open Command Palette (Ctrl+Shift+P)
   - Run "Cursor Remote: Start Server"
   - The server will start on port 8080 (configurable)

2. **Connect Your Mobile Device**
   - Run "Cursor Remote: Show QR Code"
   - Scan the QR code with your phone's camera
   - Open the link in your mobile browser

3. **Start Coding!**
   - Browse files in the left panel
   - Tap any file to open it in the editor
   - Make changes and they'll sync automatically
   - Use the terminal to run commands

## Configuration

Access settings through VS Code preferences or the command palette:

```json
{
  "cursorRemote.port": 8080,
  "cursorRemote.autoStart": false,
  "cursorRemote.enableAuth": true,
  "cursorRemote.theme": "dark"
}
```

### Settings Options

- **Port**: Server port (default: 8080)
- **Auto Start**: Automatically start server when Cursor opens
- **Enable Auth**: Require authentication for connections
- **Theme**: Mobile interface theme (dark/light/auto)

## Mobile Interface

### File Explorer
- **Tap** to open files
- **Long press** for context menu (future feature)
- **Pull down** to refresh file list

### Code Editor
- **Pinch** to zoom in/out
- **Swipe** for horizontal scrolling
- **Double tap** to select words
- **Ctrl+S** or **Cmd+S** to save

### Terminal
- **Enter** to execute commands
- **Swipe up** to scroll through history
- **Tap** command suggestions (future feature)

## Commands

All commands are available through the Command Palette (Ctrl+Shift+P):

- `Cursor Remote: Start Server` - Start the remote server
- `Cursor Remote: Stop Server` - Stop the remote server
- `Cursor Remote: Open Mobile Interface` - Open in browser
- `Cursor Remote: Show QR Code` - Display connection QR code

## Supported Languages

Cursor Remote provides syntax highlighting and basic IntelliSense for:

- JavaScript/TypeScript
- Python
- HTML/CSS
- JSON
- Markdown
- PHP
- Java
- C/C++
- Shell scripts
- And many more!

## Network Requirements

- Both devices must be on the same local network
- Default port 8080 should be available
- No internet connection required
- Firewall may need to allow connections

## Security

- Local network only (no external access)
- Optional authentication tokens
- Session-based security
- No data sent over the internet

## Troubleshooting

### Connection Issues
1. Ensure both devices are on the same network
2. Check if port 8080 is available
3. Disable firewall temporarily to test
4. Try a different port in settings

### Performance Issues
1. Close unnecessary browser tabs
2. Reduce editor font size on mobile
3. Disable auto-save for large files
4. Clear browser cache

### File Not Updating
1. Check network connection
2. Refresh the mobile page
3. Restart the Cursor Remote server
4. Ensure file permissions are correct

## Contributing

We welcome contributions! Please feel free to submit issues and pull requests.

### Development Setup

1. Clone the repository
2. Run `npm install`
3. Open in VS Code
4. Press F5 to launch extension development host
5. Test your changes

### Architecture

```
cursor-remote/
├── src/                 # TypeScript source files
│   ├── extension.ts     # Main extension entry point
│   ├── server.ts        # Express server and API
│   ├── qrcode.ts        # QR code generation
│   └── auth.ts          # Authentication manager
├── web/                 # Mobile web interface
│   ├── index.html       # Main HTML file
│   ├── styles.css       # Mobile-optimized styles
│   └── app.js           # Frontend JavaScript
└── package.json         # Extension manifest
```

## Roadmap

🔮 **Upcoming Features**
- [ ] Multi-file tabs
- [ ] Git integration
- [ ] Collaborative editing
- [ ] Plugin system
- [ ] iOS/Android native apps
- [ ] Remote debugging
- [ ] Voice commands
- [ ] Gesture shortcuts

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/cursor-remote/cursor-remote/issues)
- 💡 **Feature Requests**: [GitHub Discussions](https://github.com/cursor-remote/cursor-remote/discussions)
- 📧 **Email**: cursor-remote@example.com
- 💬 **Discord**: [Join our community](https://discord.gg/cursor-remote)

## Acknowledgments

- Built with ❤️ for the Cursor IDE community
- Inspired by VS Code Live Share
- Uses CodeMirror for mobile code editing
- Icons by Font Awesome

---

**Made with 📱 for mobile coding enthusiasts!**

> "Code anywhere, anytime - your phone is now your development environment!" 