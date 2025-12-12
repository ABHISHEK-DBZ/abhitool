// Image to DOC Converter
(() => {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initImageToDoc);
    } else {
        initImageToDoc();
    }

    function initImageToDoc() {
        const container = document.getElementById('image-to-doc');
        if (!container) return;

        if (!container.querySelector('.tool-card')) {
            container.innerHTML = `
                <div class="tool-card">
                    <h3 class="tool-title">Image to Word (DOCX)</h3>
                    <p class="tool-description">Convert images into an editable Word document</p>
                    
                    <div class="upload-zone" id="img2doc-upload-zone">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                            <line x1="16" y1="13" x2="8" y2="13"/>
                            <line x1="16" y1="17" x2="8" y2="17"/>
                            <line x1="10" y1="9" x2="8" y2="9"/>
                        </svg>
                        <p>Upload images to convert</p>
                        <span>JPG, PNG supported</span>
                        <input type="file" id="img2doc-file-input" accept="image/*" multiple hidden>
                    </div>

                    <div id="img2doc-preview" class="preview-grid" style="margin-top: 2rem;"></div>
                    
                    <button id="convert-img2doc-btn" class="btn-primary" disabled style="margin-top: 1.5rem;">Convert to Word</button>
                </div>
            `;
        }

        const fileInput = document.getElementById('img2doc-file-input');
        const uploadZone = document.getElementById('img2doc-upload-zone');
        const previewContainer = document.getElementById('img2doc-preview');
        const convertBtn = document.getElementById('convert-img2doc-btn');

        let selectedFiles = [];

        uploadZone.addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            selectedFiles = [...selectedFiles, ...files];
            updatePreview();
            convertBtn.disabled = selectedFiles.length === 0;
        });

        function updatePreview() {
            previewContainer.innerHTML = '';
            selectedFiles.forEach((file, index) => {
                const item = document.createElement('div');
                item.className = 'preview-item';
                item.innerHTML = `
                    <img src="${URL.createObjectURL(file)}" style="width: 100%; height: 100px; object-fit: cover; border-radius: 4px;">
                    <button class="remove-btn" onclick="removeImg2DocFile(${index})">×</button>
                `;
                previewContainer.appendChild(item);
            });
        }

        window.removeImg2DocFile = (index) => {
            selectedFiles.splice(index, 1);
            updatePreview();
            convertBtn.disabled = selectedFiles.length === 0;
        };

        convertBtn.addEventListener('click', async () => {
            if (selectedFiles.length === 0) return;

            showLoading('Generating Word document...');

            try {
                const { Document, Packer, Paragraph, ImageRun } = docx;

                const children = [];

                for (const file of selectedFiles) {
                    const arrayBuffer = await file.arrayBuffer();
                    const img = await loadImage(URL.createObjectURL(file));

                    // Scale image to fit page (approx 600px width)
                    const scale = Math.min(600 / img.width, 1);

                    children.push(
                        new Paragraph({
                            children: [
                                new ImageRun({
                                    data: arrayBuffer,
                                    transformation: {
                                        width: img.width * scale,
                                        height: img.height * scale,
                                    },
                                }),
                            ],
                        })
                    );
                }

                const doc = new Document({
                    sections: [{
                        properties: {},
                        children: children,
                    }],
                });

                const blob = await Packer.toBlob(doc);
                downloadFile(blob, 'images.docx');
                showNotification('Word document generated!');

                // Reset
                selectedFiles = [];
                updatePreview();
                convertBtn.disabled = true;

            } catch (error) {
                console.error('Error generating DOCX:', error);
                showNotification('Error generating document', 'error');
            } finally {
                hideLoading();
            }
        });

        function loadImage(src) {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = reject;
                img.src = src;
            });
        }
    }
})();
