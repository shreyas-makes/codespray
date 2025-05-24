#!/bin/bash

# Cursor Remote Extension Package Script

echo "🚀 Building Cursor Remote Extension..."

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf out/
rm -f *.vsix

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Compile TypeScript
echo "🔨 Compiling TypeScript..."
npm run compile

# Check if compilation was successful
if [ $? -ne 0 ]; then
    echo "❌ Compilation failed!"
    exit 1
fi

# Package the extension using npx
echo "📦 Packaging extension..."
npx @vscode/vsce package --yes

if [ $? -eq 0 ]; then
    echo "✅ Extension packaged successfully!"
    echo "🎉 Install with: code --install-extension $(ls *.vsix | head -1)"
    echo "📱 Or drag the .vsix file into Cursor IDE!"
    echo ""
    echo "📦 Generated file: $(ls *.vsix | head -1)"
    echo "📁 Location: $(pwd)/$(ls *.vsix | head -1)"
else
    echo "❌ Packaging failed!"
    exit 1
fi 