class CursorRemoteApp {
    constructor() {
        this.socket = null;
        this.editor = null;
        this.currentFile = null;
        this.files = [];
        this.settings = this.loadSettings();
        this.autoSaveTimeout = null;
        
        this.init();
    }

    init() {
        this.setupUI();
        this.setupEditor();
        this.connectToServer();
        this.loadFiles();
        this.applySavedSettings();
    }

    setupUI() {
        // Mobile menu toggle
        document.getElementById('menu-btn').addEventListener('click', () => {
            document.getElementById('mobile-menu').classList.toggle('show');
        });

        // Close mobile menu when clicking outside
        document.getElementById('mobile-menu').addEventListener('click', (e) => {
            if (e.target.id === 'mobile-menu') {
                document.getElementById('mobile-menu').classList.remove('show');
            }
        });

        // Mobile menu actions
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', () => {
                const action = item.dataset.action;
                this.handleMenuAction(action);
                document.getElementById('mobile-menu').classList.remove('show');
            });
        });

        // File operations
        document.getElementById('refresh-files-btn').addEventListener('click', () => {
            this.loadFiles();
        });

        document.getElementById('save-btn').addEventListener('click', () => {
            this.saveCurrentFile();
        });

        document.getElementById('format-btn').addEventListener('click', () => {
            this.formatCode();
        });

        // Terminal
        document.getElementById('execute-btn').addEventListener('click', () => {
            this.executeCommand();
        });

        document.getElementById('terminal-command').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.executeCommand();
            }
        });

        document.getElementById('clear-terminal-btn').addEventListener('click', () => {
            document.getElementById('terminal-output').innerHTML = '';
        });

        // Modal handling
        document.querySelectorAll('.modal-close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                modal.classList.remove('show');
            });
        });

        // Settings
        document.getElementById('theme-select').addEventListener('change', (e) => {
            this.changeTheme(e.target.value);
        });

        document.getElementById('font-size-select').addEventListener('change', (e) => {
            this.changeFontSize(e.target.value);
        });

        document.getElementById('auto-save-checkbox').addEventListener('change', (e) => {
            this.settings.autoSave = e.target.checked;
            this.saveSettings();
        });

        // Tab close
        document.querySelector('.tab-close').addEventListener('click', () => {
            this.closeCurrentFile();
        });

        // Responsive layout handling
        this.handleResize();
        window.addEventListener('resize', () => this.handleResize());
    }

    setupEditor() {
        const editorTextarea = document.getElementById('code-editor');
        
        this.editor = CodeMirror.fromTextArea(editorTextarea, {
            theme: this.settings.theme,
            lineNumbers: true,
            autoCloseBrackets: true,
            matchBrackets: true,
            indentUnit: 4,
            tabSize: 4,
            lineWrapping: true,
            extraKeys: {
                'Ctrl-S': () => this.saveCurrentFile(),
                'Cmd-S': () => this.saveCurrentFile(),
                'Ctrl-/': 'toggleComment',
                'Cmd-/': 'toggleComment'
            }
        });

        this.editor.on('change', () => {
            if (this.currentFile && this.settings.autoSave) {
                this.scheduleAutoSave();
            }
            this.updateSaveButton();
        });

        // Hide editor initially
        document.getElementById('code-editor').style.display = 'none';
    }

    connectToServer() {
        this.showLoading(true);
        
        try {
            this.socket = io();
            
            this.socket.on('connect', () => {
                console.log('Connected to Cursor Remote server');
                this.showLoading(false);
                this.showToast('Connected to Cursor', 'success');
            });

            this.socket.on('disconnect', () => {
                console.log('Disconnected from server');
                this.showToast('Connection lost', 'error');
            });

            this.socket.on('file-updated', (data) => {
                if (data.success) {
                    this.showToast('File saved successfully', 'success');
                } else {
                    this.showToast('Failed to save file: ' + data.error, 'error');
                }
            });

        } catch (error) {
            console.error('Failed to connect to server:', error);
            this.showLoading(false);
            this.showToast('Failed to connect to server', 'error');
        }
    }

    async loadFiles() {
        try {
            const response = await fetch('/api/files');
            const data = await response.json();
            this.files = data.files || [];
            this.renderFileTree();
        } catch (error) {
            console.error('Failed to load files:', error);
            this.showToast('Failed to load files', 'error');
        }
    }

    renderFileTree() {
        const fileTree = document.getElementById('file-tree');
        
        if (this.files.length === 0) {
            fileTree.innerHTML = '<div class="loading">No files found</div>';
            return;
        }

        const html = this.files.map(file => {
            const icon = this.getFileIcon(file.name);
            return `
                <div class="file-item file" data-path="${file.path}">
                    <i class="${icon}"></i>
                    <span>${file.name}</span>
                </div>
            `;
        }).join('');

        fileTree.innerHTML = html;

        // Add click handlers
        fileTree.querySelectorAll('.file-item').forEach(item => {
            item.addEventListener('click', () => {
                const path = item.dataset.path;
                this.openFile(path);
            });
        });
    }

    getFileIcon(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        const iconMap = {
            'js': 'fab fa-js-square',
            'ts': 'fab fa-js-square',
            'py': 'fab fa-python',
            'html': 'fab fa-html5',
            'css': 'fab fa-css3-alt',
            'json': 'fas fa-brackets-curly',
            'md': 'fab fa-markdown',
            'txt': 'fas fa-file-text',
            'yml': 'fas fa-file-code',
            'yaml': 'fas fa-file-code',
            'xml': 'fas fa-file-code',
            'php': 'fab fa-php',
            'java': 'fab fa-java',
            'cpp': 'fas fa-file-code',
            'c': 'fas fa-file-code',
            'sh': 'fas fa-terminal',
            'sql': 'fas fa-database'
        };

        return iconMap[ext] || 'fas fa-file';
    }

    async openFile(path) {
        try {
            this.showLoading(true);
            
            const response = await fetch(`/api/file/${encodeURIComponent(path)}`);
            const data = await response.json();
            
            if (response.ok) {
                this.currentFile = {
                    path: path,
                    content: data.content,
                    language: data.language,
                    originalContent: data.content
                };

                this.displayFile();
                this.updateActiveFile(path);
            } else {
                this.showToast('Failed to open file: ' + data.error, 'error');
            }
        } catch (error) {
            console.error('Failed to open file:', error);
            this.showToast('Failed to open file', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    displayFile() {
        if (!this.currentFile) return;

        // Update tab
        document.querySelector('.tab-name').textContent = this.currentFile.path.split('/').pop();
        
        // Show editor and hide no-file message
        document.getElementById('no-file-message').style.display = 'none';
        document.getElementById('code-editor').style.display = 'block';

        // Set editor content and mode
        this.editor.setValue(this.currentFile.content);
        this.setEditorMode(this.currentFile.language);

        // Enable buttons
        document.getElementById('save-btn').disabled = false;
        document.getElementById('format-btn').disabled = false;

        // Focus editor
        this.editor.focus();
    }

    setEditorMode(language) {
        const modeMap = {
            'javascript': 'javascript',
            'typescript': 'javascript',
            'python': 'python',
            'html': 'htmlmixed',
            'css': 'css',
            'json': 'javascript',
            'markdown': 'markdown'
        };

        const mode = modeMap[language] || 'text';
        this.editor.setOption('mode', mode);
    }

    async saveCurrentFile() {
        if (!this.currentFile) return;

        try {
            const content = this.editor.getValue();
            
            const response = await fetch(`/api/file/${encodeURIComponent(this.currentFile.path)}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ content })
            });

            const data = await response.json();

            if (data.success) {
                this.currentFile.originalContent = content;
                this.updateSaveButton();
                
                // Emit via socket for real-time sync
                if (this.socket) {
                    this.socket.emit('file-change', {
                        path: this.currentFile.path,
                        content: content
                    });
                }
                
                this.showToast('File saved successfully', 'success');
            } else {
                this.showToast('Failed to save file', 'error');
            }
        } catch (error) {
            console.error('Failed to save file:', error);
            this.showToast('Failed to save file', 'error');
        }
    }

    scheduleAutoSave() {
        if (this.autoSaveTimeout) {
            clearTimeout(this.autoSaveTimeout);
        }
        
        this.autoSaveTimeout = setTimeout(() => {
            this.saveCurrentFile();
        }, 2000); // Auto-save after 2 seconds of inactivity
    }

    updateSaveButton() {
        const saveBtn = document.getElementById('save-btn');
        if (this.currentFile) {
            const hasChanges = this.editor.getValue() !== this.currentFile.originalContent;
            saveBtn.disabled = !hasChanges;
            saveBtn.style.opacity = hasChanges ? '1' : '0.5';
        }
    }

    formatCode() {
        if (!this.editor) return;
        
        // Basic auto-formatting for common languages
        const content = this.editor.getValue();
        const formatted = this.basicFormat(content);
        this.editor.setValue(formatted);
    }

    basicFormat(code) {
        // Simple formatting - add proper indentation
        const lines = code.split('\n');
        let indent = 0;
        const indentSize = 4;
        
        return lines.map(line => {
            const trimmed = line.trim();
            
            if (trimmed.endsWith('{') || trimmed.endsWith(':')) {
                const result = ' '.repeat(indent * indentSize) + trimmed;
                indent++;
                return result;
            } else if (trimmed.startsWith('}')) {
                indent = Math.max(0, indent - 1);
                return ' '.repeat(indent * indentSize) + trimmed;
            } else {
                return ' '.repeat(indent * indentSize) + trimmed;
            }
        }).join('\n');
    }

    async executeCommand() {
        const commandInput = document.getElementById('terminal-command');
        const command = commandInput.value.trim();
        
        if (!command) return;

        try {
            // Add command to terminal output
            this.addToTerminal(`$ ${command}`, 'command');
            
            const response = await fetch('/api/terminal/execute', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ command })
            });

            const data = await response.json();

            if (data.success) {
                this.addToTerminal('Command executed in Cursor terminal', 'output');
            } else {
                this.addToTerminal('Failed to execute command: ' + data.error, 'error');
            }

            commandInput.value = '';
        } catch (error) {
            this.addToTerminal('Network error: ' + error.message, 'error');
        }
    }

    addToTerminal(text, type = 'output') {
        const terminal = document.getElementById('terminal-output');
        const div = document.createElement('div');
        div.className = `terminal-line ${type}`;
        div.textContent = text;
        terminal.appendChild(div);
        terminal.scrollTop = terminal.scrollHeight;
    }

    updateActiveFile(path) {
        document.querySelectorAll('.file-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const activeItem = document.querySelector(`[data-path="${path}"]`);
        if (activeItem) {
            activeItem.classList.add('active');
        }
    }

    closeCurrentFile() {
        this.currentFile = null;
        
        // Reset UI
        document.querySelector('.tab-name').textContent = 'No file selected';
        document.getElementById('no-file-message').style.display = 'flex';
        document.getElementById('code-editor').style.display = 'none';
        
        // Disable buttons
        document.getElementById('save-btn').disabled = true;
        document.getElementById('format-btn').disabled = true;
        
        // Clear active file
        document.querySelectorAll('.file-item').forEach(item => {
            item.classList.remove('active');
        });
    }

    handleMenuAction(action) {
        switch (action) {
            case 'toggle-explorer':
                this.togglePanel('file-explorer');
                break;
            case 'toggle-terminal':
                this.togglePanel('terminal-panel');
                break;
            case 'settings':
                document.getElementById('settings-modal').classList.add('show');
                break;
            case 'about':
                this.showAbout();
                break;
        }
    }

    togglePanel(panelId) {
        const panel = document.getElementById(panelId);
        panel.classList.toggle('show');
    }

    showAbout() {
        this.showToast('Cursor Remote v1.0.0 - Mobile coding made easy!', 'info');
    }

    changeTheme(theme) {
        this.settings.theme = theme;
        this.saveSettings();
        if (this.editor) {
            this.editor.setOption('theme', theme);
        }
    }

    changeFontSize(size) {
        this.settings.fontSize = parseInt(size);
        this.saveSettings();
        if (this.editor) {
            const element = document.querySelector('.CodeMirror');
            element.style.fontSize = size + 'px';
            this.editor.refresh();
        }
    }

    applySavedSettings() {
        document.getElementById('theme-select').value = this.settings.theme;
        document.getElementById('font-size-select').value = this.settings.fontSize;
        document.getElementById('auto-save-checkbox').checked = this.settings.autoSave;
        
        if (this.editor) {
            this.editor.setOption('theme', this.settings.theme);
            const element = document.querySelector('.CodeMirror');
            element.style.fontSize = this.settings.fontSize + 'px';
        }
    }

    loadSettings() {
        const defaults = {
            theme: 'monokai',
            fontSize: 14,
            autoSave: true
        };

        try {
            const saved = localStorage.getItem('cursorRemoteSettings');
            return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
        } catch {
            return defaults;
        }
    }

    saveSettings() {
        localStorage.setItem('cursorRemoteSettings', JSON.stringify(this.settings));
    }

    handleResize() {
        if (window.innerWidth <= 768) {
            // Mobile layout
            document.getElementById('file-explorer').classList.remove('show');
            document.getElementById('terminal-panel').classList.remove('show');
        }
        
        if (this.editor) {
            this.editor.refresh();
        }
    }

    showLoading(show) {
        const overlay = document.getElementById('loading-overlay');
        overlay.classList.toggle('show', show);
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 4000);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CursorRemoteApp();
});

// Add CSS for terminal lines
const style = document.createElement('style');
style.textContent = `
    .terminal-line.command {
        color: #4ec9b0;
        font-weight: bold;
    }
    
    .terminal-line.error {
        color: #f44747;
    }
    
    .terminal-line.output {
        color: #cccccc;
    }
`;
document.head.appendChild(style); 