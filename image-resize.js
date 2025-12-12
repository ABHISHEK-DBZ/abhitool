// Image Resize Tool
(() => {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initImageResize);
    } else {
        initImageResize();
    }

    function initImageResize() {
        const container = document.getElementById('image-resize');
        if (!container) return;

        if (!container.querySelector('.tool-card')) {
            container.innerHTML = `
                <div class="tool-card">
                    <h3 class="tool-title">Image Resize</h3>
                    <p class="tool-description">Resize images by percentage or exact dimensions</p>
                    
                    <div class="upload-zone" id="resize-upload-zone">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                            <circle cx="8.5" cy="8.5" r="1.5"/>
                            <polyline points="21 15 16 10 5 21"/>
                        </svg>
                        <p>Upload image to resize</p>
                        <input type="file" id="resize-file-input" accept="image/*" hidden>
                    </div>

                    <div id="resize-options" style="display: none; margin-top: 2rem;">
                        <div class="options-grid">
                            <div class="option-group">
                                <label>Resize Mode</label>
                                <select id="resize-mode" class="select-input">
                                    <option value="dimensions">Exact Dimensions</option>
                                    <option value="percentage">Percentage</option>
                                </select>
                            </div>
                            
                            <div class="option-group" id="width-group">
                                <label>Width (px)</label>
                                <input type="number" id="resize-width" class="text-input">
                            </div>
                            
                            <div class="option-group" id="height-group">
                                <label>Height (px)</label>
                                <input type="number" id="resize-height" class="text-input">
                            </div>
                            
                            <div class="option-group" id="percentage-group" style="display: none;">
                                <label>Percentage (%)</label>
                                <input type="number" id="resize-percentage" class="text-input" value="50" min="1" max="500">
                            </div>

                            <div class="option-group">
                                <label>Format</label>
                                <select id="resize-format" class="select-input">
                                    <option value="jpeg">JPEG</option>
                                    <option value="png">PNG</option>
                                    <option value="webp">WebP</option>
                                </select>
                            </div>
                            
                            <div class="option-group">
                                <label>Quality (%)</label>
                                <input type="number" id="resize-quality" class="text-input" value="90" min="1" max="100">
                            </div>
                        </div>
                        
                        <div style="margin-top: 1rem;">
                            <label class="checkbox-label">
                                <input type="checkbox" id="maintain-aspect" checked> Maintain Aspect Ratio
                            </label>
                        </div>

                        <div id="resize-preview-container" class="preview-container" style="margin-top: 2rem;"></div>
                        
                        <button id="resize-image-btn" class="btn-primary" style="margin-top: 1.5rem;">Resize & Download</button>
                    </div>
                </div>
            `;
        }

        const fileInput = document.getElementById('resize-file-input');
        const uploadZone = document.getElementById('resize-upload-zone');
        const previewContainer = document.getElementById('resize-preview-container');
        const resizeBtn = document.getElementById('resize-image-btn');
        const resizeMode = document.getElementById('resize-mode');
        const percentageInput = document.getElementById('resize-percentage');
        const widthInput = document.getElementById('resize-width');
        const heightInput = document.getElementById('resize-height');
        const formatSelect = document.getElementById('resize-format');
        const qualityInput = document.getElementById('resize-quality');
        const maintainAspect = document.getElementById('maintain-aspect');
        const resizeOptions = document.getElementById('resize-options');

        const percentageGroup = document.getElementById('percentage-group');
        const widthGroup = document.getElementById('width-group');
        const heightGroup = document.getElementById('height-group');

        let selectedFile = null;
        let originalImage = null;

        uploadZone.addEventListener('click', () => fileInput.click());

        resizeMode.addEventListener('change', () => {
            if (resizeMode.value === 'percentage') {
                percentageGroup.style.display = 'block';
                widthGroup.style.display = 'none';
                heightGroup.style.display = 'none';
            } else {
                percentageGroup.style.display = 'none';
                widthGroup.style.display = 'block';
                heightGroup.style.display = 'block';
            }
        });

        fileInput.addEventListener('change', async (e) => {
            if (e.target.files.length > 0) {
                selectedFile = e.target.files[0];
                originalImage = await loadImage(URL.createObjectURL(selectedFile));

                // Set default dimensions
                widthInput.value = originalImage.width;
                heightInput.value = originalImage.height;

                resizeOptions.style.display = 'block';
                updatePreview();
            }
        });

        // Maintain aspect ratio
        widthInput.addEventListener('input', () => {
            if (maintainAspect.checked && originalImage) {
                const ratio = originalImage.height / originalImage.width;
                heightInput.value = Math.round(widthInput.value * ratio);
            }
        });

        heightInput.addEventListener('input', () => {
            if (maintainAspect.checked && originalImage) {
                const ratio = originalImage.width / originalImage.height;
                widthInput.value = Math.round(heightInput.value * ratio);
            }
        });

        function updatePreview() {
            previewContainer.innerHTML = '';
            const img = document.createElement('img');
            img.src = URL.createObjectURL(selectedFile);
            img.style.maxWidth = '100%';
            img.style.maxHeight = '300px';
            img.style.borderRadius = '8px';

            const info = document.createElement('div');
            info.style.marginTop = '0.5rem';
            info.style.color = 'var(--text-secondary)';
            info.textContent = `Original: ${originalImage.width} × ${originalImage.height}px`;

            previewContainer.appendChild(img);
            previewContainer.appendChild(info);
        }

        resizeBtn.addEventListener('click', async () => {
            if (!selectedFile || !originalImage) return;

            showLoading('Resizing image...');

            try {
                let newWidth, newHeight;

                if (resizeMode.value === 'percentage') {
                    const scale = percentageInput.value / 100;
                    newWidth = Math.round(originalImage.width * scale);
                    newHeight = Math.round(originalImage.height * scale);
                } else {
                    newWidth = parseInt(widthInput.value);
                    newHeight = parseInt(heightInput.value);
                }

                const canvas = document.createElement('canvas');
                canvas.width = newWidth;
                canvas.height = newHeight;
                const ctx = canvas.getContext('2d');

                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(originalImage, 0, 0, newWidth, newHeight);

                const quality = qualityInput.value / 100;
                const format = formatSelect.value;
                const mimeType = `image/${format}`;

                canvas.toBlob((blob) => {
                    const originalSize = (selectedFile.size / 1024).toFixed(2);
                    const newSize = (blob.size / 1024).toFixed(2);

                    downloadFile(blob, `resized.${format}`);
                    showNotification(`Image resized! ${originalSize}KB → ${newSize}KB`);
                    hideLoading();
                }, mimeType, quality);

            } catch (error) {
                console.error('Error resizing image:', error);
                showNotification('Error resizing image', 'error');
                hideLoading();
            }
        });

        function loadImage(src) {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = reject;
                img.src = src;
            });
        }
    }
})();
