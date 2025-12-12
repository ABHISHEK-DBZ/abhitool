// Background Removal Tool - Simple Implementation
(() => {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initBackgroundRemoval);
    } else {
        initBackgroundRemoval();
    }

    function initBackgroundRemoval() {
        const container = document.getElementById('background-removal');
        if (!container) return;

        let toolCard = container.querySelector('.tool-card');
        if (!toolCard) {
            toolCard = document.createElement('div');
            toolCard.className = 'tool-card';
            container.appendChild(toolCard);
        }

        toolCard.innerHTML = `
            <h3 class="tool-title">Background Removal</h3>
            <p class="tool-description">Remove solid color backgrounds from images</p>
            
            <div class="upload-zone" id="bg-remove-upload-zone">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <path d="M21 15l-5-5L5 21"/>
                </svg>
                <p>Upload image</p>
                <span>PNG, JPG, JPEG, WebP</span>
                <input type="file" id="bg-remove-file-input" accept="image/*" hidden>
            </div>
            
            <div id="bg-remove-options" style="display: none;">
                <div class="options-grid">
                    <div class="option-group">
                        <label for="bg-color-picker">Background Color to Remove</label>
                        <input type="color" id="bg-color-picker" class="text-input" value="#ffffff">
                    </div>
                    <div class="option-group">
                        <label for="bg-tolerance">Tolerance (0-255)</label>
                        <input type="range" id="bg-tolerance" class="slider" min="0" max="255" value="30">
                        <span id="tolerance-value">30</span>
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin: 1.5rem 0;">
                    <div>
                        <h4 style="margin-bottom: 0.5rem;">Original</h4>
                        <canvas id="original-canvas" style="max-width: 100%; border: 2px solid var(--border-color); border-radius: 8px; background: white;"></canvas>
                    </div>
                    <div>
                        <h4 style="margin-bottom: 0.5rem;">Result</h4>
                        <canvas id="result-canvas" style="max-width: 100%; border: 2px solid var(--border-color); border-radius: 8px; background: repeating-conic-gradient(#808080 0% 25%, transparent 0% 50%) 50% / 20px 20px;"></canvas>
                    </div>
                </div>
                
                <div style="display: flex; gap: 0.5rem;">
                    <button id="process-bg-btn" class="btn-primary">Remove Background</button>
                    <button id="download-bg-btn" class="btn-primary" style="display: none;">Download PNG</button>
                </div>
            </div>
            
            <div style="background: var(--bg-tertiary); padding: 1rem; border-radius: 8px; margin-top: 1rem;">
                <p style="font-size: 0.875rem; color: var(--text-secondary);">
                    💡 <strong>Tip:</strong> Works best with solid color backgrounds (white, green screen, etc.). 
                    Adjust tolerance for better results. For AI-powered removal, consider using remove.bg API.
                </p>
            </div>
        `;

        const fileInput = document.getElementById('bg-remove-file-input');
        const uploadZone = document.getElementById('bg-remove-upload-zone');
        const options = document.getElementById('bg-remove-options');
        const colorPicker = document.getElementById('bg-color-picker');
        const tolerance = document.getElementById('bg-tolerance');
        const toleranceValue = document.getElementById('tolerance-value');
        const processBtn = document.getElementById('process-bg-btn');
        const downloadBtn = document.getElementById('download-bg-btn');
        const originalCanvas = document.getElementById('original-canvas');
        const resultCanvas = document.getElementById('result-canvas');
        const originalCtx = originalCanvas.getContext('2d');
        const resultCtx = resultCanvas.getContext('2d');

        let currentImage = null;

        uploadZone.addEventListener('click', () => fileInput.click());

        tolerance.addEventListener('input', () => {
            toleranceValue.textContent = tolerance.value;
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length === 0) return;

            const file = e.target.files[0];
            const reader = new FileReader();

            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    currentImage = img;

                    // Set canvas sizes
                    originalCanvas.width = img.width;
                    originalCanvas.height = img.height;
                    resultCanvas.width = img.width;
                    resultCanvas.height = img.height;

                    // Draw original
                    originalCtx.drawImage(img, 0, 0);

                    uploadZone.style.display = 'none';
                    options.style.display = 'block';

                    // Auto-detect background color (top-left pixel)
                    const imageData = originalCtx.getImageData(0, 0, 1, 1);
                    const rgb = imageData.data;
                    const hexColor = '#' + [rgb[0], rgb[1], rgb[2]].map(x => {
                        const hex = x.toString(16);
                        return hex.length === 1 ? '0' + hex : hex;
                    }).join('');
                    colorPicker.value = hexColor;
                };
                img.src = event.target.result;
            };

            reader.readAsDataURL(file);
        });

        processBtn.addEventListener('click', () => {
            if (!currentImage) return;

            showLoading('Removing background...');

            setTimeout(() => {
                try {
                    // Get target color
                    const targetColor = hexToRgb(colorPicker.value);
                    const tol = parseInt(tolerance.value);

                    // Get image data
                    const imageData = originalCtx.getImageData(0, 0, originalCanvas.width, originalCanvas.height);
                    const data = imageData.data;

                    // Process pixels
                    for (let i = 0; i < data.length; i += 4) {
                        const r = data[i];
                        const g = data[i + 1];
                        const b = data[i + 2];

                        // Check if pixel matches target color within tolerance
                        if (
                            Math.abs(r - targetColor.r) <= tol &&
                            Math.abs(g - targetColor.g) <= tol &&
                            Math.abs(b - targetColor.b) <= tol
                        ) {
                            // Make pixel transparent
                            data[i + 3] = 0;
                        }
                    }

                    // Draw result
                    resultCtx.putImageData(imageData, 0, 0);

                    downloadBtn.style.display = 'block';
                    showNotification('Background removed!');
                } catch (error) {
                    console.error('Background removal error:', error);
                    showNotification('Error removing background', 'error');
                } finally {
                    hideLoading();
                }
            }, 100);
        });

        downloadBtn.addEventListener('click', () => {
            resultCanvas.toBlob((blob) => {
                downloadFile(blob, 'no-background.png');
                showNotification('Image downloaded!');
            }, 'image/png');
        });

        function hexToRgb(hex) {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : { r: 255, g: 255, b: 255 };
        }
    }
})();
