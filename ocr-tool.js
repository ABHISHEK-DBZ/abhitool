// OCR Tool
(() => {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initOCR);
    } else {
        initOCR();
    }

    function initOCR() {
        const container = document.getElementById('ocr-tool');
        if (!container) return;

        if (!container.querySelector('.tool-card')) {
            container.innerHTML = `
                <div class="tool-card">
                    <h3 class="tool-title">OCR Tool</h3>
                    <p class="tool-description">Extract text from images using AI</p>
                    
                    <div class="upload-zone" id="ocr-upload-zone">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                            <line x1="16" y1="13" x2="8" y2="13"/>
                            <line x1="16" y1="17" x2="8" y2="17"/>
                            <line x1="10" y1="9" x2="8" y2="9"/>
                        </svg>
                        <p>Upload image containing text</p>
                        <span>JPG, PNG, WebP</span>
                        <input type="file" id="ocr-file-input" accept="image/*" hidden>
                    </div>

                    <div id="ocr-preview" style="margin-top: 2rem; display: none;">
                        <img id="ocr-image" style="max-width: 100%; max-height: 300px; border-radius: 8px; display: block; margin: 0 auto;">
                        <button id="extract-text-btn" class="btn-primary" style="margin-top: 1.5rem;">Extract Text</button>
                    </div>

                    <div id="ocr-result" style="margin-top: 2rem; display: none;">
                        <label>Extracted Text</label>
                        <textarea id="ocr-text-output" class="text-input" rows="10" readonly></textarea>
                        <div style="margin-top: 1rem; display: flex; gap: 1rem;">
                            <button id="copy-ocr-btn" class="btn-secondary">Copy Text</button>
                            <button id="download-ocr-btn" class="btn-secondary">Download .txt</button>
                        </div>
                    </div>
                </div>
            `;
        }

        const fileInput = document.getElementById('ocr-file-input');
        const uploadZone = document.getElementById('ocr-upload-zone');
        const previewSection = document.getElementById('ocr-preview');
        const ocrImage = document.getElementById('ocr-image');
        const extractBtn = document.getElementById('extract-text-btn');
        const resultSection = document.getElementById('ocr-result');
        const outputText = document.getElementById('ocr-text-output');
        const copyBtn = document.getElementById('copy-ocr-btn');
        const downloadBtn = document.getElementById('download-ocr-btn');

        uploadZone.addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                const file = e.target.files[0];
                ocrImage.src = URL.createObjectURL(file);
                previewSection.style.display = 'block';
                resultSection.style.display = 'none';
            }
        });

        extractBtn.addEventListener('click', async () => {
            showLoading('Extracting text (this may take a moment)...');
            try {
                const worker = await Tesseract.createWorker();
                await worker.loadLanguage('eng');
                await worker.initialize('eng');
                const { data: { text } } = await worker.recognize(ocrImage.src);
                await worker.terminate();

                outputText.value = text;
                resultSection.style.display = 'block';
                showNotification('Text extracted successfully!');
            } catch (error) {
                console.error('OCR Error:', error);
                showNotification('Error extracting text', 'error');
            } finally {
                hideLoading();
            }
        });

        copyBtn.addEventListener('click', () => {
            outputText.select();
            document.execCommand('copy');
            showNotification('Copied to clipboard!');
        });

        downloadBtn.addEventListener('click', () => {
            const blob = new Blob([outputText.value], { type: 'text/plain' });
            downloadFile(blob, 'extracted_text.txt');
        });
    }
})();
