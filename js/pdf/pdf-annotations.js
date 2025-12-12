// PDF Annotations - Drawing Tools and Text Boxes
(() => {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPDFAnnotations);
    } else {
        initPDFAnnotations();
    }

    function initPDFAnnotations() {
        const container = document.getElementById('pdf-annotations');
        if (!container) return;

        // Create or get tool card


        let toolCard = container.querySelector('.tool-card');


        if (!toolCard) {


            toolCard = document.createElement('div');


            toolCard.className = 'tool-card';


            container.appendChild(toolCard);


        }

        toolCard.innerHTML = `
            <h3 class="tool-title">PDF Annotations</h3>
            <p class="tool-description">Add drawings, shapes, and text to PDFs</p>
            
            <div class="upload-zone" id="annotate-upload-zone">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <p>Upload PDF to annotate</p>
                <span>PDF files only</span>
                <input type="file" id="annotate-file-input" accept=".pdf" hidden>
            </div>
            
            <div id="annotation-editor" style="display: none;">
                <!-- Tools -->
                <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem; flex-wrap: wrap;">
                    <button class="annotation-tool-btn active" data-tool="draw">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 19l7-7 3 3-7 7-3-3z"/>
                            <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
                        </svg>
                        Draw
                    </button>
                    <button class="annotation-tool-btn" data-tool="text">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="4 7 4 4 20 4 20 7"/>
                            <line x1="9" y1="20" x2="15" y2="20"/>
                            <line x1="12" y1="4" x2="12" y2="20"/>
                        </svg>
                        Text
                    </button>
                    <button class="annotation-tool-btn" data-tool="rectangle">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="3" width="18" height="18" rx="2"/>
                        </svg>
                        Rectangle
                    </button>
                    <button class="annotation-tool-btn" data-tool="circle">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"/>
                        </svg>
                        Circle
                    </button>
                    <button class="annotation-tool-btn" data-tool="arrow">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="5" y1="12" x2="19" y2="12"/>
                            <polyline points="12 5 19 12 12 19"/>
                        </svg>
                        Arrow
                    </button>
                </div>
                
                <!-- Options -->
                <div class="options-grid" style="margin-bottom: 1rem;">
                    <div class="option-group">
                        <label for="annotation-color">Color</label>
                        <input type="color" id="annotation-color" class="text-input" value="#ff0000">
                    </div>
                    <div class="option-group">
                        <label for="annotation-width">Line Width</label>
                        <input type="range" id="annotation-width" class="slider" min="1" max="10" value="3">
                    </div>
                    <div class="option-group">
                        <label for="annotation-page">Page</label>
                        <select id="annotation-page" class="select-input">
                            <option value="1">Page 1</option>
                        </select>
                    </div>
                </div>
                
                <!-- Canvas -->
                <div style="position: relative; display: inline-block; margin: 1rem 0;">
                    <canvas id="annotation-canvas" style="border: 2px solid var(--border-color); border-radius: 8px; background: white; cursor: crosshair; max-width: 100%;"></canvas>
                </div>
                
                <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
                    <button id="clear-annotations-btn" class="btn-secondary">Clear All</button>
                    <button id="undo-annotation-btn" class="btn-secondary">Undo</button>
                    <button id="save-annotations-btn" class="btn-primary">Save Annotated PDF</button>
                </div>
            </div>
        `;

        const fileInput = document.getElementById('annotate-file-input');
        const uploadZone = document.getElementById('annotate-upload-zone');
        const editor = document.getElementById('annotation-editor');
        const canvas = document.getElementById('annotation-canvas');
        const ctx = canvas.getContext('2d');
        const toolBtns = document.querySelectorAll('.annotation-tool-btn');
        const colorInput = document.getElementById('annotation-color');
        const widthInput = document.getElementById('annotation-width');
        const pageSelect = document.getElementById('annotation-page');
        const clearBtn = document.getElementById('clear-annotations-btn');
        const undoBtn = document.getElementById('undo-annotation-btn');
        const saveBtn = document.getElementById('save-annotations-btn');

        let pdfFile = null;
        let pdfDoc = null;
        let currentPage = 1;
        let currentTool = 'draw';
        let isDrawing = false;
        let startX, startY;
        let annotations = [];
        let currentAnnotation = null;

        uploadZone.addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', async (e) => {
            if (e.target.files.length === 0) return;

            pdfFile = e.target.files[0];
            showLoading('Loading PDF...');

            try {
                const arrayBuffer = await pdfFile.arrayBuffer();
                const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                pdfDoc = pdf;

                // Populate page selector
                pageSelect.innerHTML = '';
                for (let i = 1; i <= pdf.numPages; i++) {
                    const option = document.createElement('option');
                    option.value = i;
                    option.textContent = `Page ${i}`;
                    pageSelect.appendChild(option);
                }

                await renderPage(1);

                uploadZone.style.display = 'none';
                editor.style.display = 'block';

            } catch (error) {
                console.error('PDF load error:', error);
                showNotification('Error loading PDF', 'error');
            } finally {
                hideLoading();
            }
        });

        async function renderPage(pageNum) {
            const page = await pdfDoc.getPage(pageNum);
            const viewport = page.getViewport({ scale: 1.5 });

            canvas.width = viewport.width;
            canvas.height = viewport.height;

            await page.render({
                canvasContext: ctx,
                viewport: viewport
            }).promise;

            // Redraw annotations for this page
            const pageAnnotations = annotations.filter(a => a.page === pageNum);
            pageAnnotations.forEach(drawAnnotation);
        }

        pageSelect.addEventListener('change', async () => {
            currentPage = parseInt(pageSelect.value);
            await renderPage(currentPage);
        });

        // Tool selection
        toolBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                toolBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentTool = btn.dataset.tool;
            });
        });

        // Drawing
        canvas.addEventListener('mousedown', startDrawing);
        canvas.addEventListener('mousemove', draw);
        canvas.addEventListener('mouseup', stopDrawing);
        canvas.addEventListener('mouseout', stopDrawing);

        function startDrawing(e) {
            isDrawing = true;
            const rect = canvas.getBoundingClientRect();
            startX = e.clientX - rect.left;
            startY = e.clientY - rect.top;

            if (currentTool === 'text') {
                const text = prompt('Enter text:');
                if (text) {
                    currentAnnotation = {
                        type: 'text',
                        page: currentPage,
                        x: startX,
                        y: startY,
                        text: text,
                        color: colorInput.value,
                        size: parseInt(widthInput.value) * 5
                    };
                    annotations.push(currentAnnotation);
                    drawAnnotation(currentAnnotation);
                }
                isDrawing = false;
                return;
            }

            currentAnnotation = {
                type: currentTool,
                page: currentPage,
                startX: startX,
                startY: startY,
                color: colorInput.value,
                width: parseInt(widthInput.value),
                points: currentTool === 'draw' ? [{ x: startX, y: startY }] : null
            };
        }

        function draw(e) {
            if (!isDrawing) return;

            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            if (currentTool === 'draw') {
                currentAnnotation.points.push({ x, y });
                ctx.strokeStyle = currentAnnotation.color;
                ctx.lineWidth = currentAnnotation.width;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(startX, startY);
                ctx.lineTo(x, y);
                ctx.stroke();
                startX = x;
                startY = y;
            } else {
                // Redraw page and all annotations
                renderPage(currentPage).then(() => {
                    // Draw preview of current shape
                    const tempAnnotation = {
                        ...currentAnnotation,
                        endX: x,
                        endY: y
                    };
                    drawAnnotation(tempAnnotation);
                });
            }
        }

        function stopDrawing(e) {
            if (!isDrawing) return;
            isDrawing = false;

            if (currentTool !== 'draw' && currentAnnotation) {
                const rect = canvas.getBoundingClientRect();
                currentAnnotation.endX = e.clientX - rect.left;
                currentAnnotation.endY = e.clientY - rect.top;
                annotations.push(currentAnnotation);
            } else if (currentTool === 'draw' && currentAnnotation) {
                annotations.push(currentAnnotation);
            }

            currentAnnotation = null;
        }

        function drawAnnotation(annotation) {
            ctx.strokeStyle = annotation.color;
            ctx.fillStyle = annotation.color;
            ctx.lineWidth = annotation.width || 2;

            switch (annotation.type) {
                case 'draw':
                    if (annotation.points && annotation.points.length > 1) {
                        ctx.beginPath();
                        ctx.moveTo(annotation.points[0].x, annotation.points[0].y);
                        annotation.points.forEach(p => ctx.lineTo(p.x, p.y));
                        ctx.stroke();
                    }
                    break;

                case 'rectangle':
                    ctx.strokeRect(
                        annotation.startX,
                        annotation.startY,
                        annotation.endX - annotation.startX,
                        annotation.endY - annotation.startY
                    );
                    break;

                case 'circle':
                    const radius = Math.sqrt(
                        Math.pow(annotation.endX - annotation.startX, 2) +
                        Math.pow(annotation.endY - annotation.startY, 2)
                    );
                    ctx.beginPath();
                    ctx.arc(annotation.startX, annotation.startY, radius, 0, 2 * Math.PI);
                    ctx.stroke();
                    break;

                case 'arrow':
                    drawArrow(
                        annotation.startX,
                        annotation.startY,
                        annotation.endX,
                        annotation.endY
                    );
                    break;

                case 'text':
                    ctx.font = `${annotation.size}px Arial`;
                    ctx.fillText(annotation.text, annotation.x, annotation.y);
                    break;
            }
        }

        function drawArrow(fromX, fromY, toX, toY) {
            const headLength = 15;
            const angle = Math.atan2(toY - fromY, toX - fromX);

            ctx.beginPath();
            ctx.moveTo(fromX, fromY);
            ctx.lineTo(toX, toY);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(toX, toY);
            ctx.lineTo(
                toX - headLength * Math.cos(angle - Math.PI / 6),
                toY - headLength * Math.sin(angle - Math.PI / 6)
            );
            ctx.moveTo(toX, toY);
            ctx.lineTo(
                toX - headLength * Math.cos(angle + Math.PI / 6),
                toY - headLength * Math.sin(angle + Math.PI / 6)
            );
            ctx.stroke();
        }

        clearBtn.addEventListener('click', async () => {
            annotations = annotations.filter(a => a.page !== currentPage);
            await renderPage(currentPage);
        });

        undoBtn.addEventListener('click', async () => {
            const pageAnnotations = annotations.filter(a => a.page === currentPage);
            if (pageAnnotations.length > 0) {
                annotations.pop();
                await renderPage(currentPage);
            }
        });

        saveBtn.addEventListener('click', async () => {
            showLoading('Saving annotated PDF...');

            try {
                const { PDFDocument } = PDFLib;
                const arrayBuffer = await pdfFile.arrayBuffer();
                const pdfDocLib = await PDFDocument.load(arrayBuffer);

                // Convert canvas annotations to PDF
                for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
                    const pageAnnotations = annotations.filter(a => a.page === pageNum);
                    if (pageAnnotations.length === 0) continue;

                    // Render page with annotations to canvas
                    const page = await pdfDoc.getPage(pageNum);
                    const viewport = page.getViewport({ scale: 1.5 });
                    const tempCanvas = document.createElement('canvas');
                    tempCanvas.width = viewport.width;
                    tempCanvas.height = viewport.height;
                    const tempCtx = tempCanvas.getContext('2d');

                    await page.render({
                        canvasContext: tempCtx,
                        viewport: viewport
                    }).promise;

                    // Draw annotations
                    pageAnnotations.forEach(annotation => {
                        // Temporarily use tempCtx for drawing
                        drawAnnotationOnContext(tempCtx, annotation);
                    });

                    // Embed as image
                    const imgData = tempCanvas.toDataURL('image/png');
                    const pngImage = await pdfDocLib.embedPng(imgData);
                    const pdfPage = pdfDocLib.getPage(pageNum - 1);
                    const { width, height } = pdfPage.getSize();

                    pdfPage.drawImage(pngImage, {
                        x: 0,
                        y: 0,
                        width: width,
                        height: height
                    });
                }

                const pdfBytes = await pdfDocLib.save();
                const blob = new Blob([pdfBytes], { type: 'application/pdf' });
                downloadFile(blob, 'annotated.pdf');
                showNotification('Annotations saved!');

            } catch (error) {
                console.error('Save error:', error);
                showNotification('Error saving annotations', 'error');
            } finally {
                hideLoading();
            }
        });
    }
})();
