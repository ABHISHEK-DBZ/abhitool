// Image to PDF Converter
(() => {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initImageToPdf);
    } else {
        initImageToPdf();
    }

    function initImageToPdf() {
        const container = document.getElementById('image-to-pdf');
        if (!container) return;

        if (!container.querySelector('.tool-card')) {
            container.innerHTML = `
                <div class="tool-card">
                    <h3 class="tool-title">Image to PDF</h3>
                    <p class="tool-description">Convert multiple images into a single PDF document</p>
                    
                    <div class="upload-zone" id="img2pdf-upload-zone">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                            <circle cx="8.5" cy="8.5" r="1.5"/>
                            <polyline points="21 15 16 10 5 21"/>
                        </svg>
                        <p>Upload images to convert</p>
                        <span>JPG, PNG, WebP supported</span>
                        <input type="file" id="img2pdf-file-input" accept="image/*" multiple hidden>
                    </div>

                    <div id="img2pdf-preview" class="preview-grid" style="margin-top: 2rem;"></div>
                    
                    <div class="options-grid" style="margin-top: 1.5rem;">
                        <div class="option-group">
                            <label>Page Size</label>
                            <select id="pdf-page-size" class="select-input">
                                <option value="a4">A4</option>
                                <option value="letter">Letter</option>
                                <option value="fit">Fit to Image</option>
                            </select>
                        </div>
                        <div class="option-group">
                            <label>Orientation</label>
                            <select id="pdf-orientation" class="select-input">
                                <option value="portrait">Portrait</option>
                                <option value="landscape">Landscape</option>
                            </select>
                        </div>
                    </div>

                    <button id="convert-img2pdf-btn" class="btn-primary" disabled style="margin-top: 1.5rem;">Convert to PDF</button>
                </div>
            `;
        }

        const fileInput = document.getElementById('img2pdf-file-input');
        const uploadZone = document.getElementById('img2pdf-upload-zone');
        const previewContainer = document.getElementById('img2pdf-preview');
        const convertBtn = document.getElementById('convert-img2pdf-btn');
        const pageSizeSelect = document.getElementById('pdf-page-size');
        const orientationSelect = document.getElementById('pdf-orientation');

        let selectedFiles = [];

        uploadZone.addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            selectedFiles = [...selectedFiles, ...files];
            updatePreview();
            convertBtn.disabled = selectedFiles.length === 0;
        });

        function updatePreview() {
            previewContainer.innerHTML = '';
            selectedFiles.forEach((file, index) => {
                const item = document.createElement('div');
                item.className = 'preview-item';
                item.innerHTML = `
                    <img src="${URL.createObjectURL(file)}" style="width: 100%; height: 100px; object-fit: cover; border-radius: 4px;">
                    <button class="remove-btn" onclick="removeImg2PdfFile(${index})">×</button>
                `;
                previewContainer.appendChild(item);
            });
        }

        window.removeImg2PdfFile = (index) => {
            selectedFiles.splice(index, 1);
            updatePreview();
            convertBtn.disabled = selectedFiles.length === 0;
        };

        convertBtn.addEventListener('click', async () => {
            if (selectedFiles.length === 0) return;

            showLoading('Generating PDF...');

            try {
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF({
                    orientation: orientationSelect.value,
                    unit: 'mm',
                    format: pageSizeSelect.value === 'fit' ? 'a4' : pageSizeSelect.value
                });

                const pageWidth = doc.internal.pageSize.getWidth();
                const pageHeight = doc.internal.pageSize.getHeight();

                for (let i = 0; i < selectedFiles.length; i++) {
                    if (i > 0) doc.addPage();

                    const imgData = await readFileAsDataURL(selectedFiles[i]);
                    const imgProps = doc.getImageProperties(imgData);

                    if (pageSizeSelect.value === 'fit') {
                        // Adjust page size to image
                        doc.deletePage(i + 1);
                        doc.addPage([imgProps.width * 0.264583, imgProps.height * 0.264583]); // px to mm
                        doc.addImage(imgData, 'JPEG', 0, 0, imgProps.width * 0.264583, imgProps.height * 0.264583);
                    } else {
                        // Fit image to page
                        const ratio = Math.min(pageWidth / imgProps.width, pageHeight / imgProps.height);
                        const w = imgProps.width * ratio;
                        const h = imgProps.height * ratio;
                        const x = (pageWidth - w) / 2;
                        const y = (pageHeight - h) / 2;

                        doc.addImage(imgData, 'JPEG', x, y, w, h);
                    }
                }

                doc.save('images.pdf');
                showNotification('PDF generated successfully!');

                // Reset
                selectedFiles = [];
                updatePreview();
                convertBtn.disabled = true;

            } catch (error) {
                console.error('Error generating PDF:', error);
                showNotification('Error generating PDF', 'error');
            } finally {
                hideLoading();
            }
        });

        function readFileAsDataURL(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        }
    }
})();
