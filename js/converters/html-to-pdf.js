// HTML to PDF Converter
(() => {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initHTMLToPDF);
    } else {
        initHTMLToPDF();
    }

    function initHTMLToPDF() {
        const container = document.getElementById('html-to-pdf');
        if (!container) return;

        // Create or get tool card


        let toolCard = container.querySelector('.tool-card');


        if (!toolCard) {


            toolCard = document.createElement('div');


            toolCard.className = 'tool-card';


            container.appendChild(toolCard);


        }

        toolCard.innerHTML = `
            <h3 class="tool-title">HTML to PDF</h3>
            <p class="tool-description">Convert HTML content to PDF document</p>
            
            <div class="options-grid">
                <div class="option-group" style="grid-column: 1 / -1;">
                    <label for="html-content">HTML Content</label>
                    <textarea id="html-content" class="text-input" rows="10" placeholder="Paste your HTML here..."></textarea>
                </div>
                <div class="option-group">
                    <label for="html-pdf-orientation">Orientation</label>
                    <select id="html-pdf-orientation" class="select-input">
                        <option value="portrait">Portrait</option>
                        <option value="landscape">Landscape</option>
                    </select>
                </div>
                <div class="option-group">
                    <label for="html-pdf-size">Page Size</label>
                    <select id="html-pdf-size" class="select-input">
                        <option value="a4">A4</option>
                        <option value="letter">Letter</option>
                        <option value="legal">Legal</option>
                    </select>
                </div>
            </div>
            
            <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
                <button id="html-preview-btn" class="btn-secondary">Preview</button>
                <button id="html-convert-btn" class="btn-primary">Convert to PDF</button>
            </div>
            
            <div id="html-preview" style="display: none; margin-top: 1.5rem; padding: 1rem; background: white; border-radius: 8px; border: 1px solid var(--border-color);"></div>
        `;

        const htmlContent = document.getElementById('html-content');
        const orientationSelect = document.getElementById('html-pdf-orientation');
        const sizeSelect = document.getElementById('html-pdf-size');
        const previewBtn = document.getElementById('html-preview-btn');
        const convertBtn = document.getElementById('html-convert-btn');
        const preview = document.getElementById('html-preview');

        // Sample HTML
        htmlContent.value = `<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { color: #8B5CF6; }
        p { line-height: 1.6; }
    </style>
</head>
<body>
    <h1>Sample Document</h1>
    <p>This is a sample HTML document that will be converted to PDF.</p>
    <p>You can customize this content with your own HTML.</p>
</body>
</html>`;

        previewBtn.addEventListener('click', () => {
            const html = htmlContent.value;
            preview.innerHTML = html;
            preview.style.display = 'block';
        });

        convertBtn.addEventListener('click', async () => {
            const html = htmlContent.value.trim();
            if (!html) {
                showNotification('Please enter HTML content', 'error');
                return;
            }

            showLoading('Converting HTML to PDF...');

            try {
                const { jsPDF } = window.jspdf;
                const orientation = orientationSelect.value;
                const size = sizeSelect.value;

                const doc = new jsPDF({
                    orientation,
                    unit: 'mm',
                    format: size
                });

                // Create temporary element to render HTML
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = html;
                tempDiv.style.position = 'absolute';
                tempDiv.style.left = '-9999px';
                tempDiv.style.width = orientation === 'portrait' ? '210mm' : '297mm';
                document.body.appendChild(tempDiv);

                // Use html2canvas if available, otherwise use basic text extraction
                if (window.html2canvas) {
                    const canvas = await html2canvas(tempDiv, {
                        scale: 2,
                        useCORS: true
                    });

                    const imgData = canvas.toDataURL('image/png');
                    const imgWidth = doc.internal.pageSize.getWidth();
                    const imgHeight = (canvas.height * imgWidth) / canvas.width;

                    doc.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
                } else {
                    // Fallback: extract text and add to PDF
                    const text = tempDiv.textContent || tempDiv.innerText;
                    const lines = doc.splitTextToSize(text, doc.internal.pageSize.getWidth() - 20);
                    doc.text(lines, 10, 10);
                }

                document.body.removeChild(tempDiv);

                doc.save('converted.pdf');
                showNotification('HTML converted to PDF!');

            } catch (error) {
                console.error('HTML to PDF error:', error);
                showNotification('Error converting HTML. Try using simpler HTML or install html2canvas library.', 'error');
            } finally {
                hideLoading();
            }
        });
    }
})();
