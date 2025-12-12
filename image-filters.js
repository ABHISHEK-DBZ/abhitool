// Image Filters Tool
(() => {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initImageFilters);
    } else {
        initImageFilters();
    }

    function initImageFilters() {
        const container = document.getElementById('image-filters');
        if (!container) return;

        if (!container.querySelector('.tool-card')) {
            container.innerHTML = `
                <div class="tool-card">
                    <h3 class="tool-title">Image Filters</h3>
                    <p class="tool-description">Apply filters and adjust image properties</p>
                    
                    <div class="upload-zone" id="filter-upload-zone">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <circle cx="12" cy="12" r="10"/>
                            <circle cx="12" cy="12" r="4"/>
                            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                        </svg>
                        <p>Upload image to edit</p>
                        <input type="file" id="filter-file-input" accept="image/*" hidden>
                    </div>

                    <div id="filter-editor" style="display: none; margin-top: 2rem;">
                        <div class="preview-container" style="margin-bottom: 2rem; text-align: center;">
                            <canvas id="filter-canvas" style="max-width: 100%; border-radius: 8px; box-shadow: var(--shadow-md);"></canvas>
                        </div>

                        <div class="options-grid">
                            <div class="option-group">
                                <label>Brightness</label>
                                <input type="range" id="brightness" min="0" max="200" value="100">
                            </div>
                            <div class="option-group">
                                <label>Contrast</label>
                                <input type="range" id="contrast" min="0" max="200" value="100">
                            </div>
                            <div class="option-group">
                                <label>Saturation</label>
                                <input type="range" id="saturation" min="0" max="200" value="100">
                            </div>
                            <div class="option-group">
                                <label>Blur</label>
                                <input type="range" id="blur" min="0" max="10" value="0" step="0.1">
                            </div>
                        </div>

                        <div class="filter-presets" style="margin: 2rem 0; display: flex; gap: 1rem; flex-wrap: wrap;">
                            <button class="btn-secondary" onclick="applyPreset('grayscale')">Grayscale</button>
                            <button class="btn-secondary" onclick="applyPreset('sepia')">Sepia</button>
                            <button class="btn-secondary" onclick="applyPreset('invert')">Invert</button>
                            <button class="btn-secondary" onclick="applyPreset('vintage')">Vintage</button>
                            <button class="btn-secondary" onclick="resetFilters()">Reset</button>
                        </div>
                        
                        <button id="download-filter-btn" class="btn-primary">Download Image</button>
                    </div>
                </div>
            `;
        }

        const fileInput = document.getElementById('filter-file-input');
        const uploadZone = document.getElementById('filter-upload-zone');
        const editor = document.getElementById('filter-editor');
        const canvas = document.getElementById('filter-canvas');
        const ctx = canvas.getContext('2d');
        const downloadBtn = document.getElementById('download-filter-btn');

        let originalImage = null;
        let filters = {
            brightness: 100,
            contrast: 100,
            saturation: 100,
            blur: 0,
            grayscale: 0,
            sepia: 0,
            invert: 0
        };

        uploadZone.addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', async (e) => {
            if (e.target.files.length > 0) {
                const file = e.target.files[0];
                originalImage = await loadImage(URL.createObjectURL(file));

                canvas.width = originalImage.width;
                canvas.height = originalImage.height;

                editor.style.display = 'block';
                applyFilters();
            }
        });

        // Sliders
        ['brightness', 'contrast', 'saturation', 'blur'].forEach(id => {
            document.getElementById(id).addEventListener('input', (e) => {
                filters[id] = parseFloat(e.target.value);
                applyFilters();
            });
        });

        // Global functions for presets
        window.applyPreset = (preset) => {
            resetFilters(false); // Reset values but don't redraw yet
            switch (preset) {
                case 'grayscale': filters.grayscale = 100; break;
                case 'sepia': filters.sepia = 100; break;
                case 'invert': filters.invert = 100; break;
                case 'vintage':
                    filters.sepia = 50;
                    filters.contrast = 120;
                    filters.brightness = 90;
                    break;
            }
            updateSliders();
            applyFilters();
        };

        window.resetFilters = (redraw = true) => {
            filters = {
                brightness: 100,
                contrast: 100,
                saturation: 100,
                blur: 0,
                grayscale: 0,
                sepia: 0,
                invert: 0
            };
            if (redraw) {
                updateSliders();
                applyFilters();
            }
        };

        function updateSliders() {
            document.getElementById('brightness').value = filters.brightness;
            document.getElementById('contrast').value = filters.contrast;
            document.getElementById('saturation').value = filters.saturation;
            document.getElementById('blur').value = filters.blur;
        }

        function applyFilters() {
            if (!originalImage) return;

            const filterString = `
                brightness(${filters.brightness}%)
                contrast(${filters.contrast}%)
                saturate(${filters.saturation}%)
                blur(${filters.blur}px)
                grayscale(${filters.grayscale}%)
                sepia(${filters.sepia}%)
                invert(${filters.invert}%)
            `;

            ctx.filter = filterString;
            ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);
        }

        downloadBtn.addEventListener('click', () => {
            const link = document.createElement('a');
            link.download = 'filtered-image.png';
            link.href = canvas.toDataURL();
            link.click();
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
