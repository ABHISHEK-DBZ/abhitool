// File Format Converter
(() => {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initFileConverter);
    } else {
        initFileConverter();
    }

    function initFileConverter() {
        const container = document.getElementById('file-converter');
        if (!container) return;

        if (!container.querySelector('.tool-card')) {
            container.innerHTML = `
                <div class="tool-card">
                    <h3 class="tool-title">File Converter</h3>
                    <p class="tool-description">Convert between different image formats (JPG, PNG, WebP, GIF)</p>
                    
                    <div class="upload-zone" id="converter-upload-zone">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                            <path d="M12 18v-6"/>
                            <path d="m9 15 3 3 3-3"/>
                        </svg>
                        <p>Upload file to convert</p>
                        <input type="file" id="converter-file-input" accept="image/*" hidden>
                    </div>

                    <div id="converter-options" style="display: none; margin-top: 2rem;">
                        <div class="preview-container" style="text-align: center; margin-bottom: 1.5rem;">
                            <img id="converter-preview" style="max-width: 100%; max-height: 200px; border-radius: 8px;">
                            <p id="file-info" style="color: var(--text-secondary); margin-top: 0.5rem;"></p>
                        </div>

                        <div class="options-grid">
                            <div class="option-group">
                                <label>Convert to</label>
                                <select id="target-format" class="select-input">
                                    <option value="png">PNG</option>
                                    <option value="jpeg">JPEG</option>
                                    <option value="webp">WebP</option>
                                    <option value="gif">GIF</option>
                                </select>
                            </div>
                            <div class="option-group">
                                <label>Quality (%)</label>
                                <input type="number" id="convert-quality" class="text-input" value="90" min="1" max="100">
                            </div>
                        </div>
                        
                        <button id="convert-file-btn" class="btn-primary" style="margin-top: 1.5rem;">Convert & Download</button>
                    </div>
                </div>
            `;
        }

        const fileInput = document.getElementById('converter-file-input');
        const uploadZone = document.getElementById('converter-upload-zone');
        const options = document.getElementById('converter-options');
        const preview = document.getElementById('converter-preview');
        const fileInfo = document.getElementById('file-info');
        const convertBtn = document.getElementById('convert-file-btn');
        const formatSelect = document.getElementById('target-format');
        const qualityInput = document.getElementById('convert-quality');

        let selectedFile = null;

        uploadZone.addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                selectedFile = e.target.files[0];
                preview.src = URL.createObjectURL(selectedFile);
                fileInfo.textContent = `${selectedFile.name} (${(selectedFile.size / 1024).toFixed(2)} KB)`;
                options.style.display = 'block';
            }
        });

        convertBtn.addEventListener('click', () => {
            if (!selectedFile) return;
            showLoading('Converting...');

            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);

                const format = formatSelect.value;
                const quality = qualityInput.value / 100;
                const mimeType = `image/${format}`;

                canvas.toBlob((blob) => {
                    downloadFile(blob, `converted.${format}`);
                    showNotification('File converted successfully!');
                    hideLoading();
                }, mimeType, quality);
            };
            img.src = URL.createObjectURL(selectedFile);
        });
    }
})();
