// PDF Page Operations - Remove, Extract, Reorder
(() => {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPDFPageOps);
    } else {
        initPDFPageOps();
    }

    function initPDFPageOps() {
        const container = document.getElementById('pdf-page-ops');
        if (!container) return;

        // Create or get tool card


        let toolCard = container.querySelector('.tool-card');


        if (!toolCard) {


            toolCard = document.createElement('div');


            toolCard.className = 'tool-card';


            container.appendChild(toolCard);


        }

        toolCard.innerHTML = `
            <h3 class="tool-title">PDF Page Operations</h3>
            <p class="tool-description">Remove, extract, and reorder PDF pages</p>
            
            <div class="pdf-tools-tabs">
                <button class="pdf-tool-btn active" data-tool="remove">Remove Pages</button>
                <button class="pdf-tool-btn" data-tool="extract">Extract Pages</button>
                <button class="pdf-tool-btn" data-tool="reorder">Reorder Pages</button>
            </div>
            
            <!-- Remove Pages -->
            <div class="pdf-tool-content active" id="remove-pages-tool">
                <div class="upload-zone" id="remove-upload-zone">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    <p>Upload PDF</p>
                    <span>PDF files only</span>
                    <input type="file" id="remove-file-input" accept=".pdf" hidden>
                </div>
                <div class="options-grid" id="remove-options" style="display: none;">
                    <div class="option-group" style="grid-column: 1 / -1;">
                        <label for="remove-pages-input">Pages to remove (e.g., 1,3,5-7)</label>
                        <input type="text" id="remove-pages-input" class="text-input" placeholder="1,3,5-7">
                    </div>
                </div>
                <button id="remove-pages-btn" class="btn-primary" disabled>Remove Pages</button>
            </div>
            
            <!-- Extract Pages -->
            <div class="pdf-tool-content" id="extract-pages-tool">
                <div class="upload-zone" id="extract-upload-zone">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    <p>Upload PDF</p>
                    <span>PDF files only</span>
                    <input type="file" id="extract-file-input" accept=".pdf" hidden>
                </div>
                <div class="options-grid" id="extract-options" style="display: none;">
                    <div class="option-group" style="grid-column: 1 / -1;">
                        <label for="extract-pages-input">Pages to extract (e.g., 1-3,5,7-9)</label>
                        <input type="text" id="extract-pages-input" class="text-input" placeholder="1-3,5,7-9">
                    </div>
                </div>
                <button id="extract-pages-btn" class="btn-primary" disabled>Extract Pages</button>
            </div>
            
            <!-- Reorder Pages -->
            <div class="pdf-tool-content" id="reorder-pages-tool">
                <div class="upload-zone" id="reorder-upload-zone">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    <p>Upload PDF</p>
                    <span>PDF files only</span>
                    <input type="file" id="reorder-file-input" accept=".pdf" hidden>
                </div>
                <div id="reorder-pages-container" style="display: none;">
                    <p style="color: var(--text-secondary); margin: 1rem 0;">Drag pages to reorder them:</p>
                    <div id="reorder-pages-list" class="preview-container"></div>
                </div>
                <button id="reorder-save-btn" class="btn-primary" disabled>Save Reordered PDF</button>
            </div>
        `;

        // Initialize sub-tabs
        const toolBtns = toolCard.querySelectorAll('.pdf-tool-btn');
        const toolContents = toolCard.querySelectorAll('.pdf-tool-content');

        toolBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tool = btn.dataset.tool;
                toolBtns.forEach(b => b.classList.remove('active'));
                toolContents.forEach(c => c.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById(`${tool}-pages-tool`).classList.add('active');
            });
        });

        // REMOVE PAGES
        setupRemovePages();

        // EXTRACT PAGES  
        setupExtractPages();

        // REORDER PAGES
        setupReorderPages();

        function setupRemovePages() {
            const input = document.getElementById('remove-file-input');
            const zone = document.getElementById('remove-upload-zone');
            const options = document.getElementById('remove-options');
            const btn = document.getElementById('remove-pages-btn');
            const pagesInput = document.getElementById('remove-pages-input');
            let pdfFile = null;

            zone.addEventListener('click', () => input.click());

            input.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    pdfFile = e.target.files[0];
                    options.style.display = 'grid';
                    btn.disabled = false;
                }
            });

            btn.addEventListener('click', async () => {
                if (!pdfFile) return;

                const pagesToRemove = parsePageRange(pagesInput.value);
                if (pagesToRemove.length === 0) {
                    showNotification('Please specify pages to remove', 'error');
                    return;
                }

                showLoading('Removing pages...');

                try {
                    const { PDFDocument } = PDFLib;
                    const arrayBuffer = await pdfFile.arrayBuffer();
                    const pdfDoc = await PDFDocument.load(arrayBuffer);

                    const totalPages = pdfDoc.getPageCount();
                    const pagesToKeep = [];

                    for (let i = 1; i <= totalPages; i++) {
                        if (!pagesToRemove.includes(i)) {
                            pagesToKeep.push(i - 1); // 0-indexed
                        }
                    }

                    const newPdf = await PDFDocument.create();
                    const copiedPages = await newPdf.copyPages(pdfDoc, pagesToKeep);
                    copiedPages.forEach(page => newPdf.addPage(page));

                    const pdfBytes = await newPdf.save();
                    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
                    downloadFile(blob, 'removed_pages.pdf');
                    showNotification(`Removed ${pagesToRemove.length} pages!`);

                } catch (error) {
                    console.error('Remove pages error:', error);
                    showNotification('Error removing pages', 'error');
                } finally {
                    hideLoading();
                }
            });
        }

        function setupExtractPages() {
            const input = document.getElementById('extract-file-input');
            const zone = document.getElementById('extract-upload-zone');
            const options = document.getElementById('extract-options');
            const btn = document.getElementById('extract-pages-btn');
            const pagesInput = document.getElementById('extract-pages-input');
            let pdfFile = null;

            zone.addEventListener('click', () => input.click());

            input.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    pdfFile = e.target.files[0];
                    options.style.display = 'grid';
                    btn.disabled = false;
                }
            });

            btn.addEventListener('click', async () => {
                if (!pdfFile) return;

                const pagesToExtract = parsePageRange(pagesInput.value);
                if (pagesToExtract.length === 0) {
                    showNotification('Please specify pages to extract', 'error');
                    return;
                }

                showLoading('Extracting pages...');

                try {
                    const { PDFDocument } = PDFLib;
                    const arrayBuffer = await pdfFile.arrayBuffer();
                    const pdfDoc = await PDFDocument.load(arrayBuffer);

                    const newPdf = await PDFDocument.create();
                    const pageIndices = pagesToExtract.map(p => p - 1); // Convert to 0-indexed
                    const copiedPages = await newPdf.copyPages(pdfDoc, pageIndices);
                    copiedPages.forEach(page => newPdf.addPage(page));

                    const pdfBytes = await newPdf.save();
                    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
                    downloadFile(blob, 'extracted_pages.pdf');
                    showNotification(`Extracted ${pagesToExtract.length} pages!`);

                } catch (error) {
                    console.error('Extract pages error:', error);
                    showNotification('Error extracting pages', 'error');
                } finally {
                    hideLoading();
                }
            });
        }

        function setupReorderPages() {
            const input = document.getElementById('reorder-file-input');
            const zone = document.getElementById('reorder-upload-zone');
            const container = document.getElementById('reorder-pages-container');
            const list = document.getElementById('reorder-pages-list');
            const btn = document.getElementById('reorder-save-btn');
            let pdfFile = null;
            let pageOrder = [];

            zone.addEventListener('click', () => input.click());

            input.addEventListener('change', async (e) => {
                if (e.target.files.length === 0) return;

                pdfFile = e.target.files[0];
                showLoading('Loading PDF pages...');

                try {
                    const { PDFDocument } = PDFLib;
                    const arrayBuffer = await pdfFile.arrayBuffer();
                    const pdfDoc = await PDFDocument.load(arrayBuffer);
                    const pageCount = pdfDoc.getPageCount();

                    pageOrder = Array.from({ length: pageCount }, (_, i) => i);

                    list.innerHTML = '';
                    for (let i = 0; i < pageCount; i++) {
                        const pageItem = document.createElement('div');
                        pageItem.className = 'preview-item';
                        pageItem.draggable = true;
                        pageItem.dataset.index = i;
                        pageItem.innerHTML = `
                            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; padding: 1rem;">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                    <polyline points="14 2 14 8 20 8"/>
                                </svg>
                                <div style="margin-top: 0.5rem; font-size: 0.875rem;">Page ${i + 1}</div>
                            </div>
                        `;

                        pageItem.addEventListener('dragstart', handleDragStart);
                        pageItem.addEventListener('dragover', handleDragOver);
                        pageItem.addEventListener('drop', handleDrop);
                        pageItem.addEventListener('dragend', handleDragEnd);

                        list.appendChild(pageItem);
                    }

                    container.style.display = 'block';
                    btn.disabled = false;

                } catch (error) {
                    console.error('Load PDF error:', error);
                    showNotification('Error loading PDF', 'error');
                } finally {
                    hideLoading();
                }
            });

            let draggedElement = null;

            function handleDragStart(e) {
                draggedElement = this;
                this.style.opacity = '0.4';
            }

            function handleDragOver(e) {
                if (e.preventDefault) {
                    e.preventDefault();
                }
                return false;
            }

            function handleDrop(e) {
                if (e.stopPropagation) {
                    e.stopPropagation();
                }

                if (draggedElement !== this) {
                    const draggedIndex = parseInt(draggedElement.dataset.index);
                    const targetIndex = parseInt(this.dataset.index);

                    // Swap in pageOrder array
                    [pageOrder[draggedIndex], pageOrder[targetIndex]] = [pageOrder[targetIndex], pageOrder[draggedIndex]];

                    // Swap in DOM
                    const allItems = Array.from(list.children);
                    const draggedPos = allItems.indexOf(draggedElement);
                    const targetPos = allItems.indexOf(this);

                    if (draggedPos < targetPos) {
                        this.parentNode.insertBefore(draggedElement, this.nextSibling);
                    } else {
                        this.parentNode.insertBefore(draggedElement, this);
                    }

                    // Update indices
                    Array.from(list.children).forEach((item, idx) => {
                        item.dataset.index = idx;
                    });
                }

                return false;
            }

            function handleDragEnd(e) {
                this.style.opacity = '1';
            }

            btn.addEventListener('click', async () => {
                if (!pdfFile) return;

                showLoading('Reordering pages...');

                try {
                    const { PDFDocument } = PDFLib;
                    const arrayBuffer = await pdfFile.arrayBuffer();
                    const pdfDoc = await PDFDocument.load(arrayBuffer);

                    const newPdf = await PDFDocument.create();
                    const copiedPages = await newPdf.copyPages(pdfDoc, pageOrder);
                    copiedPages.forEach(page => newPdf.addPage(page));

                    const pdfBytes = await newPdf.save();
                    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
                    downloadFile(blob, 'reordered.pdf');
                    showNotification('Pages reordered successfully!');

                } catch (error) {
                    console.error('Reorder error:', error);
                    showNotification('Error reordering pages', 'error');
                } finally {
                    hideLoading();
                }
            });
        }

        function parsePageRange(input) {
            const pages = new Set();
            const parts = input.split(',').map(s => s.trim());

            for (const part of parts) {
                if (part.includes('-')) {
                    const [start, end] = part.split('-').map(Number);
                    for (let i = start; i <= end; i++) {
                        if (i > 0) pages.add(i);
                    }
                } else {
                    const page = Number(part);
                    if (page > 0) pages.add(page);
                }
            }

            return Array.from(pages).sort((a, b) => a - b);
        }
    }
})();
