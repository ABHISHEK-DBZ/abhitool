// Digital Signature Pad for PDFs
(() => {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSignaturePad);
    } else {
        initSignaturePad();
    }

    function initSignaturePad() {
        const container = document.getElementById('pdf-signature');
        if (!container) return;

        // Create or get tool card


        let toolCard = container.querySelector('.tool-card');


        if (!toolCard) {


            toolCard = document.createElement('div');


            toolCard.className = 'tool-card';


            container.appendChild(toolCard);


        }

        toolCard.innerHTML = `
            <h3 class="tool-title">Digital Signature</h3>
            <p class="tool-description">Sign PDFs with your digital signature</p>
            
            <div class="upload-zone" id="signature-upload-zone">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <p>Upload PDF to sign</p>
                <span>PDF files only</span>
                <input type="file" id="signature-file-input" accept=".pdf" hidden>
            </div>
            
            <div id="signature-editor" style="display: none;">
                <div style="margin: 1.5rem 0;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Draw Your Signature:</label>
                    <div style="border: 2px solid var(--border-color); border-radius: 8px; background: white; display: inline-block;">
                        <canvas id="signature-canvas" width="500" height="200" style="display: block; cursor: crosshair;"></canvas>
                    </div>
                    <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
                        <button id="clear-signature-btn" class="btn-secondary">Clear</button>
                        <button id="undo-signature-btn" class="btn-secondary">Undo</button>
                    </div>
                </div>
                
                <div class="options-grid">
                    <div class="option-group">
                        <label for="signature-position">Position</label>
                        <select id="signature-position" class="select-input">
                            <option value="bottom-right">Bottom Right</option>
                            <option value="bottom-left">Bottom Left</option>
                            <option value="top-right">Top Right</option>
                            <option value="top-left">Top Left</option>
                            <option value="center">Center</option>
                        </select>
                    </div>
                    <div class="option-group">
                        <label for="signature-page">Page</label>
                        <select id="signature-page" class="select-input">
                            <option value="last">Last Page</option>
                            <option value="first">First Page</option>
                            <option value="all">All Pages</option>
                        </select>
                    </div>
                    <div class="option-group">
                        <label for="signature-size">Size (%)</label>
                        <input type="number" id="signature-size" class="text-input" value="20" min="5" max="50">
                    </div>
                </div>
                
                <button id="apply-signature-btn" class="btn-primary" disabled>Apply Signature</button>
            </div>
        `;

        const fileInput = document.getElementById('signature-file-input');
        const uploadZone = document.getElementById('signature-upload-zone');
        const editor = document.getElementById('signature-editor');
        const canvas = document.getElementById('signature-canvas');
        const ctx = canvas.getContext('2d');
        const clearBtn = document.getElementById('clear-signature-btn');
        const undoBtn = document.getElementById('undo-signature-btn');
        const applyBtn = document.getElementById('apply-signature-btn');
        const positionSelect = document.getElementById('signature-position');
        const pageSelect = document.getElementById('signature-page');
        const sizeInput = document.getElementById('signature-size');

        let pdfFile = null;
        let isDrawing = false;
        let lastX = 0;
        let lastY = 0;
        let strokes = [];
        let currentStroke = [];

        // Setup canvas
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        uploadZone.addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                pdfFile = e.target.files[0];
                uploadZone.style.display = 'none';
                editor.style.display = 'block';
            }
        });

        // Drawing functions
        canvas.addEventListener('mousedown', startDrawing);
        canvas.addEventListener('mousemove', draw);
        canvas.addEventListener('mouseup', stopDrawing);
        canvas.addEventListener('mouseout', stopDrawing);

        // Touch support
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = canvas.getBoundingClientRect();
            lastX = touch.clientX - rect.left;
            lastY = touch.clientY - rect.top;
            isDrawing = true;
            currentStroke = [{ x: lastX, y: lastY }];
        });

        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (!isDrawing) return;
            const touch = e.touches[0];
            const rect = canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;

            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(x, y);
            ctx.stroke();

            currentStroke.push({ x, y });
            lastX = x;
            lastY = y;
        });

        canvas.addEventListener('touchend', () => {
            if (isDrawing && currentStroke.length > 0) {
                strokes.push([...currentStroke]);
                currentStroke = [];
                applyBtn.disabled = strokes.length === 0;
            }
            isDrawing = false;
        });

        function startDrawing(e) {
            isDrawing = true;
            const rect = canvas.getBoundingClientRect();
            lastX = e.clientX - rect.left;
            lastY = e.clientY - rect.top;
            currentStroke = [{ x: lastX, y: lastY }];
        }

        function draw(e) {
            if (!isDrawing) return;

            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(x, y);
            ctx.stroke();

            currentStroke.push({ x, y });
            lastX = x;
            lastY = y;
        }

        function stopDrawing() {
            if (isDrawing && currentStroke.length > 0) {
                strokes.push([...currentStroke]);
                currentStroke = [];
                applyBtn.disabled = strokes.length === 0;
            }
            isDrawing = false;
        }

        clearBtn.addEventListener('click', () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            strokes = [];
            currentStroke = [];
            applyBtn.disabled = true;
        });

        undoBtn.addEventListener('click', () => {
            if (strokes.length === 0) return;

            strokes.pop();
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            strokes.forEach(stroke => {
                ctx.beginPath();
                ctx.moveTo(stroke[0].x, stroke[0].y);
                stroke.forEach(point => {
                    ctx.lineTo(point.x, point.y);
                });
                ctx.stroke();
            });

            applyBtn.disabled = strokes.length === 0;
        });

        applyBtn.addEventListener('click', async () => {
            if (!pdfFile || strokes.length === 0) return;

            showLoading('Applying signature...');

            try {
                const { PDFDocument } = PDFLib;
                const arrayBuffer = await pdfFile.arrayBuffer();
                const pdfDoc = await PDFDocument.load(arrayBuffer);

                // Convert canvas to PNG
                const signatureDataUrl = canvas.toDataURL('image/png');
                const signatureImage = await pdfDoc.embedPng(signatureDataUrl);

                const pages = pdfDoc.getPages();
                const pageOption = pageSelect.value;
                const position = positionSelect.value;
                const sizePercent = parseInt(sizeInput.value) / 100;

                // Determine which pages to sign
                let pagesToSign = [];
                if (pageOption === 'first') {
                    pagesToSign = [pages[0]];
                } else if (pageOption === 'last') {
                    pagesToSign = [pages[pages.length - 1]];
                } else {
                    pagesToSign = pages;
                }

                pagesToSign.forEach(page => {
                    const { width, height } = page.getSize();

                    // Calculate signature dimensions
                    const sigWidth = width * sizePercent;
                    const sigHeight = (signatureImage.height / signatureImage.width) * sigWidth;

                    // Calculate position
                    let x, y;
                    const margin = 30;

                    switch (position) {
                        case 'bottom-right':
                            x = width - sigWidth - margin;
                            y = margin;
                            break;
                        case 'bottom-left':
                            x = margin;
                            y = margin;
                            break;
                        case 'top-right':
                            x = width - sigWidth - margin;
                            y = height - sigHeight - margin;
                            break;
                        case 'top-left':
                            x = margin;
                            y = height - sigHeight - margin;
                            break;
                        case 'center':
                            x = (width - sigWidth) / 2;
                            y = (height - sigHeight) / 2;
                            break;
                    }

                    page.drawImage(signatureImage, {
                        x,
                        y,
                        width: sigWidth,
                        height: sigHeight
                    });
                });

                const pdfBytes = await pdfDoc.save();
                const blob = new Blob([pdfBytes], { type: 'application/pdf' });
                downloadFile(blob, 'signed.pdf');
                showNotification('Signature applied successfully!');

            } catch (error) {
                console.error('Signature error:', error);
                showNotification('Error applying signature', 'error');
            } finally {
                hideLoading();
            }
        });
    }
})();
