// Add Page Numbers to PDF
(() => {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPageNumbers);
    } else {
        initPageNumbers();
    }

    function initPageNumbers() {
        const container = document.getElementById('pdf-page-numbers');
        if (!container) return;

        // Create or get tool card


        let toolCard = container.querySelector('.tool-card');


        if (!toolCard) {


            toolCard = document.createElement('div');


            toolCard.className = 'tool-card';


            container.appendChild(toolCard);


        }

        toolCard.innerHTML = `
            <h3 class="tool-title">Add Page Numbers</h3>
            <p class="tool-description">Add customizable page numbers to your PDF</p>
            
            <div class="upload-zone" id="page-num-upload-zone">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <p>Upload PDF</p>
                <span>PDF files only</span>
                <input type="file" id="page-num-input" accept=".pdf" hidden>
            </div>
            
            <div class="options-grid" id="page-num-options" style="display: none;">
                <div class="option-group">
                    <label for="page-num-position">Position</label>
                    <select id="page-num-position" class="select-input">
                        <option value="bottom-center">Bottom Center</option>
                        <option value="bottom-right">Bottom Right</option>
                        <option value="bottom-left">Bottom Left</option>
                        <option value="top-center">Top Center</option>
                        <option value="top-right">Top Right</option>
                        <option value="top-left">Top Left</option>
                    </select>
                </div>
                <div class="option-group">
                    <label for="page-num-format">Format</label>
                    <select id="page-num-format" class="select-input">
                        <option value="number">1, 2, 3...</option>
                        <option value="page-of">Page 1 of 10</option>
                        <option value="dash">- 1 -</option>
                        <option value="brackets">[1]</option>
                    </select>
                </div>
                <div class="option-group">
                    <label for="page-num-size">Font Size</label>
                    <input type="number" id="page-num-size" class="text-input" value="12" min="8" max="24">
                </div>
                <div class="option-group">
                    <label for="page-num-start">Start From</label>
                    <input type="number" id="page-num-start" class="text-input" value="1" min="1">
                </div>
            </div>
            
            <button id="add-page-numbers-btn" class="btn-primary" disabled>Add Page Numbers</button>
        `;

        const fileInput = document.getElementById('page-num-input');
        const uploadZone = document.getElementById('page-num-upload-zone');
        const options = document.getElementById('page-num-options');
        const addBtn = document.getElementById('add-page-numbers-btn');
        const positionSelect = document.getElementById('page-num-position');
        const formatSelect = document.getElementById('page-num-format');
        const sizeInput = document.getElementById('page-num-size');
        const startInput = document.getElementById('page-num-start');

        let pdfFile = null;

        uploadZone.addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                pdfFile = e.target.files[0];
                options.style.display = 'grid';
                addBtn.disabled = false;
            }
        });

        addBtn.addEventListener('click', async () => {
            if (!pdfFile) return;

            const position = positionSelect.value;
            const format = formatSelect.value;
            const fontSize = parseInt(sizeInput.value);
            const startFrom = parseInt(startInput.value);

            showLoading('Adding page numbers...');

            try {
                const { PDFDocument, rgb } = PDFLib;
                const arrayBuffer = await pdfFile.arrayBuffer();
                const pdfDoc = await PDFDocument.load(arrayBuffer);

                const pages = pdfDoc.getPages();
                const totalPages = pages.length;

                pages.forEach((page, index) => {
                    const { width, height } = page.getSize();
                    const pageNumber = index + startFrom;

                    // Format the page number text
                    let text;
                    switch (format) {
                        case 'page-of':
                            text = `Page ${pageNumber} of ${totalPages + startFrom - 1}`;
                            break;
                        case 'dash':
                            text = `- ${pageNumber} -`;
                            break;
                        case 'brackets':
                            text = `[${pageNumber}]`;
                            break;
                        default:
                            text = `${pageNumber}`;
                    }

                    // Calculate position
                    const textWidth = text.length * (fontSize * 0.6); // Approximate
                    let x, y;

                    switch (position) {
                        case 'bottom-center':
                            x = (width - textWidth) / 2;
                            y = 30;
                            break;
                        case 'bottom-right':
                            x = width - textWidth - 50;
                            y = 30;
                            break;
                        case 'bottom-left':
                            x = 50;
                            y = 30;
                            break;
                        case 'top-center':
                            x = (width - textWidth) / 2;
                            y = height - 50;
                            break;
                        case 'top-right':
                            x = width - textWidth - 50;
                            y = height - 50;
                            break;
                        case 'top-left':
                            x = 50;
                            y = height - 50;
                            break;
                    }

                    page.drawText(text, {
                        x,
                        y,
                        size: fontSize,
                        color: rgb(0.3, 0.3, 0.3)
                    });
                });

                const pdfBytes = await pdfDoc.save();
                const blob = new Blob([pdfBytes], { type: 'application/pdf' });
                downloadFile(blob, 'numbered.pdf');
                showNotification('Page numbers added successfully!');

            } catch (error) {
                console.error('Add page numbers error:', error);
                showNotification('Error adding page numbers', 'error');
            } finally {
                hideLoading();
            }
        });
    }
})();
