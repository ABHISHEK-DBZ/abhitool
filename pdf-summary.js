// PDF Summary Tool
(() => {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPDFSummary);
    } else {
        initPDFSummary();
    }

    function initPDFSummary() {
        const container = document.getElementById('pdf-summary');
        if (!container) return;

        if (!container.querySelector('.tool-card')) {
            container.innerHTML = `
                <div class="tool-card">
                    <h3 class="tool-title">PDF Summary</h3>
                    <p class="tool-description">Get a quick overview of your PDF document</p>
                    
                    <div class="upload-zone" id="summary-upload-zone">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                            <line x1="16" y1="13" x2="8" y2="13"/>
                            <line x1="16" y1="17" x2="8" y2="17"/>
                            <line x1="10" y1="9" x2="8" y2="9"/>
                        </svg>
                        <p>Upload PDF to summarize</p>
                        <span>PDF files only</span>
                        <input type="file" id="summary-file-input" accept=".pdf" hidden>
                    </div>

                    <div id="summary-result" style="display: none; margin-top: 2rem;">
                        <div class="summary-stats" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
                            <div class="stat-card" style="background: var(--bg-secondary); padding: 1rem; border-radius: 8px; text-align: center;">
                                <h4 style="font-size: 0.9rem; color: var(--text-secondary);">Pages</h4>
                                <p id="page-count" style="font-size: 1.5rem; font-weight: bold;">0</p>
                            </div>
                            <div class="stat-card" style="background: var(--bg-secondary); padding: 1rem; border-radius: 8px; text-align: center;">
                                <h4 style="font-size: 0.9rem; color: var(--text-secondary);">File Size</h4>
                                <p id="file-size" style="font-size: 1.5rem; font-weight: bold;">0 MB</p>
                            </div>
                            <div class="stat-card" style="background: var(--bg-secondary); padding: 1rem; border-radius: 8px; text-align: center;">
                                <h4 style="font-size: 0.9rem; color: var(--text-secondary);">Title</h4>
                                <p id="pdf-title" style="font-size: 1rem; font-weight: bold; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">-</p>
                            </div>
                        </div>

                        <div class="alert-box" style="background: rgba(33, 150, 243, 0.1); border: 1px solid rgba(33, 150, 243, 0.3); padding: 1rem; border-radius: 6px; color: #2196f3;">
                            <p><strong>Note:</strong> AI-powered text summarization requires a backend API. This tool currently provides document metadata.</p>
                        </div>
                    </div>
                </div>
            `;
        }

        const fileInput = document.getElementById('summary-file-input');
        const uploadZone = document.getElementById('summary-upload-zone');
        const resultSection = document.getElementById('summary-result');
        const pageCountEl = document.getElementById('page-count');
        const fileSizeEl = document.getElementById('file-size');
        const titleEl = document.getElementById('pdf-title');

        uploadZone.addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', async (e) => {
            if (e.target.files.length > 0) {
                const file = e.target.files[0];
                showLoading('Analyzing PDF...');

                try {
                    const arrayBuffer = await file.arrayBuffer();
                    const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);

                    pageCountEl.textContent = pdfDoc.getPageCount();
                    fileSizeEl.textContent = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
                    titleEl.textContent = pdfDoc.getTitle() || file.name;

                    resultSection.style.display = 'block';
                    showNotification('PDF analyzed successfully!');

                } catch (error) {
                    console.error('Analysis Error:', error);
                    showNotification('Error analyzing PDF', 'error');
                } finally {
                    hideLoading();
                }
            }
        });
    }
})();
