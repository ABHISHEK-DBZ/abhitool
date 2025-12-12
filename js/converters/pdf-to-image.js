// PDF to Image Converter
(() => {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPDFToImage);
    } else {
        initPDFToImage();
    }

    function initPDFToImage() {
        const container = document.getElementById('pdf-to-image');
        if (!container) return;

        // Create or get tool card


        let toolCard = container.querySelector('.tool-card');


        if (!toolCard) {


            toolCard = document.createElement('div');


            toolCard.className = 'tool-card';


            container.appendChild(toolCard);


        }

        toolCard.innerHTML = `
            <h3 class="tool-title">PDF to Image</h3>
            <p class="tool-description">Convert PDF pages to images (JPG, PNG, WebP)</p>
            
            <div class="upload-zone" id="pdf-to-img-upload-zone">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <p>Upload PDF to convert</p>
                <span>PDF files only</span>
                <input type="file" id="pdf-to-img-input" accept=".pdf" hidden>
            </div>
            
            <div class="options-grid" id="pdf-to-img-options" style="display: none;">
                <div class="option-group">
                    <label for="pdf-to-img-format">Output Format</label>
                    <select id="pdf-to-img-format" class="select-input">
                        <option value="png">PNG (Best quality)</option>
                        <option value="jpeg">JPEG (Smaller size)</option>
                        <option value="webp">WebP (Modern)</option>
                    </select>
                </div>
                <div class="option-group">
                    <label for="pdf-to-img-quality">Quality (%)</label>
                    <input type="range" id="pdf-to-img-quality" class="slider" min="50" max="100" value="90">
                    <span id="pdf-to-img-quality-value">90%</span>
                </div>
                <div class="option-group">
                    <label for="pdf-to-img-scale">Scale</label>
                    <select id="pdf-to-img-scale" class="select-input">
                        <option value="1">1x (Original)</option>
                        <option value="1.5">1.5x</option>
                        <option value="2" selected>2x (High quality)</option>
                        <option value="3">3x (Very high)</option>
                    </select>
                </div>
                <div class="option-group">
                    <label for="pdf-to-img-pages">Pages (leave empty for all)</label>
                    <input type="text" id="pdf-to-img-pages" class="text-input" placeholder="1-3,5,7">
                </div>
            </div>
            
            <div id="pdf-to-img-preview" style="display: none; margin: 1rem 0;">
                <p style="color: var(--text-secondary); margin-bottom: 0.5rem;">Preview:</p>
                <div id="pdf-to-img-preview-container" class="preview-container"></div>
            </div>
            
            <button id="convert-pdf-to-img-btn" class="btn-primary" disabled>Convert to Images</button>
        `;

        const fileInput = document.getElementById('pdf-to-img-input');
        const uploadZone = document.getElementById('pdf-to-img-upload-zone');
        const options = document.getElementById('pdf-to-img-options');
        const convertBtn = document.getElementById('convert-pdf-to-img-btn');
        const formatSelect = document.getElementById('pdf-to-img-format');
        const qualitySlider = document.getElementById('pdf-to-img-quality');
        const qualityValue = document.getElementById('pdf-to-img-quality-value');
        const scaleSelect = document.getElementById('pdf-to-img-scale');
        const pagesInput = document.getElementById('pdf-to-img-pages');
        const preview = document.getElementById('pdf-to-img-preview');
        const previewContainer = document.getElementById('pdf-to-img-preview-container');

        let pdfFile = null;

        uploadZone.addEventListener('click', () => fileInput.click());

        qualitySlider.addEventListener('input', () => {
            qualityValue.textContent = `${qualitySlider.value}%`;
        });

        fileInput.addEventListener('change', async (e) => {
            if (e.target.files.length === 0) return;

            pdfFile = e.target.files[0];
            options.style.display = 'grid';
            convertBtn.disabled = false;

            // Show preview of first page
            try {
                const arrayBuffer = await pdfFile.arrayBuffer();
                const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                const page = await pdf.getPage(1);

                const viewport = page.getViewport({ scale: 0.5 });
                const canvas = document.createElement('canvas');
                canvas.width = viewport.width;
                canvas.height = viewport.height;

                await page.render({
                    canvasContext: canvas.getContext('2d'),
                    viewport: viewport
                }).promise;

                previewContainer.innerHTML = `
                    <div class="preview-item">
                        <img src="${canvas.toDataURL()}" alt="Preview" style="width: 100%; height: 100%; object-fit: cover;">
                        <div class="preview-item-name">Page 1 of ${pdf.numPages}</div>
                    </div>
                `;
                preview.style.display = 'block';

            } catch (error) {
                console.error('Preview error:', error);
            }
        });

        convertBtn.addEventListener('click', async () => {
            if (!pdfFile) return;

            const format = formatSelect.value;
            const quality = parseInt(qualitySlider.value) / 100;
            const scale = parseFloat(scaleSelect.value);
            const pagesStr = pagesInput.value.trim();

            showLoading('Converting PDF to images...');

            try {
                const arrayBuffer = await pdfFile.arrayBuffer();
                const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                const totalPages = pdf.numPages;

                // Determine which pages to convert
                let pagesToConvert = [];
                if (pagesStr) {
                    pagesToConvert = parsePageRange(pagesStr, totalPages);
                } else {
                    pagesToConvert = Array.from({ length: totalPages }, (_, i) => i + 1);
                }

                const images = [];

                for (const pageNum of pagesToConvert) {
                    const page = await pdf.getPage(pageNum);
                    const viewport = page.getViewport({ scale });

                    const canvas = document.createElement('canvas');
                    canvas.width = viewport.width;
                    canvas.height = viewport.height;

                    await page.render({
                        canvasContext: canvas.getContext('2d'),
                        viewport: viewport
                    }).promise;

                    const blob = await new Promise(resolve => {
                        canvas.toBlob(resolve, `image/${format}`, quality);
                    });

                    images.push({ blob, pageNum });
                }

                // Download images
                if (images.length === 1) {
                    downloadFile(images[0].blob, `page_${images[0].pageNum}.${format}`);
                } else {
                    // Create ZIP for multiple images
                    const zip = new JSZip();
                    images.forEach(({ blob, pageNum }) => {
                        zip.file(`page_${pageNum}.${format}`, blob);
                    });
                    const zipBlob = await zip.generateAsync({ type: 'blob' });
                    downloadFile(zipBlob, 'pdf_images.zip');
                }

                showNotification(`Converted ${images.length} page(s) to ${format.toUpperCase()}!`);

            } catch (error) {
                console.error('Conversion error:', error);
                showNotification('Error converting PDF', 'error');
            } finally {
                hideLoading();
            }
        });

        function parsePageRange(input, maxPages) {
            const pages = new Set();
            const parts = input.split(',').map(s => s.trim());

            for (const part of parts) {
                if (part.includes('-')) {
                    const [start, end] = part.split('-').map(Number);
                    for (let i = start; i <= Math.min(end, maxPages); i++) {
                        if (i > 0) pages.add(i);
                    }
                } else {
                    const page = Number(part);
                    if (page > 0 && page <= maxPages) pages.add(page);
                }
            }

            return Array.from(pages).sort((a, b) => a - b);
        }
    }
})();
