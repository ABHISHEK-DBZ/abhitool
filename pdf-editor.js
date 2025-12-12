// PDF Editor - Annotations, Watermarks, Signatures
(() => {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPDFEditor);
    } else {
        initPDFEditor();
    }

    function initPDFEditor() {
        const container = document.getElementById('pdf-editor');
        if (!container) return;

        if (!container.querySelector('.tool-card')) {
            container.innerHTML = `
                <div class="tool-card">
                    <h3 class="tool-title">PDF Editor</h3>
                    <p class="tool-description">Add watermarks and rotate pages in your PDF documents</p>
                    
                    <div class="pdf-tools-tabs">
                        <button class="pdf-tool-btn active" data-tool="watermark">Add Watermark</button>
                        <button class="pdf-tool-btn" data-tool="rotate">Rotate Pages</button>
                    </div>
                    
                    <!-- Watermark Tool -->
                    <div class="pdf-tool-content active" id="watermark-tool">
                        <div class="upload-zone" id="watermark-upload-zone">
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                <polyline points="17 8 12 3 7 8"/>
                                <line x1="12" y1="3" x2="12" y2="15"/>
                            </svg>
                            <p>Upload PDF to add watermark</p>
                            <span>PDF files only</span>
                            <input type="file" id="watermark-file-input" accept=".pdf" hidden>
                        </div>
                        
                        <div class="options-grid" id="watermark-options" style="display: none;">
                            <div class="option-group">
                                <label for="watermark-text">Watermark Text</label>
                                <input type="text" id="watermark-text" class="text-input" placeholder="CONFIDENTIAL" value="DRAFT">
                            </div>
                            <div class="option-group">
                                <label for="watermark-opacity">Opacity (%)</label>
                                <input type="number" id="watermark-opacity" class="text-input" value="30" min="10" max="100">
                            </div>
                        </div>
                        
                        <button id="add-watermark-btn" class="btn-primary" disabled>Add Watermark</button>
                    </div>
                    
                    <!-- Rotate Tool -->
                    <div class="pdf-tool-content" id="rotate-tool">
                        <div class="upload-zone" id="rotate-upload-zone">
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                <polyline points="17 8 12 3 7 8"/>
                                <line x1="12" y1="3" x2="12" y2="15"/>
                            </svg>
                            <p>Upload PDF to rotate pages</p>
                            <span>PDF files only</span>
                            <input type="file" id="rotate-file-input" accept=".pdf" hidden>
                        </div>
                        
                        <div class="options-grid" id="rotate-options" style="display: none;">
                            <div class="option-group">
                                <label for="rotate-angle">Rotation Angle</label>
                                <select id="rotate-angle" class="select-input">
                                    <option value="90">90° Clockwise</option>
                                    <option value="180">180°</option>
                                    <option value="270">90° Counter-clockwise</option>
                                </select>
                            </div>
                        </div>
                        
                        <button id="rotate-pages-btn" class="btn-primary" disabled>Rotate All Pages</button>
                    </div>
                </div>
            `;
        }

        // Initialize sub-tabs
        const toolBtns = container.querySelectorAll('.pdf-tool-btn');
        const toolContents = container.querySelectorAll('.pdf-tool-content');

        toolBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tool = btn.dataset.tool;
                toolBtns.forEach(b => b.classList.remove('active'));
                toolContents.forEach(c => c.classList.remove('active'));
                btn.classList.add('active');
                container.querySelector(`#${tool}-tool`).classList.add('active');
            });
        });

        // WATERMARK
        const watermarkInput = document.getElementById('watermark-file-input');
        const watermarkZone = document.getElementById('watermark-upload-zone');
        const watermarkBtn = document.getElementById('add-watermark-btn');
        const watermarkOptions = document.getElementById('watermark-options');
        let watermarkPdfFile = null;

        watermarkZone.addEventListener('click', () => watermarkInput.click());

        watermarkInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                watermarkPdfFile = e.target.files[0];
                watermarkOptions.style.display = 'grid';
                watermarkBtn.disabled = false;
            }
        });

        watermarkBtn.addEventListener('click', async () => {
            if (!watermarkPdfFile) return;

            showLoading('Adding watermark to PDF...');

            try {
                const { PDFDocument, rgb } = PDFLib;
                const arrayBuffer = await watermarkPdfFile.arrayBuffer();
                const pdfDoc = await PDFDocument.load(arrayBuffer);

                const text = document.getElementById('watermark-text').value || 'DRAFT';
                const opacity = parseInt(document.getElementById('watermark-opacity').value) / 100;

                const pages = pdfDoc.getPages();

                for (const page of pages) {
                    const { width, height } = page.getSize();

                    page.drawText(text, {
                        x: width / 2 - (text.length * 15),
                        y: height / 2,
                        size: 60,
                        color: rgb(0.5, 0.5, 0.5),
                        opacity: opacity,
                        rotate: { angle: 45 * (Math.PI / 180) }
                    });
                }

                const pdfBytes = await pdfDoc.save();
                const blob = new Blob([pdfBytes], { type: 'application/pdf' });
                downloadFile(blob, 'watermarked.pdf');
                showNotification('Watermark added successfully!');

                // Reset
                watermarkPdfFile = null;
                watermarkInput.value = '';
                watermarkOptions.style.display = 'none';
                watermarkBtn.disabled = true;

            } catch (error) {
                console.error('Watermark error:', error);
                showNotification('Error adding watermark', 'error');
            } finally {
                hideLoading();
            }
        });

        // ROTATE
        const rotateInput = document.getElementById('rotate-file-input');
        const rotateZone = document.getElementById('rotate-upload-zone');
        const rotateBtn = document.getElementById('rotate-pages-btn');
        const rotateOptions = document.getElementById('rotate-options');
        let rotatePdfFile = null;

        rotateZone.addEventListener('click', () => rotateInput.click());

        rotateInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                rotatePdfFile = e.target.files[0];
                rotateOptions.style.display = 'grid';
                rotateBtn.disabled = false;
            }
        });

        rotateBtn.addEventListener('click', async () => {
            if (!rotatePdfFile) return;

            showLoading('Rotating PDF pages...');

            try {
                const { PDFDocument } = PDFLib;
                const arrayBuffer = await rotatePdfFile.arrayBuffer();
                const pdfDoc = await PDFDocument.load(arrayBuffer);

                const angle = parseInt(document.getElementById('rotate-angle').value);
                const pages = pdfDoc.getPages();

                for (const page of pages) {
                    page.setRotation({ angle });
                }

                const pdfBytes = await pdfDoc.save();
                const blob = new Blob([pdfBytes], { type: 'application/pdf' });
                downloadFile(blob, 'rotated.pdf');
                showNotification('Pages rotated successfully!');

                // Reset
                rotatePdfFile = null;
                rotateInput.value = '';
                rotateOptions.style.display = 'none';
                rotateBtn.disabled = true;

            } catch (error) {
                console.error('Rotation error:', error);
                showNotification('Error rotating pages', 'error');
            } finally {
                hideLoading();
            }
        });
    }
})();
