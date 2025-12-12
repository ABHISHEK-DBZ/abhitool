// Markdown to PDF Converter
(() => {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMarkdownToPDF);
    } else {
        initMarkdownToPDF();
    }

    function initMarkdownToPDF() {
        const container = document.getElementById('markdown-to-pdf');
        if (!container) return;

        // Create or get tool card


        let toolCard = container.querySelector('.tool-card');


        if (!toolCard) {


            toolCard = document.createElement('div');


            toolCard.className = 'tool-card';


            container.appendChild(toolCard);


        }

        toolCard.innerHTML = `
            <h3 class="tool-title">Markdown to PDF</h3>
            <p class="tool-description">Convert Markdown documents to formatted PDFs</p>
            
            <div class="options-grid">
                <div class="option-group" style="grid-column: 1 / -1;">
                    <label for="markdown-content">Markdown Content</label>
                    <textarea id="markdown-content" class="text-input" rows="12" placeholder="# Your Markdown Here

## Features
- **Bold** and *italic* text
- Lists and links
- Code blocks
- And more!"></textarea>
                </div>
                <div class="option-group">
                    <label for="md-pdf-orientation">Orientation</label>
                    <select id="md-pdf-orientation" class="select-input">
                        <option value="portrait">Portrait</option>
                        <option value="landscape">Landscape</option>
                    </select>
                </div>
                <div class="option-group">
                    <label for="md-pdf-size">Page Size</label>
                    <select id="md-pdf-size" class="select-input">
                        <option value="a4">A4</option>
                        <option value="letter">Letter</option>
                        <option value="legal">Legal</option>
                    </select>
                </div>
            </div>
            
            <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
                <button id="md-preview-btn" class="btn-secondary">Preview HTML</button>
                <button id="md-convert-btn" class="btn-primary">Convert to PDF</button>
            </div>
            
            <div id="md-preview" style="display: none; margin-top: 1.5rem; padding: 1.5rem; background: white; color: black; border-radius: 8px; border: 1px solid var(--border-color);"></div>
        `;

        const mdContent = document.getElementById('markdown-content');
        const orientationSelect = document.getElementById('md-pdf-orientation');
        const sizeSelect = document.getElementById('md-pdf-size');
        const previewBtn = document.getElementById('md-preview-btn');
        const convertBtn = document.getElementById('md-convert-btn');
        const preview = document.getElementById('md-preview');

        // Sample markdown
        mdContent.value = `# Sample Document

## Introduction
This is a **sample** Markdown document that will be converted to PDF.

## Features
- Easy to write
- Clean formatting
- Professional output

## Code Example
\`\`\`javascript
function hello() {
    console.log("Hello, World!");
}
\`\`\`

## Conclusion
Markdown makes document creation simple and efficient!`;

        previewBtn.addEventListener('click', () => {
            const markdown = mdContent.value.trim();
            if (!markdown) {
                showNotification('Please enter markdown content', 'error');
                return;
            }

            const html = convertMarkdownToHTML(markdown);
            preview.innerHTML = html;
            preview.style.display = 'block';
        });

        convertBtn.addEventListener('click', async () => {
            const markdown = mdContent.value.trim();
            if (!markdown) {
                showNotification('Please enter markdown content', 'error');
                return;
            }

            showLoading('Converting Markdown to PDF...');

            try {
                const { jsPDF } = window.jspdf;
                const orientation = orientationSelect.value;
                const size = sizeSelect.value;

                const doc = new jsPDF({
                    orientation,
                    unit: 'mm',
                    format: size
                });

                // Convert markdown to HTML
                const html = convertMarkdownToHTML(markdown);

                // Create temporary element
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = html;
                tempDiv.style.position = 'absolute';
                tempDiv.style.left = '-9999px';
                tempDiv.style.width = orientation === 'portrait' ? '190mm' : '277mm';
                tempDiv.style.padding = '10mm';
                tempDiv.style.fontFamily = 'Arial, sans-serif';
                tempDiv.style.fontSize = '12px';
                tempDiv.style.lineHeight = '1.6';
                tempDiv.style.color = '#000';
                document.body.appendChild(tempDiv);

                // Use html2canvas if available
                if (window.html2canvas) {
                    const canvas = await html2canvas(tempDiv, {
                        scale: 2,
                        useCORS: true,
                        backgroundColor: '#ffffff'
                    });

                    const imgData = canvas.toDataURL('image/png');
                    const imgWidth = doc.internal.pageSize.getWidth();
                    const imgHeight = (canvas.height * imgWidth) / canvas.width;

                    let heightLeft = imgHeight;
                    let position = 0;

                    doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                    heightLeft -= doc.internal.pageSize.getHeight();

                    while (heightLeft > 0) {
                        position = heightLeft - imgHeight;
                        doc.addPage();
                        doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                        heightLeft -= doc.internal.pageSize.getHeight();
                    }
                } else {
                    // Fallback: simple text extraction
                    const text = tempDiv.textContent || tempDiv.innerText;
                    const lines = doc.splitTextToSize(text, doc.internal.pageSize.getWidth() - 20);
                    doc.text(lines, 10, 10);
                }

                document.body.removeChild(tempDiv);

                doc.save('markdown.pdf');
                showNotification('Markdown converted to PDF!');

            } catch (error) {
                console.error('Markdown to PDF error:', error);
                showNotification('Error converting. Install html2canvas for better results.', 'error');
            } finally {
                hideLoading();
            }
        });

        function convertMarkdownToHTML(markdown) {
            let html = markdown;

            // Headers
            html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
            html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
            html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

            // Bold
            html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

            // Italic
            html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

            // Code blocks
            html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');

            // Inline code
            html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

            // Links
            html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

            // Lists
            html = html.replace(/^\- (.*$)/gim, '<li>$1</li>');
            html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

            // Line breaks
            html = html.replace(/\n\n/g, '</p><p>');
            html = '<p>' + html + '</p>';

            // Clean up
            html = html.replace(/<p><h/g, '<h');
            html = html.replace(/<\/h([1-6])><\/p>/g, '</h$1>');
            html = html.replace(/<p><ul>/g, '<ul>');
            html = html.replace(/<\/ul><\/p>/g, '</ul>');
            html = html.replace(/<p><pre>/g, '<pre>');
            html = html.replace(/<\/pre><\/p>/g, '</pre>');

            return html;
        }
    }
})();
