// Image Crop Tool with Interactive Preview
(() => {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initImageCrop);
    } else {
        initImageCrop();
    }

    function initImageCrop() {
        const container = document.getElementById('image-crop');
        if (!container) return;

        // Create or get tool card


        let toolCard = container.querySelector('.tool-card');


        if (!toolCard) {


            toolCard = document.createElement('div');


            toolCard.className = 'tool-card';


            container.appendChild(toolCard);


        }

        toolCard.innerHTML = `
            <h3 class="tool-title">Image Crop Tool</h3>
            <p class="tool-description">Crop images with interactive selection</p>
            
            <div class="upload-zone" id="crop-upload-zone">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <p>Click to upload or drag and drop</p>
                <span>PNG, JPG, JPEG, WebP</span>
                <input type="file" id="crop-file-input" accept="image/*" hidden>
            </div>
            
            <div id="crop-editor" style="display: none;">
                <div style="position: relative; display: inline-block; margin: 1rem 0;">
                    <canvas id="crop-canvas" style="max-width: 100%; border: 2px solid var(--border-color); border-radius: 8px; cursor: crosshair;"></canvas>
                    <div id="crop-selection" style="position: absolute; border: 2px dashed var(--primary); background: rgba(139, 92, 246, 0.1); display: none; pointer-events: none;"></div>
                </div>
                
                <div class="options-grid">
                    <div class="option-group">
                        <label>Aspect Ratio</label>
                        <select id="crop-aspect" class="select-input">
                            <option value="free">Free</option>
                            <option value="1:1">Square (1:1)</option>
                            <option value="4:3">4:3</option>
                            <option value="16:9">16:9</option>
                            <option value="3:2">3:2</option>
                        </select>
                    </div>
                    <div class="option-group">
                        <label>Output Format</label>
                        <select id="crop-format" class="select-input">
                            <option value="png">PNG</option>
                            <option value="jpeg">JPEG</option>
                            <option value="webp">WebP</option>
                        </select>
                    </div>
                </div>
                
                <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
                    <button id="crop-apply-btn" class="btn-primary" disabled>Crop & Download</button>
                    <button id="crop-reset-btn" class="btn-secondary">Reset Selection</button>
                </div>
            </div>
        `;

        const fileInput = document.getElementById('crop-file-input');
        const uploadZone = document.getElementById('crop-upload-zone');
        const cropEditor = document.getElementById('crop-editor');
        const canvas = document.getElementById('crop-canvas');
        const ctx = canvas.getContext('2d');
        const selection = document.getElementById('crop-selection');
        const aspectSelect = document.getElementById('crop-aspect');
        const formatSelect = document.getElementById('crop-format');
        const applyBtn = document.getElementById('crop-apply-btn');
        const resetBtn = document.getElementById('crop-reset-btn');

        let originalImage = null;
        let cropArea = { x: 0, y: 0, width: 0, height: 0 };
        let isSelecting = false;
        let startX, startY;

        uploadZone.addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', async (e) => {
            if (e.target.files.length === 0) return;

            const file = e.target.files[0];
            originalImage = await loadImage(URL.createObjectURL(file));

            // Setup canvas
            const maxWidth = 800;
            const scale = Math.min(1, maxWidth / originalImage.width);
            canvas.width = originalImage.width * scale;
            canvas.height = originalImage.height * scale;

            ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);

            uploadZone.style.display = 'none';
            cropEditor.style.display = 'block';

            // Reset selection
            cropArea = { x: 0, y: 0, width: 0, height: 0 };
            selection.style.display = 'none';
            applyBtn.disabled = true;
        });

        // Mouse events for selection
        canvas.addEventListener('mousedown', (e) => {
            const rect = canvas.getBoundingClientRect();
            startX = e.clientX - rect.left;
            startY = e.clientY - rect.top;
            isSelecting = true;
            cropArea = { x: startX, y: startY, width: 0, height: 0 };
            selection.style.display = 'block';
        });

        canvas.addEventListener('mousemove', (e) => {
            if (!isSelecting) return;

            const rect = canvas.getBoundingClientRect();
            const currentX = e.clientX - rect.left;
            const currentY = e.clientY - rect.top;

            let width = currentX - startX;
            let height = currentY - startY;

            // Apply aspect ratio if selected
            const aspect = aspectSelect.value;
            if (aspect !== 'free') {
                const [w, h] = aspect.split(':').map(Number);
                const ratio = w / h;

                if (Math.abs(width) / Math.abs(height) > ratio) {
                    height = width / ratio;
                } else {
                    width = height * ratio;
                }
            }

            cropArea.width = Math.abs(width);
            cropArea.height = Math.abs(height);
            cropArea.x = width < 0 ? currentX : startX;
            cropArea.y = height < 0 ? currentY : startY;

            updateSelection();
        });

        canvas.addEventListener('mouseup', () => {
            isSelecting = false;
            if (cropArea.width > 10 && cropArea.height > 10) {
                applyBtn.disabled = false;
            }
        });

        function updateSelection() {
            selection.style.left = `${cropArea.x}px`;
            selection.style.top = `${cropArea.y}px`;
            selection.style.width = `${cropArea.width}px`;
            selection.style.height = `${cropArea.height}px`;
        }

        resetBtn.addEventListener('click', () => {
            cropArea = { x: 0, y: 0, width: 0, height: 0 };
            selection.style.display = 'none';
            applyBtn.disabled = true;
        });

        applyBtn.addEventListener('click', () => {
            if (!originalImage || cropArea.width === 0) return;

            // Calculate crop area on original image
            const scaleX = originalImage.width / canvas.width;
            const scaleY = originalImage.height / canvas.height;

            const cropX = cropArea.x * scaleX;
            const cropY = cropArea.y * scaleY;
            const cropWidth = cropArea.width * scaleX;
            const cropHeight = cropArea.height * scaleY;

            // Create new canvas for cropped image
            const croppedCanvas = document.createElement('canvas');
            croppedCanvas.width = cropWidth;
            croppedCanvas.height = cropHeight;
            const croppedCtx = croppedCanvas.getContext('2d');

            croppedCtx.drawImage(
                originalImage,
                cropX, cropY, cropWidth, cropHeight,
                0, 0, cropWidth, cropHeight
            );

            // Convert to blob and download
            const format = formatSelect.value;
            const mimeType = `image/${format}`;

            croppedCanvas.toBlob((blob) => {
                downloadFile(blob, `cropped.${format}`);
                showNotification('Image cropped and downloaded!');
            }, mimeType, 0.95);
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
