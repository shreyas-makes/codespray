# Installation Guide for Codespray 📱

## Quick Install

1. **Download the Extension**
   - Download `codespray-1.0.0.vsix` from the project folder

2. **Install in Cursor IDE**
   - Open Cursor IDE
   - Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac) to open Command Palette
   - Type "Extensions: Install from VSIX..."
   - Select the `codespray-1.0.0.vsix` file
   - Click "Install"

3. **Alternative Installation Methods**
   
   **Method A: Drag & Drop**
   - Simply drag the `.vsix` file into Cursor IDE window
   
   **Method B: Command Line**
   ```bash
   code --install-extension codespray-1.0.0.vsix
   ```

## First Time Setup

1. **Start the Server**
   - Open Command Palette (`Ctrl+Shift+P`)
   - Run "Codespray: Start Server"
   - Server will start on port 8080

2. **Connect Your Phone**
   - Run "Codespray: Show QR Code"
   - Scan QR code with your phone camera
   - Open the link in your mobile browser

3. **Start Coding!** 🎉
   - Browse files on your phone
   - Edit code with mobile-optimized interface
   - Changes sync automatically with Cursor

## Configuration

Access settings via:
- `File > Preferences > Settings`
- Search for "Codespray"

Available settings:
- **Port**: Server port (default: 8080)
- **Auto Start**: Start server automatically
- **Theme**: Mobile interface theme
- **Authentication**: Enable/disable auth

## Troubleshooting

**Can't connect to mobile?**
- Make sure both devices are on same WiFi network
- Check if port 8080 is available
- Try disabling firewall temporarily

**Extension not working?**
- Restart Cursor IDE
- Check Developer Console (`Help > Toggle Developer Tools`)
- Look for any error messages

**Need help?**
- Check the [README.md](README.md) for detailed documentation
- Report issues on GitHub

---

Enjoy mobile coding with Codespray! 📱💻 