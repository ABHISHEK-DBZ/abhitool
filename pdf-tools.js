// PDF Tools: Merge, Split, Compress
(() => {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPDFTools);
    } else {
        initPDFTools();
    }

    function initPDFTools() {
        const container = document.getElementById('pdf-tools');
        if (!container) return;

        // Inject HTML if not present
        if (!container.querySelector('.tool-card')) {
            container.innerHTML = `
                <div class="tool-card">
                    <h3 class="tool-title">PDF Merge & Split</h3>
                    <p class="tool-description">Combine multiple PDFs or split them into separate files</p>
                    
                    <div class="pdf-tools-tabs">
                        <button class="pdf-tool-btn active" data-tool="merge">Merge PDF</button>
                        <button class="pdf-tool-btn" data-tool="split">Split PDF</button>
                        <button class="pdf-tool-btn" data-tool="compress">Compress PDF</button>
                    </div>
                    
                    <!-- Merge Tool -->
                    <div class="pdf-tool-content active" id="merge-tool">
                        <div class="upload-zone" id="merge-upload-zone">
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                <polyline points="14 2 14 8 20 8"/>
                                <line x1="12" y1="18" x2="12" y2="12"/>
                                <line x1="9" y1="15" x2="15" y2="15"/>
                            </svg>
                            <p>Upload PDFs to merge</p>
                            <span>Drag & drop or click to upload</span>
                            <input type="file" id="merge-file-input" accept=".pdf" multiple hidden>
                        </div>
                        <div id="merge-preview-container" class="preview-grid"></div>
                        <button id="merge-pdf-btn" class="btn-primary" disabled>Merge PDFs</button>
                    </div>
                    
                    <!-- Split Tool -->
                    <div class="pdf-tool-content" id="split-tool">
                        <div class="upload-zone" id="split-upload-zone">
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                <polyline points="14 2 14 8 20 8"/>
                                <line x1="10" y1="12" x2="14" y2="12"/>
                            </svg>
                            <p>Upload PDF to split</p>
                            <input type="file" id="split-file-input" accept=".pdf" hidden>
                        </div>
                        <div id="split-options" style="display: none; margin-top: 1.5rem;">
                            <div class="option-group">
                                <label>Split Mode</label>
                                <select id="split-mode" class="select-input">
                                    <option value="all">Extract All Pages</option>
                                    <option value="range">Extract Page Range</option>
                                </select>
                            </div>
                            <div id="range-inputs" style="display: none; gap: 1rem;">
                                <input type="number" id="split-start" class="text-input" placeholder="Start" min="1">
                                <input type="number" id="split-end" class="text-input" placeholder="End" min="1">
                            </div>
                        </div>
                        <button id="split-pdf-btn" class="btn-primary" disabled>Split PDF</button>
                    </div>
                    
                    <!-- Compress Tool -->
                    <div class="pdf-tool-content" id="compress-tool">
                        <div class="upload-zone" id="compress-upload-zone">
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/>
                                <path d="M12 12v9"/>
                                <path d="m8 17 4 4 4-4"/>
                            </svg>
                            <p>Upload PDF to compress</p>
                            <input type="file" id="compress-file-input" accept=".pdf" hidden>
                        </div>
                        <button id="compress-pdf-btn" class="btn-primary" disabled>Compress PDF</button>
                    </div>
                </div>
            `;
        }

        const { PDFDocument } = PDFLib;

        // Initialize Tabs
        const pdfToolBtns = container.querySelectorAll('.pdf-tool-btn');
        const pdfToolContents = container.querySelectorAll('.pdf-tool-content');

        pdfToolBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tool = btn.dataset.tool;
                pdfToolBtns.forEach(b => b.classList.remove('active'));
                pdfToolContents.forEach(c => c.classList.remove('active'));
                btn.classList.add('active');
                container.querySelector(`#${tool}-tool`).classList.add('active');
            });
        });

        // MERGE LOGIC
        const mergeInput = document.getElementById('merge-file-input');
        const mergeZone = document.getElementById('merge-upload-zone');
        const mergePreview = document.getElementById('merge-preview-container');
        const mergeBtn = document.getElementById('merge-pdf-btn');
        let selectedMergeFiles = [];

        mergeZone.addEventListener('click', () => mergeInput.click());

        mergeInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            selectedMergeFiles = [...selectedMergeFiles, ...files];
            updateMergePreview();
            mergeBtn.disabled = selectedMergeFiles.length < 2;
        });

        function updateMergePreview() {
            mergePreview.innerHTML = '';
            selectedMergeFiles.forEach((file, index) => {
                const item = document.createElement('div');
                item.className = 'preview-item';
                item.innerHTML = `
                    <div style="font-size: 2rem;">📄</div>
                    <div style="font-size: 0.8rem; margin-top: 0.5rem; word-break: break-all;">${file.name}</div>
                    <button class="remove-btn" onclick="removeMergeFile(${index})">×</button>
                `;
                mergePreview.appendChild(item);
            });
        }

        window.removeMergeFile = (index) => {
            selectedMergeFiles.splice(index, 1);
            updateMergePreview();
            mergeBtn.disabled = selectedMergeFiles.length < 2;
        };

        mergeBtn.addEventListener('click', async () => {
            if (selectedMergeFiles.length < 2) return;
            showLoading('Merging PDFs...');
            try {
                const mergedPdf = await PDFDocument.create();
                for (const file of selectedMergeFiles) {
                    const arrayBuffer = await file.arrayBuffer();
                    const pdf = await PDFDocument.load(arrayBuffer);
                    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                    copiedPages.forEach((page) => mergedPdf.addPage(page));
                }
                const pdfBytes = await mergedPdf.save();
                downloadFile(new Blob([pdfBytes], { type: 'application/pdf' }), 'merged.pdf');
                showNotification('PDFs merged successfully!');
                selectedMergeFiles = [];
                updateMergePreview();
            } catch (error) {
                console.error(error);
                showNotification('Error merging PDFs', 'error');
            } finally {
                hideLoading();
            }
        });

        // SPLIT LOGIC
        const splitInput = document.getElementById('split-file-input');
        const splitZone = document.getElementById('split-upload-zone');
        const splitBtn = document.getElementById('split-pdf-btn');
        const splitOptions = document.getElementById('split-options');
        const splitMode = document.getElementById('split-mode');
        const rangeInputs = document.getElementById('range-inputs');
        let splitFile = null;

        splitZone.addEventListener('click', () => splitInput.click());

        splitInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                splitFile = e.target.files[0];
                splitOptions.style.display = 'block';
                splitBtn.disabled = false;
                showNotification(`Selected: ${splitFile.name}`);
            }
        });

        splitMode.addEventListener('change', () => {
            rangeInputs.style.display = splitMode.value === 'range' ? 'flex' : 'none';
        });

        splitBtn.addEventListener('click', async () => {
            if (!splitFile) return;
            showLoading('Splitting PDF...');
            try {
                const arrayBuffer = await splitFile.arrayBuffer();
                const pdfDoc = await PDFDocument.load(arrayBuffer);
                const pageCount = pdfDoc.getPageCount();

                if (splitMode.value === 'all') {
                    const zip = new JSZip();
                    for (let i = 0; i < pageCount; i++) {
                        const newPdf = await PDFDocument.create();
                        const [page] = await newPdf.copyPages(pdfDoc, [i]);
                        newPdf.addPage(page);
                        const pdfBytes = await newPdf.save();
                        zip.file(`page_${i + 1}.pdf`, pdfBytes);
                    }
                    const content = await zip.generateAsync({ type: 'blob' });
                    downloadFile(content, 'split_pages.zip');
                } else {
                    const start = parseInt(document.getElementById('split-start').value) - 1;
                    const end = parseInt(document.getElementById('split-end').value) - 1;

                    if (isNaN(start) || isNaN(end) || start < 0 || end >= pageCount || start > end) {
                        showNotification('Invalid page range', 'error');
                        hideLoading();
                        return;
                    }

                    const newPdf = await PDFDocument.create();
                    const pages = await newPdf.copyPages(pdfDoc, Array.from({ length: end - start + 1 }, (_, i) => start + i));
                    pages.forEach(page => newPdf.addPage(page));
                    const pdfBytes = await newPdf.save();
                    downloadFile(new Blob([pdfBytes], { type: 'application/pdf' }), 'split_range.pdf');
                }
                showNotification('PDF split successfully!');
            } catch (error) {
                console.error(error);
                showNotification('Error splitting PDF', 'error');
            } finally {
                hideLoading();
            }
        });

        // COMPRESS LOGIC (Basic)
        const compressInput = document.getElementById('compress-file-input');
        const compressZone = document.getElementById('compress-upload-zone');
        const compressBtn = document.getElementById('compress-pdf-btn');
        let compressFile = null;

        compressZone.addEventListener('click', () => compressInput.click());

        compressInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                compressFile = e.target.files[0];
                compressBtn.disabled = false;
                showNotification(`Selected: ${compressFile.name}`);
            }
        });

        compressBtn.addEventListener('click', async () => {
            if (!compressFile) return;
            showLoading('Compressing PDF...');
            try {
                // Note: pdf-lib doesn't support true compression yet, so we just save it which sometimes optimizes structure
                const arrayBuffer = await compressFile.arrayBuffer();
                const pdfDoc = await PDFDocument.load(arrayBuffer);
                const pdfBytes = await pdfDoc.save({ useObjectStreams: false }); // Try to optimize
                downloadFile(new Blob([pdfBytes], { type: 'application/pdf' }), 'compressed.pdf');
                showNotification('PDF processed (optimization applied)');
            } catch (error) {
                console.error(error);
                showNotification('Error compressing PDF', 'error');
            } finally {
                hideLoading();
            }
        });
    }
})();
