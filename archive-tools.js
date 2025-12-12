// Archive Tools
(() => {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initArchiveTools);
    } else {
        initArchiveTools();
    }

    function initArchiveTools() {
        const container = document.getElementById('archive-tools');
        if (!container) return;

        if (!container.querySelector('.tool-card')) {
            container.innerHTML = `
                <div class="tool-card">
                    <h3 class="tool-title">Archive Tools</h3>
                    <p class="tool-description">Create and extract ZIP archives</p>
                    
                    <div class="tabs">
                        <button class="tab-btn active" data-tab="create">Create ZIP</button>
                        <button class="tab-btn" data-tab="extract">Extract ZIP</button>
                    </div>
                    
                    <!-- Create ZIP -->
                    <div class="tab-content active" id="tab-create">
                        <div class="upload-zone" id="zip-create-zone">
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                                <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                                <line x1="12" y1="22.08" x2="12" y2="12"/>
                            </svg>
                            <p>Upload files to zip</p>
                            <input type="file" id="zip-create-input" multiple hidden>
                        </div>
                        
                        <div id="zip-create-preview" class="preview-grid" style="margin-top: 1.5rem;"></div>
                        
                        <div class="input-group" style="margin-top: 1.5rem;">
                            <label>Archive Name</label>
                            <input type="text" id="zip-filename" class="text-input" value="archive" placeholder="archive">
                        </div>
                        
                        <button id="create-zip-btn" class="btn-primary" disabled style="margin-top: 1rem;">Create ZIP</button>
                    </div>
                    
                    <!-- Extract ZIP -->
                    <div class="tab-content" id="tab-extract">
                        <div class="upload-zone" id="zip-extract-zone">
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                                <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                                <line x1="12" y1="22.08" x2="12" y2="12"/>
                            </svg>
                            <p>Upload ZIP to extract</p>
                            <input type="file" id="zip-extract-input" accept=".zip" hidden>
                        </div>
                        
                        <div id="zip-extract-preview" style="margin-top: 1.5rem; display: none;">
                            <h4>Extracted Files</h4>
                            <div id="extracted-files-list" style="margin-top: 1rem; display: grid; gap: 0.5rem;"></div>
                        </div>
                    </div>
                </div>
            `;
        }

        // Tabs Logic
        const tabs = container.querySelectorAll('.tab-btn');
        const contents = container.querySelectorAll('.tab-content');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const target = tab.dataset.tab;
                tabs.forEach(t => t.classList.remove('active'));
                contents.forEach(c => c.classList.remove('active'));
                tab.classList.add('active');
                container.querySelector(`#tab-${target}`).classList.add('active');
            });
        });

        // CREATE ZIP
        const createInput = document.getElementById('zip-create-input');
        const createZone = document.getElementById('zip-create-zone');
        const createPreview = document.getElementById('zip-create-preview');
        const createBtn = document.getElementById('create-zip-btn');
        const filenameInput = document.getElementById('zip-filename');
        let filesToZip = [];

        createZone.addEventListener('click', () => createInput.click());

        createInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            filesToZip = [...filesToZip, ...files];
            updateCreatePreview();
            createBtn.disabled = filesToZip.length === 0;
        });

        function updateCreatePreview() {
            createPreview.innerHTML = '';
            filesToZip.forEach((file, index) => {
                const item = document.createElement('div');
                item.className = 'preview-item';
                item.innerHTML = `
                    <div style="font-size: 1.5rem;">📄</div>
                    <div style="font-size: 0.8rem; word-break: break-all;">${file.name}</div>
                    <button class="remove-btn" onclick="removeZipFile(${index})">×</button>
                `;
                createPreview.appendChild(item);
            });
        }

        window.removeZipFile = (index) => {
            filesToZip.splice(index, 1);
            updateCreatePreview();
            createBtn.disabled = filesToZip.length === 0;
        };

        createBtn.addEventListener('click', async () => {
            if (filesToZip.length === 0) return;
            showLoading('Creating ZIP archive...');

            try {
                const zip = new JSZip();
                filesToZip.forEach(file => {
                    zip.file(file.name, file);
                });

                const content = await zip.generateAsync({ type: 'blob' });
                const filename = (filenameInput.value || 'archive') + '.zip';
                downloadFile(content, filename);
                showNotification('ZIP created successfully!');

                filesToZip = [];
                updateCreatePreview();
                createBtn.disabled = true;
            } catch (error) {
                console.error('ZIP Error:', error);
                showNotification('Error creating ZIP', 'error');
            } finally {
                hideLoading();
            }
        });

        // EXTRACT ZIP
        const extractInput = document.getElementById('zip-extract-input');
        const extractZone = document.getElementById('zip-extract-zone');
        const extractPreview = document.getElementById('zip-extract-preview');
        const extractedList = document.getElementById('extracted-files-list');

        extractZone.addEventListener('click', () => extractInput.click());

        extractInput.addEventListener('change', async (e) => {
            if (e.target.files.length > 0) {
                const file = e.target.files[0];
                showLoading('Extracting ZIP...');

                try {
                    const zip = new JSZip();
                    const zipContent = await zip.loadAsync(file);

                    extractedList.innerHTML = '';
                    extractPreview.style.display = 'block';

                    zipContent.forEach(async (relativePath, zipEntry) => {
                        if (!zipEntry.dir) {
                            const blob = await zipEntry.async('blob');
                            const item = document.createElement('div');
                            item.style.display = 'flex';
                            item.style.alignItems = 'center';
                            item.style.justifyContent = 'space-between';
                            item.style.padding = '0.75rem';
                            item.style.background = 'var(--bg-secondary)';
                            item.style.borderRadius = '4px';
                            item.style.border = '1px solid var(--border-color)';

                            item.innerHTML = `
                                <span style="font-size: 0.9rem;">${relativePath}</span>
                                <button class="btn-secondary" style="padding: 0.25rem 0.75rem; font-size: 0.8rem;">Download</button>
                            `;

                            item.querySelector('button').onclick = () => {
                                downloadFile(blob, relativePath.split('/').pop());
                            };

                            extractedList.appendChild(item);
                        }
                    });

                    showNotification('ZIP extracted successfully!');
                } catch (error) {
                    console.error('Extract Error:', error);
                    showNotification('Error extracting ZIP', 'error');
                } finally {
                    hideLoading();
                }
            }
        });
    }
})();
