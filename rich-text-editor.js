/**
 * Professional Rich Text Editor
 * A complete WYSIWYG editor with advanced formatting features
 * Usage: new RichTextEditor(containerElement, options)
 */

class RichTextEditor {
    constructor(container, options = {}) {
        this.container = typeof container === 'string' ? document.getElementById(container) : container;
        this.options = {
            height: '400px',
            theme: 'light',
            placeholder: 'Start typing your document here...',
            toolbar: 'full',
            autoSave: true,
            spellCheck: true,
            ...options
        };
        
        this.editor = null;
        this.sourceEditor = null;
        this.previewArea = null;
        this.toolbar = null;
        this.isSourceMode = false;
        this.isPreviewMode = false;
        this.currentSelection = null;
        this.history = [];
        this.historyIndex = -1;
        this.autoSaveInterval = null;
        this.isModified = false;
        this.currentDocument = null;
        
        this.init();
    }

    init() {
        this.injectStyles();
        this.createEditor();
        this.setupEventListeners();
        this.setupKeyboardShortcuts();
        this.setupAutoSave();
        this.setupTheme();
        this.saveCurrentState();
        this.updateStats();
    }

    injectStyles() {
        if (document.getElementById('rich-text-editor-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'rich-text-editor-styles';
        style.textContent = `
            /* Rich Text Editor Styles */
            :root {
                --rte-primary: #2563eb;
                --rte-primary-hover: #1d4ed8;
                --rte-background: #f8fafc;
                --rte-surface: #ffffff;
                --rte-border: #e2e8f0;
                --rte-text: #1e293b;
                --rte-text-secondary: #64748b;
                --rte-success: #10b981;
                --rte-warning: #f59e0b;
                --rte-error: #ef4444;
                --rte-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
                --rte-radius: 0.5rem;
            }

            [data-rte-theme="dark"] {
                --rte-background: #0f172a;
                --rte-surface: #1e293b;
                --rte-border: #334155;
                --rte-text: #f1f5f9;
                --rte-text-secondary: #94a3b8;
            }

            .rte-container {
                display: flex;
                flex-direction: column;
                border: 1px solid var(--rte-border);
                border-radius: var(--rte-radius);
                background: var(--rte-surface);
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                box-shadow: var(--rte-shadow);
                overflow: hidden;
                transition: all 0.2s ease;
            }

            .rte-header {
                background: linear-gradient(180deg, var(--rte-surface) 0%, var(--rte-background) 100%);
                border-bottom: 1px solid var(--rte-border);
                padding: 0.75rem 1rem;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .rte-title {
                font-size: 1.125rem;
                font-weight: 600;
                color: var(--rte-text);
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }

            .rte-header-actions {
                display: flex;
                gap: 0.5rem;
            }

            .rte-toolbar {
                background: var(--rte-surface);
                border-bottom: 1px solid var(--rte-border);
                padding: 0.75rem 1rem;
                display: flex;
                flex-wrap: wrap;
                gap: 1rem;
                align-items: center;
            }

            .rte-toolbar-group {
                display: flex;
                align-items: center;
                gap: 0.25rem;
                padding: 0.25rem;
                border-radius: calc(var(--rte-radius) - 2px);
                border: 1px solid transparent;
            }

            .rte-toolbar-group:hover {
                background: var(--rte-background);
                border-color: var(--rte-border);
            }

            .rte-btn {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 2rem;
                height: 2rem;
                border: 1px solid var(--rte-border);
                background: var(--rte-surface);
                border-radius: calc(var(--rte-radius) - 4px);
                cursor: pointer;
                transition: all 0.2s ease;
                color: var(--rte-text-secondary);
                font-size: 0.875rem;
                position: relative;
            }

            .rte-btn:hover {
                background: var(--rte-background);
                color: var(--rte-primary);
                border-color: var(--rte-primary);
                transform: translateY(-1px);
                box-shadow: 0 2px 4px rgb(0 0 0 / 0.1);
            }

            .rte-btn:active {
                transform: translateY(0);
                box-shadow: none;
            }

            .rte-btn.active {
                background: var(--rte-primary);
                color: white;
                border-color: var(--rte-primary);
            }

            .rte-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
                transform: none;
            }

            .rte-select {
                padding: 0.25rem 0.5rem;
                border: 1px solid var(--rte-border);
                border-radius: calc(var(--rte-radius) - 4px);
                background: var(--rte-surface);
                color: var(--rte-text);
                font-size: 0.875rem;
                cursor: pointer;
                min-width: 80px;
            }

            .rte-select:focus {
                outline: 2px solid var(--rte-primary);
                border-color: var(--rte-primary);
            }

            .rte-color-picker {
                width: 1.5rem;
                height: 1.5rem;
                border: none;
                border-radius: calc(var(--rte-radius) - 4px);
                cursor: pointer;
            }

            .rte-separator {
                width: 1px;
                height: 1.5rem;
                background: var(--rte-border);
                margin: 0 0.5rem;
            }

            .rte-editor-area {
                position: relative;
                flex: 1;
                display: flex;
                flex-direction: column;
            }

            .rte-editor {
                width: 100%;
                height: 100%;
                padding: 1.5rem;
                border: none;
                outline: none;
                font-family: Georgia, 'Times New Roman', serif;
                font-size: 14px;
                line-height: 1.6;
                color: var(--rte-text);
                background: var(--rte-surface);
                overflow-y: auto;
                resize: none;
                min-height: 300px;
            }

            .rte-editor:focus {
                outline: none;
            }

            .rte-editor p {
                margin-bottom: 1rem;
            }

            .rte-editor h1, .rte-editor h2, .rte-editor h3, 
            .rte-editor h4, .rte-editor h5, .rte-editor h6 {
                margin: 1.5rem 0 1rem;
                font-weight: bold;
                line-height: 1.3;
            }

            .rte-editor h1 { font-size: 2rem; }
            .rte-editor h2 { font-size: 1.75rem; }
            .rte-editor h3 { font-size: 1.5rem; }
            .rte-editor h4 { font-size: 1.25rem; }
            .rte-editor h5 { font-size: 1.125rem; }
            .rte-editor h6 { font-size: 1rem; }

            .rte-editor ul, .rte-editor ol {
                margin: 1rem 0;
                padding-left: 2rem;
            }

            .rte-editor table {
                border-collapse: collapse;
                width: 100%;
                margin: 1rem 0;
            }

            .rte-editor table td, .rte-editor table th {
                border: 1px solid var(--rte-border);
                padding: 0.5rem;
                text-align: left;
            }

            .rte-editor table th {
                background: var(--rte-background);
                font-weight: bold;
            }

            .rte-editor img {
                max-width: 100%;
                height: auto;
                border-radius: calc(var(--rte-radius) - 2px);
            }

            .rte-editor hr {
                border: none;
                border-top: 2px solid var(--rte-border);
                margin: 2rem 0;
            }

            .rte-source-editor {
                width: 100%;
                height: 100%;
                padding: 1rem;
                border: none;
                outline: none;
                font-family: Monaco, Menlo, 'Ubuntu Mono', monospace;
                font-size: 13px;
                line-height: 1.5;
                color: var(--rte-text);
                background: var(--rte-surface);
                resize: none;
                tab-size: 2;
                min-height: 300px;
            }

            .rte-preview {
                width: 100%;
                height: 100%;
                padding: 1.5rem;
                background: var(--rte-surface);
                overflow-y: auto;
                font-family: Georgia, 'Times New Roman', serif;
                font-size: 14px;
                line-height: 1.6;
                color: var(--rte-text);
                min-height: 300px;
            }

            .rte-status-bar {
                background: var(--rte-surface);
                border-top: 1px solid var(--rte-border);
                padding: 0.5rem 1rem;
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 0.75rem;
                color: var(--rte-text-secondary);
                min-height: 2rem;
            }

            .rte-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
            }

            .rte-modal-content {
                background: var(--rte-surface);
                border-radius: var(--rte-radius);
                box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1);
                width: 90%;
                max-width: 500px;
                max-height: 90%;
                overflow: hidden;
                border: 1px solid var(--rte-border);
            }

            .rte-modal-header {
                padding: 1rem;
                border-bottom: 1px solid var(--rte-border);
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .rte-modal-body {
                padding: 1rem;
                max-height: 400px;
                overflow-y: auto;
            }

            .rte-modal-footer {
                padding: 1rem;
                border-top: 1px solid var(--rte-border);
                display: flex;
                justify-content: flex-end;
                gap: 0.5rem;
            }

            .rte-input {
                width: 100%;
                padding: 0.5rem;
                border: 1px solid var(--rte-border);
                border-radius: calc(var(--rte-radius) - 2px);
                background: var(--rte-surface);
                color: var(--rte-text);
                margin-bottom: 0.75rem;
            }

            .rte-input:focus {
                outline: 2px solid var(--rte-primary);
                border-color: var(--rte-primary);
            }

            .rte-btn-primary {
                padding: 0.5rem 1rem;
                background: var(--rte-primary);
                color: white;
                border: 1px solid var(--rte-primary);
                border-radius: calc(var(--rte-radius) - 2px);
                cursor: pointer;
                font-size: 0.875rem;
                transition: all 0.2s ease;
            }

            .rte-btn-primary:hover {
                background: var(--rte-primary-hover);
                border-color: var(--rte-primary-hover);
            }

            .rte-btn-secondary {
                padding: 0.5rem 1rem;
                background: var(--rte-surface);
                color: var(--rte-text);
                border: 1px solid var(--rte-border);
                border-radius: calc(var(--rte-radius) - 2px);
                cursor: pointer;
                font-size: 0.875rem;
                transition: all 0.2s ease;
            }

            .rte-btn-secondary:hover {
                background: var(--rte-background);
            }

            .rte-hidden {
                display: none !important;
            }

            .rte-dropdown {
                position: relative;
            }

            .rte-dropdown-menu {
                position: absolute;
                top: 100%;
                left: 0;
                background: var(--rte-surface);
                border: 1px solid var(--rte-border);
                border-radius: var(--rte-radius);
                box-shadow: var(--rte-shadow);
                padding: 0.5rem 0;
                min-width: 150px;
                z-index: 1000;
                opacity: 0;
                visibility: hidden;
                transform: translateY(-0.5rem);
                transition: all 0.2s ease;
            }

            .rte-dropdown.active .rte-dropdown-menu {
                opacity: 1;
                visibility: visible;
                transform: translateY(0);
            }

            .rte-dropdown-item {
                display: block;
                padding: 0.5rem 1rem;
                color: var(--rte-text);
                text-decoration: none;
                cursor: pointer;
                transition: background-color 0.2s ease;
                border: none;
                background: none;
                width: 100%;
                text-align: left;
                font-size: 0.875rem;
            }

            .rte-dropdown-item:hover {
                background: var(--rte-background);
            }

            .rte-find-replace {
                background: var(--rte-surface);
                border-bottom: 1px solid var(--rte-border);
                padding: 0.75rem 1rem;
                display: flex;
                align-items: center;
                gap: 0.75rem;
                flex-wrap: wrap;
            }

            .rte-find-input {
                padding: 0.25rem 0.5rem;
                border: 1px solid var(--rte-border);
                border-radius: calc(var(--rte-radius) - 4px);
                font-size: 0.875rem;
                width: 150px;
            }

            /* Responsive Design */
            @media (max-width: 768px) {
                .rte-toolbar {
                    gap: 0.5rem;
                    padding: 0.5rem;
                }
                
                .rte-toolbar-group {
                    gap: 0.125rem;
                }
                
                .rte-btn {
                    width: 1.75rem;
                    height: 1.75rem;
                    font-size: 0.8rem;
                }
                
                .rte-select {
                    min-width: 60px;
                    font-size: 0.8rem;
                }
                
                .rte-editor {
                    padding: 1rem;
                }
            }

            /* Animation Utilities */
            @keyframes rte-fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }

            .rte-animate-in {
                animation: rte-fadeIn 0.2s ease-out;
            }

            /* Selection Highlight */
            .rte-highlight {
                background-color: rgba(37, 99, 235, 0.2);
                padding: 0.125rem 0.25rem;
                border-radius: 2px;
            }

            /* Print Styles */
            @media print {
                .rte-header, .rte-toolbar, .rte-status-bar {
                    display: none !important;
                }
                
                .rte-container {
                    border: none;
                    box-shadow: none;
                }
                
                .rte-editor {
                    padding: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }

    createEditor() {
        this.container.innerHTML = `
            <div class="rte-container" style="height: ${this.options.height}">
                <div class="rte-header">
                    <div class="rte-title">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                        </svg>
                        ABI Text Editor
                    </div>
                    <div class="rte-header-actions">
                        <button class="rte-btn" id="rte-theme-toggle" title="Toggle Theme">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                            </svg>
                        </button>
                        <button class="rte-btn" id="rte-fullscreen" title="Toggle Fullscreen">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
                            </svg>
                        </button>
                    </div>
                </div>
                
                <div class="rte-toolbar">
                    <!-- File Operations -->
                    <div class="rte-toolbar-group">
                        <button class="rte-btn" id="rte-new" title="New Document">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                            </svg>
                        </button>
                        <button class="rte-btn" id="rte-save" title="Save Document">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M15,9H5V5H15M12,19A3,3 0 0,1 9,16A3,3 0 0,1 12,13A3,3 0 0,1 15,16A3,3 0 0,1 12,19M17,3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V7L17,3Z"/>
                            </svg>
                        </button>
                        <div class="rte-dropdown">
                            <button class="rte-btn" id="rte-export" title="Export">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                                </svg>
                            </button>
                            <div class="rte-dropdown-menu">
                                <button class="rte-dropdown-item" data-format="html">Export as HTML</button>
                                <button class="rte-dropdown-item" data-format="text">Export as Text</button>
                                <button class="rte-dropdown-item" data-format="json">Export as JSON</button>
                            </div>
                        </div>
                    </div>

                    <div class="rte-separator"></div>

                    <!-- Edit Operations -->
                    <div class="rte-toolbar-group">
                        <button class="rte-btn" id="rte-undo" title="Undo">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12.5,8C9.85,8 7.45,9 5.6,10.6L2,7V16H11L7.38,12.38C8.77,11.22 10.54,10.5 12.5,10.5C16.04,10.5 19.05,12.81 20.1,16L22.47,15.22C21.08,11.03 17.15,8 12.5,8Z"/>
                            </svg>
                        </button>
                        <button class="rte-btn" id="rte-redo" title="Redo">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M18.4,10.6C16.55,9 14.15,8 11.5,8C6.85,8 2.92,11.03 1.53,15.22L3.9,16C4.95,12.81 7.96,10.5 11.5,10.5C13.46,10.5 15.23,11.22 16.62,12.38L13,16H22V7L18.4,10.6Z"/>
                            </svg>
                        </button>
                    </div>

                    <div class="rte-separator"></div>

                    <!-- Font Controls -->
                    <div class="rte-toolbar-group">
                        <select class="rte-select" id="rte-font-family">
                            <option value="Arial">Arial</option>
                            <option value="Georgia" selected>Georgia</option>
                            <option value="Times New Roman">Times New Roman</option>
                            <option value="Helvetica">Helvetica</option>
                            <option value="Verdana">Verdana</option>
                            <option value="Courier New">Courier New</option>
                        </select>
                        <select class="rte-select" id="rte-font-size">
                            <option value="10">10px</option>
                            <option value="12">12px</option>
                            <option value="14" selected>14px</option>
                            <option value="16">16px</option>
                            <option value="18">18px</option>
                            <option value="20">20px</option>
                            <option value="24">24px</option>
                            <option value="32">32px</option>
                        </select>
                    </div>

                    <div class="rte-separator"></div>

                    <!-- Text Formatting -->
                    <div class="rte-toolbar-group">
                        <button class="rte-btn" id="rte-bold" title="Bold">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M13.5,15.5H10V12.5H13.5A1.5,1.5 0 0,1 15,14A1.5,1.5 0 0,1 13.5,15.5M10,6.5H13A1.5,1.5 0 0,1 14.5,8A1.5,1.5 0 0,1 13,9.5H10M15.6,10.79C16.57,10.11 17.25,9.02 17.25,8C17.25,5.74 15.5,4 13.25,4H7V18H14.04C16.14,18 17.75,16.3 17.75,14.21C17.75,12.69 16.89,11.39 15.6,10.79Z"/>
                            </svg>
                        </button>
                        <button class="rte-btn" id="rte-italic" title="Italic">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M10,4V7H12.21L8.79,15H6V18H14V15H11.79L15.21,7H18V4H10Z"/>
                            </svg>
                        </button>
                        <button class="rte-btn" id="rte-underline" title="Underline">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M5,21H19V19H5V21M12,17A6,6 0 0,0 18,11V3H15.5V11A3.5,3.5 0 0,1 12,14.5A3.5,3.5 0 0,1 8.5,11V3H6V11A6,6 0 0,0 12,17Z"/>
                            </svg>
                        </button>
                        <button class="rte-btn" id="rte-strikethrough" title="Strikethrough">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M7.2 9.8C7.2 8.29 8.4 7.5 10 7.5S12.8 8.29 12.8 9.8H15.1C15.1 7.16 12.9 5.5 10 5.5S4.9 7.16 4.9 9.8C4.9 10.81 5.3 11.6 6.1 12.15H4V14.15H20V12.15H17.9C18.7 11.6 19.1 10.81 19.1 9.8C19.1 7.16 16.9 5.5 14 5.5H10C7.1 5.5 4.9 7.16 4.9 9.8V10.5H7.2V9.8M10 16.5C8.4 16.5 7.2 15.71 7.2 14.2H4.9C4.9 16.84 7.1 18.5 10 18.5S15.1 16.84 15.1 14.2H12.8C12.8 15.71 11.6 16.5 10 16.5Z"/>
                            </svg>
                        </button>
                        <input type="color" class="rte-color-picker" id="rte-text-color" value="#000000" title="Text Color">
                        <input type="color" class="rte-color-picker" id="rte-bg-color" value="#ffff00" title="Background Color">
                    </div>

                    <div class="rte-separator"></div>

                    <!-- Alignment -->
                    <div class="rte-toolbar-group">
                        <button class="rte-btn" id="rte-align-left" title="Align Left">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M3,3H21V5H3V3M3,7H15V9H3V7M3,11H21V13H3V11M3,15H15V17H3V15M3,19H21V21H3V19Z"/>
                            </svg>
                        </button>
                        <button class="rte-btn" id="rte-align-center" title="Align Center">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M3,3H21V5H3V3M7,7H17V9H7V7M3,11H21V13H3V11M7,15H17V17H7V15M3,19H21V21H3V19Z"/>
                            </svg>
                        </button>
                        <button class="rte-btn" id="rte-align-right" title="Align Right">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M3,3H21V5H3V3M9,7H21V9H9V7M3,11H21V13H3V11M9,15H21V17H9V15M3,19H21V21H3V19Z"/>
                            </svg>
                        </button>
                        <button class="rte-btn" id="rte-align-justify" title="Justify">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M3,3H21V5H3V3M3,7H21V9H3V7M3,11H21V13H3V11M3,15H21V17H3V15M3,19H21V21H3V19Z"/>
                            </svg>
                        </button>
                    </div>

                    <div class="rte-separator"></div>

                    <!-- Lists -->
                    <div class="rte-toolbar-group">
                        <button class="rte-btn" id="rte-bullet-list" title="Bullet List">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M7,5H21V7H7V5M7,13V11H21V13H7M4,4.5A1.5,1.5 0 0,1 5.5,6A1.5,1.5 0 0,1 4,7.5A1.5,1.5 0 0,1 2.5,6A1.5,1.5 0 0,1 4,4.5M4,10.5A1.5,1.5 0 0,1 5.5,12A1.5,1.5 0 0,1 4,13.5A1.5,1.5 0 0,1 2.5,12A1.5,1.5 0 0,1 4,10.5M7,19V17H21V19H7M4,16.5A1.5,1.5 0 0,1 5.5,18A1.5,1.5 0 0,1 4,19.5A1.5,1.5 0 0,1 2.5,18A1.5,1.5 0 0,1 4,16.5Z"/>
                            </svg>
                        </button>
                        <button class="rte-btn" id="rte-number-list" title="Numbered List">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M7,13V11H21V13H7M7,19V17H21V19H7M7,7V5H21V7H7M3,8V5H2V4H4V8H3M2,17V16H5V20H2V19H4V18.5H3V17.5H4V17H2M4.25,10A0.75,0.75 0 0,1 5,10.75C5,10.95 4.92,11.14 4.79,11.27L3.12,13H5V14H2V13.08L4,11H2V10H4.25Z"/>
                            </svg>
                        </button>
                    </div>

                    <div class="rte-separator"></div>

                    <!-- Insert -->
                    <div class="rte-toolbar-group">
                        <button class="rte-btn" id="rte-link" title="Insert Link">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M3.9,12C3.9,10.29 5.29,8.9 7,8.9H11V7H7A5,5 0 0,0 2,12A5,5 0 0,0 7,17H11V15.1H7C5.29,15.1 3.9,13.71 3.9,12M8,13H16V11H8V13M17,7H13V8.9H17C18.71,8.9 20.1,10.29 20.1,12C20.1,13.71 18.71,15.1 17,15.1H13V17H17A5,5 0 0,0 22,12A5,5 0 0,0 17,7Z"/>
                            </svg>
                        </button>
                        <button class="rte-btn" id="rte-image" title="Insert Image">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M8.5,13.5L11,16.5L14.5,12L19,18H5M21,19V5C21,3.89 20.1,3 19,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19Z"/>
                            </svg>
                        </button>
                        <button class="rte-btn" id="rte-table" title="Insert Table">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M5,4H19A2,2 0 0,1 21,6V18A2,2 0 0,1 19,20H5A2,2 0 0,1 3,18V6A2,2 0 0,1 5,4M5,8V12H11V8H5M13,8V12H19V8H13M5,14V18H11V14H5M13,14V18H19V14H13Z"/>
                            </svg>
                        </button>
                        <button class="rte-btn" id="rte-hr" title="Horizontal Rule">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19,13H5V11H19V13Z"/>
                            </svg>
                        </button>
                    </div>

                    <div class="rte-separator"></div>

                    <!-- View -->
                    <div class="rte-toolbar-group">
                        <button class="rte-btn" id="rte-source" title="HTML Source">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M14.6,16.6L19.2,12L14.6,7.4L16,6L22,12L16,18L14.6,16.6M9.4,16.6L4.8,12L9.4,7.4L8,6L2,12L8,18L9.4,16.6Z"/>
                            </svg>
                        </button>
                        <button class="rte-btn" id="rte-preview" title="Preview">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z"/>
                            </svg>
                        </button>
                    </div>
                </div>

                <div class="rte-find-replace rte-hidden" id="rte-find-panel">
                    <input type="text" class="rte-find-input" id="rte-find-input" placeholder="Find...">
                    <button class="rte-btn" id="rte-find-prev" title="Previous">↑</button>
                    <button class="rte-btn" id="rte-find-next" title="Next">↓</button>
                    <span id="rte-find-count">0 of 0</span>
                    <input type="text" class="rte-find-input" id="rte-replace-input" placeholder="Replace...">
                    <button class="rte-btn-secondary" id="rte-replace-one">Replace</button>
                    <button class="rte-btn-secondary" id="rte-replace-all">Replace All</button>
                    <button class="rte-btn" id="rte-close-find" title="Close">×</button>
                </div>

                <div class="rte-editor-area">
                    <div contenteditable="true" class="rte-editor" id="rte-editor" spellcheck="${this.options.spellCheck}">
                        <p>${this.options.placeholder}</p>
                    </div>
                    <textarea class="rte-source-editor rte-hidden" id="rte-source-editor"></textarea>
                    <div class="rte-preview rte-hidden" id="rte-preview"></div>
                </div>

                <div class="rte-status-bar">
                    <div>
                        <span id="rte-position">Line 1, Column 1</span>
                        <span> | </span>
                        <span id="rte-word-count">0 words</span>
                        <span> | </span>
                        <span id="rte-char-count">0 characters</span>
                    </div>
                    <div>
                        <span id="rte-status">Ready</span>
                    </div>
                </div>
            </div>
        `;

        // Get editor elements
        this.editor = this.container.querySelector('#rte-editor');
        this.sourceEditor = this.container.querySelector('#rte-source-editor');
        this.previewArea = this.container.querySelector('#rte-preview');
        this.toolbar = this.container.querySelector('.rte-toolbar');

        // Focus editor and set cursor
        this.editor.focus();
        this.setCursorAtEnd();
    }

    setupEventListeners() {
        // Editor events
        this.editor.addEventListener('input', () => this.handleInput());
        this.editor.addEventListener('paste', (e) => this.handlePaste(e));
        this.editor.addEventListener('keydown', (e) => this.handleKeyDown(e));
        this.editor.addEventListener('selectionchange', () => this.updateToolbarState());
        this.editor.addEventListener('focus', () => this.updatePosition());
        this.editor.addEventListener('blur', () => this.saveCurrentState());

        // Source editor sync
        this.sourceEditor.addEventListener('input', () => {
            if (this.isSourceMode) {
                this.editor.innerHTML = this.sourceEditor.value;
                this.updateStats();
            }
        });

        // Toolbar buttons
        this.setupToolbarEvents();

        // Window events
        window.addEventListener('resize', () => this.updatePosition());
        window.addEventListener('beforeunload', () => this.autoSave());
        
        // Document selection
        document.addEventListener('selectionchange', () => this.updateToolbarState());
    }

    setupToolbarEvents() {
        // File operations
        this.container.querySelector('#rte-new').addEventListener('click', () => this.newDocument());
        this.container.querySelector('#rte-save').addEventListener('click', () => this.saveDocument());
        
        // Export dropdown
        const exportBtn = this.container.querySelector('#rte-export');
        const exportDropdown = exportBtn.parentElement;
        exportBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            exportDropdown.classList.toggle('active');
        });
        
        exportDropdown.querySelectorAll('.rte-dropdown-item').forEach(item => {
            item.addEventListener('click', () => {
                this.exportDocument(item.dataset.format);
                exportDropdown.classList.remove('active');
            });
        });

        // Edit operations
        this.container.querySelector('#rte-undo').addEventListener('click', () => this.undo());
        this.container.querySelector('#rte-redo').addEventListener('click', () => this.redo());

        // Font controls
        this.container.querySelector('#rte-font-family').addEventListener('change', (e) => {
            this.execCommand('fontName', e.target.value);
        });
        this.container.querySelector('#rte-font-size').addEventListener('change', (e) => {
            this.editor.style.fontSize = e.target.value + 'px';
        });

        // Formatting
        this.container.querySelector('#rte-bold').addEventListener('click', () => this.execCommand('bold'));
        this.container.querySelector('#rte-italic').addEventListener('click', () => this.execCommand('italic'));
        this.container.querySelector('#rte-underline').addEventListener('click', () => this.execCommand('underline'));
        this.container.querySelector('#rte-strikethrough').addEventListener('click', () => this.execCommand('strikeThrough'));

        // Colors
        this.container.querySelector('#rte-text-color').addEventListener('change', (e) => {
            this.execCommand('foreColor', e.target.value);
        });
        this.container.querySelector('#rte-bg-color').addEventListener('change', (e) => {
            this.execCommand('hiliteColor', e.target.value);
        });

        // Alignment
        this.container.querySelector('#rte-align-left').addEventListener('click', () => this.execCommand('justifyLeft'));
        this.container.querySelector('#rte-align-center').addEventListener('click', () => this.execCommand('justifyCenter'));
        this.container.querySelector('#rte-align-right').addEventListener('click', () => this.execCommand('justifyRight'));
        this.container.querySelector('#rte-align-justify').addEventListener('click', () => this.execCommand('justifyFull'));

        // Lists
        this.container.querySelector('#rte-bullet-list').addEventListener('click', () => this.execCommand('insertUnorderedList'));
        this.container.querySelector('#rte-number-list').addEventListener('click', () => this.execCommand('insertOrderedList'));

        // Insert
        this.container.querySelector('#rte-link').addEventListener('click', () => this.insertLink());
        this.container.querySelector('#rte-image').addEventListener('click', () => this.insertImage());
        this.container.querySelector('#rte-table').addEventListener('click', () => this.insertTable());
        this.container.querySelector('#rte-hr').addEventListener('click', () => this.execCommand('insertHorizontalRule'));

        // View
        this.container.querySelector('#rte-source').addEventListener('click', () => this.toggleSourceMode());
        this.container.querySelector('#rte-preview').addEventListener('click', () => this.togglePreviewMode());

        // Header actions
        this.container.querySelector('#rte-theme-toggle').addEventListener('click', () => this.toggleTheme());
        this.container.querySelector('#rte-fullscreen').addEventListener('click', () => this.toggleFullscreen());

        // Find/Replace
        this.setupFindReplace();

        // Close dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.rte-dropdown')) {
                this.container.querySelectorAll('.rte-dropdown').forEach(dropdown => {
                    dropdown.classList.remove('active');
                });
            }
        });
    }

    setupFindReplace() {
        const findPanel = this.container.querySelector('#rte-find-panel');
        const findInput = this.container.querySelector('#rte-find-input');
        const replaceInput = this.container.querySelector('#rte-replace-input');
        const findCount = this.container.querySelector('#rte-find-count');
        
        let matches = [];
        let currentMatch = -1;

        const performFind = () => {
            const searchTerm = findInput.value;
            this.clearHighlights();
            
            if (!searchTerm) {
                findCount.textContent = '0 of 0';
                return;
            }

            matches = this.highlightMatches(searchTerm);
            findCount.textContent = `${matches.length > 0 ? currentMatch + 1 : 0} of ${matches.length}`;
            
            if (matches.length > 0) {
                currentMatch = 0;
                this.selectMatch(currentMatch);
            }
        };

        findInput.addEventListener('input', performFind);
        
        this.container.querySelector('#rte-find-next').addEventListener('click', () => {
            if (matches.length > 0) {
                currentMatch = (currentMatch + 1) % matches.length;
                this.selectMatch(currentMatch);
                findCount.textContent = `${currentMatch + 1} of ${matches.length}`;
            }
        });

        this.container.querySelector('#rte-find-prev').addEventListener('click', () => {
            if (matches.length > 0) {
                currentMatch = currentMatch > 0 ? currentMatch - 1 : matches.length - 1;
                this.selectMatch(currentMatch);
                findCount.textContent = `${currentMatch + 1} of ${matches.length}`;
            }
        });

        this.container.querySelector('#rte-replace-one').addEventListener('click', () => {
            if (matches.length > 0 && currentMatch >= 0) {
                const match = matches[currentMatch];
                match.outerHTML = replaceInput.value;
                performFind();
            }
        });

        this.container.querySelector('#rte-replace-all').addEventListener('click', () => {
            const searchTerm = findInput.value;
            const replaceTerm = replaceInput.value;
            
            if (searchTerm) {
                this.editor.innerHTML = this.editor.innerHTML.replace(
                    new RegExp(this.escapeRegex(searchTerm), 'gi'),
                    replaceTerm
                );
                performFind();
            }
        });

        this.container.querySelector('#rte-close-find').addEventListener('click', () => {
            findPanel.classList.add('rte-hidden');
            this.clearHighlights();
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (!this.editor.contains(document.activeElement) && !this.sourceEditor.contains(document.activeElement)) {
                return;
            }

            if (e.ctrlKey || e.metaKey) {
                switch (e.key.toLowerCase()) {
                    case 'n':
                        e.preventDefault();
                        this.newDocument();
                        break;
                    case 's':
                        e.preventDefault();
                        this.saveDocument();
                        break;
                    case 'z':
                        e.preventDefault();
                        if (e.shiftKey) {
                            this.redo();
                        } else {
                            this.undo();
                        }
                        break;
                    case 'y':
                        e.preventDefault();
                        this.redo();
                        break;
                    case 'f':
                        e.preventDefault();
                        this.showFindReplace();
                        break;
                    case 'k':
                        e.preventDefault();
                        this.insertLink();
                        break;
                    case 'b':
                        e.preventDefault();
                        this.execCommand('bold');
                        break;
                    case 'i':
                        e.preventDefault();
                        this.execCommand('italic');
                        break;
                    case 'u':
                        e.preventDefault();
                        this.execCommand('underline');
                        break;
                }
            }

            if (e.key === 'Escape') {
                this.container.querySelector('#rte-find-panel').classList.add('rte-hidden');
                this.clearHighlights();
            }
        });
    }

    setupAutoSave() {
        if (this.options.autoSave) {
            this.autoSaveInterval = setInterval(() => {
                this.autoSave();
            }, 30000); // Auto-save every 30 seconds
        }
    }

    setupTheme() {
        const theme = this.options.theme || localStorage.getItem('rte-theme') || 'light';
        this.container.setAttribute('data-rte-theme', theme);
    }

    // Core editing methods
    execCommand(command, value = null) {
        this.editor.focus();
        this.saveCurrentState();
        
        try {
            const result = document.execCommand(command, false, value);
            this.updateToolbarState();
            this.updateStats();
            return result;
        } catch (error) {
            console.error('Command execution failed:', error);
            return false;
        }
    }

    insertContent(content) {
        this.editor.focus();
        this.saveCurrentState();
        
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            range.deleteContents();
            
            if (typeof content === 'string') {
                const temp = document.createElement('div');
                temp.innerHTML = content;
                const fragment = document.createDocumentFragment();
                while (temp.firstChild) {
                    fragment.appendChild(temp.firstChild);
                }
                range.insertNode(fragment);
            } else {
                range.insertNode(content);
            }
            
            range.collapse(false);
            selection.removeAllRanges();
            selection.addRange(range);
        } else {
            this.editor.innerHTML += content;
        }
        
        this.updateStats();
    }

    // History management
    saveCurrentState() {
        const state = {
            content: this.editor.innerHTML,
            timestamp: Date.now()
        };
        
        this.history = this.history.slice(0, this.historyIndex + 1);
        this.history.push(state);
        this.historyIndex = this.history.length - 1;
        
        if (this.history.length > 100) {
            this.history = this.history.slice(-100);
            this.historyIndex = this.history.length - 1;
        }
        
        this.updateToolbarState();
    }

    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            const state = this.history[this.historyIndex];
            this.editor.innerHTML = state.content;
            this.updateToolbarState();
            this.updateStats();
        }
    }

    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            const state = this.history[this.historyIndex];
            this.editor.innerHTML = state.content;
            this.updateToolbarState();
            this.updateStats();
        }
    }

    canUndo() {
        return this.historyIndex > 0;
    }

    canRedo() {
        return this.historyIndex < this.history.length - 1;
    }

    // View modes
    toggleSourceMode() {
        if (this.isSourceMode) {
            this.editor.innerHTML = this.sourceEditor.value;
            this.sourceEditor.classList.add('rte-hidden');
            this.editor.classList.remove('rte-hidden');
            this.isSourceMode = false;
        } else {
            this.sourceEditor.value = this.formatHTML(this.editor.innerHTML);
            this.editor.classList.add('rte-hidden');
            this.sourceEditor.classList.remove('rte-hidden');
            this.isSourceMode = true;
        }
        
        this.updateToolbarState();
    }

    togglePreviewMode() {
        if (this.isPreviewMode) {
            this.previewArea.classList.add('rte-hidden');
            this.editor.classList.remove('rte-hidden');
            this.isPreviewMode = false;
        } else {
            this.previewArea.innerHTML = this.editor.innerHTML;
            this.editor.classList.add('rte-hidden');
            this.previewArea.classList.remove('rte-hidden');
            this.isPreviewMode = true;
        }
        
        this.updateToolbarState();
    }

    toggleTheme() {
        const themes = ['light', 'dark'];
        const currentTheme = this.container.getAttribute('data-rte-theme') || 'light';
        const nextTheme = themes[(themes.indexOf(currentTheme) + 1) % themes.length];
        
        this.container.setAttribute('data-rte-theme', nextTheme);
        localStorage.setItem('rte-theme', nextTheme);
    }

    toggleFullscreen() {
        if (this.container.classList.contains('rte-fullscreen')) {
            this.container.classList.remove('rte-fullscreen');
            this.container.style.position = '';
            this.container.style.top = '';
            this.container.style.left = '';
            this.container.style.width = '';
            this.container.style.height = '';
            this.container.style.zIndex = '';
        } else {
            this.container.classList.add('rte-fullscreen');
            this.container.style.position = 'fixed';
            this.container.style.top = '0';
            this.container.style.left = '0';
            this.container.style.width = '100vw';
            this.container.style.height = '100vh';
            this.container.style.zIndex = '9999';
        }
    }

    // Event handlers
    handleInput() {
        clearTimeout(this.inputTimeout);
        this.inputTimeout = setTimeout(() => {
            this.saveCurrentState();
        }, 1000);
        
        this.updateStats();
        this.updatePosition();
        this.isModified = true;
    }

    handlePaste(e) {
        e.preventDefault();
        
        const clipboardData = e.clipboardData || window.clipboardData;
        const htmlData = clipboardData.getData('text/html');
        const textData = clipboardData.getData('text/plain');
        
        if (htmlData) {
            const cleanHTML = this.cleanPastedHTML(htmlData);
            this.insertContent(cleanHTML);
        } else if (textData) {
            this.insertContent(this.escapeHTML(textData));
        }
    }

    handleKeyDown(e) {
        if (e.key === 'Tab') {
            e.preventDefault();
            this.insertContent('&nbsp;&nbsp;&nbsp;&nbsp;');
        }
    }

    // Document operations
    newDocument() {
        if (this.isModified) {
            if (!confirm('You have unsaved changes. Continue?')) {
                return;
            }
        }

        this.currentDocument = null;
        this.isModified = false;
        this.editor.innerHTML = `<p>${this.options.placeholder}</p>`;
        this.history = [];
        this.historyIndex = -1;
        this.saveCurrentState();
        this.updateStats();
        this.editor.focus();
        this.setCursorAtEnd();
    }

    saveDocument() {
        const content = this.editor.innerHTML;
        const title = this.extractTitle(content) || 'Untitled Document';
        
        const doc = {
            id: this.currentDocument ? this.currentDocument.id : this.generateId(),
            title: title,
            content: content,
            createdAt: this.currentDocument ? this.currentDocument.createdAt : new Date().toISOString(),
            modifiedAt: new Date().toISOString(),
            wordCount: this.countWords(this.getTextContent()),
            characterCount: this.getTextContent().length
        };

        this.saveToStorage(doc);
        this.currentDocument = doc;
        this.isModified = false;
        this.updateStatus('Document saved');
    }

    autoSave() {
        if (!this.isModified) return;

        const content = this.editor.innerHTML;
        const autoSaveData = {
            content: content,
            timestamp: new Date().toISOString(),
            currentDocument: this.currentDocument
        };

        localStorage.setItem('rte-autosave', JSON.stringify(autoSaveData));
        this.updateStatus('Auto-saved');
    }

    exportDocument(format) {
        const content = this.editor.innerHTML;
        const title = this.extractTitle(content) || 'document';
        
        switch (format) {
            case 'html':
                this.downloadFile(this.generateCompleteHTML(content, title), `${title}.html`, 'text/html');
                break;
            case 'text':
                this.downloadFile(this.getTextContent(), `${title}.txt`, 'text/plain');
                break;
            case 'json':
                const docData = {
                    title: title,
                    content: content,
                    exportedAt: new Date().toISOString(),
                    metadata: {
                        wordCount: this.countWords(this.getTextContent()),
                        characterCount: this.getTextContent().length
                    }
                };
                this.downloadFile(JSON.stringify(docData, null, 2), `${title}.json`, 'application/json');
                break;
        }
    }

    // Insert operations
    insertLink() {
        const url = prompt('Enter URL:');
        if (url) {
            const text = prompt('Enter link text:') || url;
            this.insertContent(`<a href="${url}" target="_blank">${text}</a>`);
        }
    }

    insertImage() {
        const url = prompt('Enter image URL:');
        if (url) {
            const alt = prompt('Enter alt text:') || 'Image';
            this.insertContent(`<img src="${url}" alt="${alt}" style="max-width: 100%; height: auto;">`);
        }
    }

    insertTable() {
        this.showTableDialog();
    }

    showTableDialog() {
        const modal = this.createModal('Insert Table', `
            <div class="rte-table-config">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                    <div>
                        <label style="display: block; margin-bottom: 0.25rem; font-weight: 500;">Rows:</label>
                        <input type="number" id="rte-table-rows" class="rte-input" value="3" min="1" max="20" style="margin-bottom: 0;">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 0.25rem; font-weight: 500;">Columns:</label>
                        <input type="number" id="rte-table-cols" class="rte-input" value="3" min="1" max="10" style="margin-bottom: 0;">
                    </div>
                </div>
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.25rem; font-weight: 500;">Table Width:</label>
                    <select id="rte-table-width" class="rte-select" style="width: 100%; margin-bottom: 0;">
                        <option value="100%">Full Width (100%)</option>
                        <option value="75%">Three Quarters (75%)</option>
                        <option value="50%">Half Width (50%)</option>
                        <option value="25%">Quarter Width (25%)</option>
                        <option value="auto">Auto Width</option>
                    </select>
                </div>
                <div style="display: flex; gap: 1rem; margin-bottom: 1rem;">
                    <label style="display: flex; align-items: center; gap: 0.5rem;">
                        <input type="checkbox" id="rte-table-header" checked>
                        <span>Include Header Row</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 0.5rem;">
                        <input type="checkbox" id="rte-table-borders" checked>
                        <span>Show Borders</span>
                    </label>
                </div>
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Preview:</label>
                    <div id="rte-table-preview" style="border: 1px solid var(--rte-border); border-radius: 4px; padding: 1rem; background: var(--rte-background); overflow: auto; max-height: 200px;">
                        <!-- Preview will be inserted here -->
                    </div>
                </div>
            </div>
        `, [
            { text: 'Insert Table', primary: true, action: () => this.insertTableFromDialog() },
            { text: 'Cancel', action: () => this.closeModal() }
        ]);

        // Update preview when options change
        const updatePreview = () => this.updateTablePreview();
        modal.querySelector('#rte-table-rows').addEventListener('input', updatePreview);
        modal.querySelector('#rte-table-cols').addEventListener('input', updatePreview);
        modal.querySelector('#rte-table-width').addEventListener('change', updatePreview);
        modal.querySelector('#rte-table-header').addEventListener('change', updatePreview);
        modal.querySelector('#rte-table-borders').addEventListener('change', updatePreview);

        // Initial preview
        updatePreview();
    }

    updateTablePreview() {
        const rows = parseInt(document.getElementById('rte-table-rows').value) || 3;
        const cols = parseInt(document.getElementById('rte-table-cols').value) || 3;
        const width = document.getElementById('rte-table-width').value;
        const hasHeader = document.getElementById('rte-table-header').checked;
        const hasBorders = document.getElementById('rte-table-borders').checked;

        const borderStyle = hasBorders ? 'border: 1px solid #ddd;' : 'border: none;';
        const tableStyle = `width: ${width}; border-collapse: collapse; ${borderStyle}`;

        let html = `<table style="${tableStyle}">`;
        
        for (let r = 0; r < rows; r++) {
            html += '<tr>';
            for (let c = 0; c < cols; c++) {
                const isHeader = hasHeader && r === 0;
                const tag = isHeader ? 'th' : 'td';
                const cellStyle = `${borderStyle} padding: 8px; text-align: left;${isHeader ? ' background: #f5f5f5; font-weight: bold;' : ''}`;
                const cellContent = isHeader ? `Header ${c + 1}` : `Cell ${r},${c + 1}`;
                html += `<${tag} style="${cellStyle}">${cellContent}</${tag}>`;
            }
            html += '</tr>';
        }
        html += '</table>';

        document.getElementById('rte-table-preview').innerHTML = html;
    }

    insertTableFromDialog() {
        const rows = parseInt(document.getElementById('rte-table-rows').value) || 3;
        const cols = parseInt(document.getElementById('rte-table-cols').value) || 3;
        const width = document.getElementById('rte-table-width').value;
        const hasHeader = document.getElementById('rte-table-header').checked;
        const hasBorders = document.getElementById('rte-table-borders').checked;

        const borderStyle = hasBorders ? 'border: 1px solid #ddd;' : 'border: none;';
        const tableStyle = `width: ${width}; border-collapse: collapse; margin: 1rem 0; ${borderStyle}`;

        let html = `<table style="${tableStyle}">`;
        
        for (let r = 0; r < rows; r++) {
            html += '<tr>';
            for (let c = 0; c < cols; c++) {
                const isHeader = hasHeader && r === 0;
                const tag = isHeader ? 'th' : 'td';
                const cellStyle = `${borderStyle} padding: 8px; text-align: left;${isHeader ? ' background: #f5f5f5; font-weight: bold;' : ''}`;
                html += `<${tag} style="${cellStyle}">&nbsp;</${tag}>`;
            }
            html += '</tr>';
        }
        html += '</table><p>&nbsp;</p>';

        this.insertContent(html);
        this.closeModal();
    }

    showFindReplace() {
        const findPanel = this.container.querySelector('#rte-find-panel');
        findPanel.classList.remove('rte-hidden');
        this.container.querySelector('#rte-find-input').focus();
    }

    createModal(title, content, buttons = []) {
        const modal = document.createElement('div');
        modal.className = 'rte-modal rte-animate-in';
        modal.innerHTML = `
            <div class="rte-modal-content">
                <div class="rte-modal-header">
                    <h3>${title}</h3>
                    <button class="rte-btn" onclick="this.closest('.rte-modal').remove()">×</button>
                </div>
                <div class="rte-modal-body">
                    ${content}
                </div>
                <div class="rte-modal-footer">
                    ${buttons.map(btn => `
                        <button class="${btn.primary ? 'rte-btn-primary' : 'rte-btn-secondary'}" 
                                data-action="${btn.action ? 'custom' : 'close'}">
                            ${btn.text}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;

        // Add event listeners for buttons
        buttons.forEach((btn, index) => {
            if (btn.action) {
                const buttonEl = modal.querySelectorAll('.rte-modal-footer button')[index];
                buttonEl.addEventListener('click', btn.action);
            }
        });

        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        // Close modal on Escape key
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);

        document.body.appendChild(modal);
        return modal;
    }

    closeModal() {
        const modal = document.querySelector('.rte-modal');
        if (modal) {
            modal.remove();
        }
    }

    // Utility methods
    updateToolbarState() {
        // Update undo/redo buttons
        const undoBtn = this.container.querySelector('#rte-undo');
        const redoBtn = this.container.querySelector('#rte-redo');
        
        undoBtn.disabled = !this.canUndo();
        redoBtn.disabled = !this.canRedo();

        // Update format buttons
        const formatButtons = [
            { id: '#rte-bold', command: 'bold' },
            { id: '#rte-italic', command: 'italic' },
            { id: '#rte-underline', command: 'underline' },
            { id: '#rte-strikethrough', command: 'strikeThrough' }
        ];

        formatButtons.forEach(({ id, command }) => {
            const button = this.container.querySelector(id);
            if (document.queryCommandState(command)) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });

        // Update alignment buttons
        const alignButtons = ['#rte-align-left', '#rte-align-center', '#rte-align-right', '#rte-align-justify'];
        alignButtons.forEach(id => {
            this.container.querySelector(id).classList.remove('active');
        });

        // Update list buttons
        const listButtons = [
            { id: '#rte-bullet-list', command: 'insertUnorderedList' },
            { id: '#rte-number-list', command: 'insertOrderedList' }
        ];

        listButtons.forEach(({ id, command }) => {
            const button = this.container.querySelector(id);
            if (document.queryCommandState(command)) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });

        // Update view buttons
        const sourceBtn = this.container.querySelector('#rte-source');
        const previewBtn = this.container.querySelector('#rte-preview');

        if (this.isSourceMode) {
            sourceBtn.classList.add('active');
        } else {
            sourceBtn.classList.remove('active');
        }

        if (this.isPreviewMode) {
            previewBtn.classList.add('active');
        } else {
            previewBtn.classList.remove('active');
        }
    }

    updateStats() {
        const text = this.getTextContent();
        const wordCount = this.countWords(text);
        const charCount = text.length;
        
        this.container.querySelector('#rte-word-count').textContent = `${wordCount} words`;
        this.container.querySelector('#rte-char-count').textContent = `${charCount} characters`;
    }

    updatePosition() {
        const selection = window.getSelection();
        if (selection.rangeCount > 0 && this.editor.contains(selection.anchorNode)) {
            // Simple position tracking
            this.container.querySelector('#rte-position').textContent = 'Line 1, Column 1';
        }
    }

    updateStatus(message = 'Ready') {
        this.container.querySelector('#rte-status').textContent = message;
        if (message !== 'Ready') {
            setTimeout(() => {
                this.container.querySelector('#rte-status').textContent = 'Ready';
            }, 3000);
        }
    }

    // Search and replace utilities
    highlightMatches(searchTerm) {
        const walker = document.createTreeWalker(
            this.editor,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        const matches = [];
        const regex = new RegExp(this.escapeRegex(searchTerm), 'gi');
        const textNodes = [];
        
        let node;
        while (node = walker.nextNode()) {
            textNodes.push(node);
        }

        textNodes.forEach(textNode => {
            const text = textNode.textContent;
            if (regex.test(text)) {
                const parent = textNode.parentNode;
                const wrapper = document.createElement('span');
                wrapper.innerHTML = text.replace(regex, '<span class="rte-highlight">$&</span>');
                
                parent.insertBefore(wrapper, textNode);
                parent.removeChild(textNode);
                
                wrapper.querySelectorAll('.rte-highlight').forEach(match => {
                    matches.push(match);
                });
            }
        });

        return matches;
    }

    clearHighlights() {
        this.container.querySelectorAll('.rte-highlight').forEach(highlight => {
            const parent = highlight.parentNode;
            parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
            parent.normalize();
        });
    }

    selectMatch(index) {
        const matches = this.container.querySelectorAll('.rte-highlight');
        matches.forEach((match, i) => {
            if (i === index) {
                match.classList.add('rte-current-match');
                match.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                match.classList.remove('rte-current-match');
            }
        });
    }

    // Content utilities
    getTextContent() {
        return this.editor.textContent || this.editor.innerText || '';
    }

    countWords(text) {
        return text.trim().split(/\s+/).filter(word => word.length > 0).length;
    }

    extractTitle(content) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = content;
        
        const heading = tempDiv.querySelector('h1, h2, h3, h4, h5, h6');
        if (heading) {
            return heading.textContent.trim();
        }
        
        const firstP = tempDiv.querySelector('p');
        if (firstP) {
            const text = firstP.textContent.trim();
            return text.length > 50 ? text.substring(0, 50) + '...' : text;
        }
        
        const text = tempDiv.textContent.trim();
        return text.length > 50 ? text.substring(0, 50) + '...' : text;
    }

    formatHTML(html) {
        return html
            .replace(/></g, '>\n<')
            .replace(/^\s+|\s+$/g, '')
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .join('\n');
    }

    cleanPastedHTML(html) {
        const temp = document.createElement('div');
        temp.innerHTML = html;
        
        const scripts = temp.querySelectorAll('script, style');
        scripts.forEach(el => el.remove());
        
        const allElements = temp.querySelectorAll('*');
        allElements.forEach(el => {
            const allowedAttrs = ['href', 'src', 'alt', 'title'];
            Array.from(el.attributes).forEach(attr => {
                if (!allowedAttrs.includes(attr.name.toLowerCase())) {
                    el.removeAttribute(attr.name);
                }
            });
        });
        
        return temp.innerHTML;
    }

    escapeHTML(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    setCursorAtEnd() {
        const range = document.createRange();
        const selection = window.getSelection();
        range.selectNodeContents(this.editor);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    generateCompleteHTML(content, title) {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.escapeHTML(title)}</title>
    <style>
        body {
            font-family: Georgia, 'Times New Roman', serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
            color: #333;
        }
        h1, h2, h3, h4, h5, h6 { margin-top: 2rem; margin-bottom: 1rem; }
        p { margin-bottom: 1rem; }
        ul, ol { margin: 1rem 0; padding-left: 2rem; }
        table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
        table td, table th { border: 1px solid #ddd; padding: 8px; }
        table th { background-color: #f2f2f2; }
        img { max-width: 100%; height: auto; }
    </style>
</head>
<body>
    ${content}
</body>
</html>`;
    }

    saveToStorage(doc) {
        const documents = this.getStoredDocuments();
        const existingIndex = documents.findIndex(d => d.id === doc.id);
        
        if (existingIndex >= 0) {
            documents[existingIndex] = doc;
        } else {
            documents.push(doc);
        }
        
        documents.sort((a, b) => new Date(b.modifiedAt) - new Date(a.modifiedAt));
        localStorage.setItem('rte-documents', JSON.stringify(documents));
    }

    getStoredDocuments() {
        try {
            const docs = localStorage.getItem('rte-documents');
            return docs ? JSON.parse(docs) : [];
        } catch (error) {
            console.error('Error loading documents:', error);
            return [];
        }
    }

    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Public API methods
    getContent() {
        return this.editor.innerHTML;
    }

    setContent(content) {
        this.editor.innerHTML = content;
        this.saveCurrentState();
        this.updateStats();
    }

    getText() {
        return this.getTextContent();
    }

    insertHTML(html) {
        this.insertContent(html);
    }

    focus() {
        this.editor.focus();
    }

    blur() {
        this.editor.blur();
    }

    destroy() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }
        
        // Remove event listeners and clean up
        this.container.innerHTML = '';
        
        // Remove styles if no other instances
        const editors = document.querySelectorAll('.rte-container');
        if (editors.length === 0) {
            const styles = document.getElementById('rich-text-editor-styles');
            if (styles) {
                styles.remove();
            }
        }
    }
}

// Auto-initialization for data attributes
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-rich-editor]').forEach(element => {
        const options = {};
        
        // Parse data attributes
        if (element.dataset.height) options.height = element.dataset.height;
        if (element.dataset.theme) options.theme = element.dataset.theme;
        if (element.dataset.placeholder) options.placeholder = element.dataset.placeholder;
        if (element.dataset.toolbar) options.toolbar = element.dataset.toolbar;
        if (element.dataset.autoSave !== undefined) options.autoSave = element.dataset.autoSave === 'true';
        if (element.dataset.spellCheck !== undefined) options.spellCheck = element.dataset.spellCheck === 'true';
        
        new RichTextEditor(element, options);
    });
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RichTextEditor;
}
if (typeof window !== 'undefined') {
    window.RichTextEditor = RichTextEditor;
}