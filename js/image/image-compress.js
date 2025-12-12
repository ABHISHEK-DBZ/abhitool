// Image Compression Tool
(() => {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initImageCompression);
    } else {
        initImageCompression();
    }

    function initImageCompression() {
        const container = document.getElementById('image-compression');
        if (!container) return;

        // Create or get tool card


        let toolCard = container.querySelector('.tool-card');


        if (!toolCard) {


            toolCard = document.createElement('div');


            toolCard.className = 'tool-card';


            container.appendChild(toolCard);


        }

        toolCard.innerHTML = `
            <h3 class="tool-title">Image Compression</h3>
            <p class="tool-description">Reduce image file size while maintaining quality</p>
            
            <div class="upload-zone" id="compress-upload-zone">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <p>Click to upload or drag and drop</p>
                <span>PNG, JPG, JPEG, WebP (supports batch)</span>
                <input type="file" id="compress-file-input" accept="image/*" multiple hidden>
            </div>
            
            <div id="compress-preview-container" class="preview-container"></div>
            
            <div class="options-grid" id="compress-options" style="display: none;">
                <div class="option-group">
                    <label for="compress-quality">Quality (%)</label>
                    <input type="range" id="compress-quality" class="slider" min="10" max="100" value="80">
                    <span id="compress-quality-value">80%</span>
                </div>
                <div class="option-group">
                    <label for="compress-format">Output Format</label>
                    <select id="compress-format" class="select-input">
                        <option value="jpeg">JPEG (Best compression)</option>
                        <option value="webp">WebP (Modern, efficient)</option>
                        <option value="png">PNG (Lossless)</option>
                    </select>
                </div>
                <div class="option-group">
                    <label for="compress-max-width">Max Width (px)</label>
                    <input type="number" id="compress-max-width" class="text-input" placeholder="Original" min="100">
                </div>
                <div class="option-group">
                    <label for="compress-max-height">Max Height (px)</label>
                    <input type="number" id="compress-max-height" class="text-input" placeholder="Original" min="100">
                </div>
            </div>
            
            <div id="compress-stats" style="display: none; background: var(--bg-secondary); padding: 1rem; border-radius: 8px; margin: 1rem 0;">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem;">
                    <div style="text-align: center;">
                        <div style="font-size: 1.25rem; font-weight: 700; color: var(--primary);" id="original-size">0 KB</div>
                        <div style="font-size: 0.875rem; color: var(--text-tertiary);">Original Size</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 1.25rem; font-weight: 700; color: var(--secondary);" id="compressed-size">0 KB</div>
                        <div style="font-size: 0.875rem; color: var(--text-tertiary);">Compressed Size</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 1.25rem; font-weight: 700; color: var(--accent);" id="savings">0%</div>
                        <div style="font-size: 0.875rem; color: var(--text-tertiary);">Savings</div>
                    </div>
                </div>
            </div>
            
            <button id="compress-images-btn" class="btn-primary" disabled>Compress Images</button>
        `;

        const fileInput = document.getElementById('compress-file-input');
        const uploadZone = document.getElementById('compress-upload-zone');
        const previewContainer = document.getElementById('compress-preview-container');
        const compressBtn = document.getElementById('compress-images-btn');
        const options = document.getElementById('compress-options');
        const stats = document.getElementById('compress-stats');
        const qualitySlider = document.getElementById('compress-quality');
        const qualityValue = document.getElementById('compress-quality-value');
        const formatSelect = document.getElementById('compress-format');
        const maxWidthInput = document.getElementById('compress-max-width');
        const maxHeightInput = document.getElementById('compress-max-height');

        let selectedFiles = [];

        uploadZone.addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            selectedFiles = files;
            updatePreview();
            options.style.display = 'grid';
            compressBtn.disabled = false;
        });

        qualitySlider.addEventListener('input', () => {
            qualityValue.textContent = `${qualitySlider.value}%`;
        });

        function updatePreview() {
            previewContainer.innerHTML = '';
            selectedFiles.forEach((file, index) => {
                const item = createPreviewItem(file, () => {
                    selectedFiles.splice(index, 1);
                    updatePreview();
                    if (selectedFiles.length === 0) {
                        options.style.display = 'none';
                        compressBtn.disabled = true;
                    }
                });
                previewContainer.appendChild(item);
            });
        }

        compressBtn.addEventListener('click', async () => {
            if (selectedFiles.length === 0) return;

            const quality = parseInt(qualitySlider.value) / 100;
            const format = formatSelect.value;
            const maxWidth = parseInt(maxWidthInput.value) || null;
            const maxHeight = parseInt(maxHeightInput.value) || null;

            let totalOriginalSize = 0;
            let totalCompressedSize = 0;

            if (selectedFiles.length === 1) {
                // Single file
                showLoading('Compressing image...');

                try {
                    const file = selectedFiles[0];
                    totalOriginalSize = file.size;

                    const compressed = await compressImage(file, quality, format, maxWidth, maxHeight);
                    totalCompressedSize = compressed.size;

                    downloadFile(compressed, `compressed.${format}`);
                    showStats(totalOriginalSize, totalCompressedSize);
                    showNotification('Image compressed successfully!');

                } catch (error) {
                    console.error('Compression error:', error);
                    showNotification('Error compressing image', 'error');
                } finally {
                    hideLoading();
                }
            } else {
                // Batch processing
                for (const file of selectedFiles) {
                    totalOriginalSize += file.size;

                    window.batchProcessor.addJob(file, async (f, opts, progress) => {
                        progress(50);
                        const compressed = await compressImage(f, quality, format, maxWidth, maxHeight);
                        progress(100);
                        totalCompressedSize += compressed.size;
                        return compressed;
                    }, { extension: `.${format}` });
                }

                showStats(totalOriginalSize, totalCompressedSize);
            }
        });

        async function compressImage(file, quality, format, maxWidth, maxHeight) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = new Image();
                    img.onload = () => {
                        let width = img.width;
                        let height = img.height;

                        // Resize if max dimensions specified
                        if (maxWidth && width > maxWidth) {
                            height = (height * maxWidth) / width;
                            width = maxWidth;
                        }
                        if (maxHeight && height > maxHeight) {
                            width = (width * maxHeight) / height;
                            height = maxHeight;
                        }

                        const canvas = document.createElement('canvas');
                        canvas.width = width;
                        canvas.height = height;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, width, height);

                        canvas.toBlob((blob) => {
                            resolve(blob);
                        }, `image/${format}`, quality);
                    };
                    img.onerror = reject;
                    img.src = e.target.result;
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        }

        function showStats(originalSize, compressedSize) {
            const savings = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);

            document.getElementById('original-size').textContent = formatFileSize(originalSize);
            document.getElementById('compressed-size').textContent = formatFileSize(compressedSize);
            document.getElementById('savings').textContent = `${savings}%`;

            stats.style.display = 'block';
        }

        function formatFileSize(bytes) {
            if (bytes < 1024) return bytes + ' B';
            if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
            return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
        }
    }
})();
