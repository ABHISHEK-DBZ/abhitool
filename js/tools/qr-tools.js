// QR Code Tools - Generator and Scanner
(() => {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initQRTools);
    } else {
        initQRTools();
    }

    function initQRTools() {
        const container = document.getElementById('qr-tools');
        if (!container) return;

        // Create or get tool card
        let toolCard = container.querySelector('.tool-card');
        if (!toolCard) {
            toolCard = document.createElement('div');
            toolCard.className = 'tool-card';
            container.appendChild(toolCard);
        }

        toolCard.innerHTML = `
            <h3 class="tool-title">QR Code Tools</h3>
            <p class="tool-description">Generate and scan QR codes instantly</p>
            
            <div class="tabs">
                <button class="tab-btn active" data-tab="generate">Generate</button>
                <button class="tab-btn" data-tab="scan">Scan</button>
            </div>
            
            <div class="tab-content active" id="tab-generate">
                <div class="input-group">
                    <label for="qr-text">Text or URL</label>
                    <input type="text" id="qr-text" class="text-input" placeholder="Enter text or URL here...">
                </div>
                
                <div class="options-grid">
                    <div class="option-group">
                        <label for="qr-size">Size</label>
                        <select id="qr-size" class="select-input">
                            <option value="128">Small (128px)</option>
                            <option value="256" selected>Medium (256px)</option>
                            <option value="512">Large (512px)</option>
                        </select>
                    </div>
                    <div class="option-group">
                        <label for="qr-color">Color</label>
                        <input type="color" id="qr-color" class="text-input" value="#000000">
                    </div>
                    <div class="option-group">
                        <label for="qr-bg-color">Background</label>
                        <input type="color" id="qr-bg-color" class="text-input" value="#ffffff">
                    </div>
                </div>
                
                <button id="generate-qr-btn" class="btn-primary">Generate QR Code</button>
                
                <div id="qr-preview" style="margin-top: 2rem; text-align: center; min-height: 256px; display: flex; align-items: center; justify-content: center; background: var(--bg-tertiary); border-radius: 8px;">
                    <p style="color: var(--text-secondary);">QR code will appear here</p>
                </div>
                
                <button id="download-qr-btn" class="btn-secondary" style="margin-top: 1rem; width: 100%; display: none;">Download PNG</button>
            </div>
            
            <div class="tab-content" id="tab-scan">
                <div class="upload-zone" id="scan-upload-zone">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M3 9a2 2 0 0 1 2-2h.93a2 2 0 0 0 1.664-.89l.812-1.22A2 2 0 0 1 10.07 4h3.86a2 2 0 0 1 1.664.89l.812 1.22A2 2 0 0 0 18.07 7H19a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z"/>
                        <path d="M15 13a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"/>
                    </svg>
                    <p>Upload QR Code Image</p>
                    <span>PNG, JPG, JPEG, WebP</span>
                    <input type="file" id="scan-file-input" accept="image/*" hidden>
                </div>
                
                <div id="scan-result" style="margin-top: 1.5rem; display: none;">
                    <label>Scanned Content:</label>
                    <div style="display: flex; gap: 0.5rem;">
                        <input type="text" id="scan-result-text" class="text-input" readonly>
                        <button id="copy-scan-btn" class="btn-secondary" style="width: auto;">Copy</button>
                    </div>
                </div>
            </div>
        `;

        // Elements
        const tabs = toolCard.querySelectorAll('.tab-btn');
        const contents = toolCard.querySelectorAll('.tab-content');
        const qrText = document.getElementById('qr-text');
        const qrSize = document.getElementById('qr-size');
        const qrColor = document.getElementById('qr-color');
        const qrBgColor = document.getElementById('qr-bg-color');
        const generateBtn = document.getElementById('generate-qr-btn');
        const qrPreview = document.getElementById('qr-preview');
        const downloadBtn = document.getElementById('download-qr-btn');
        const scanUploadZone = document.getElementById('scan-upload-zone');
        const scanFileInput = document.getElementById('scan-file-input');
        const scanResult = document.getElementById('scan-result');
        const scanResultText = document.getElementById('scan-result-text');
        const copyScanBtn = document.getElementById('copy-scan-btn');

        let currentQRDataURL = null;

        // Tab switching
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                contents.forEach(c => c.classList.remove('active'));
                tab.classList.add('active');
                document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
            });
        });

        // Generate QR Code
        generateBtn.addEventListener('click', async () => {
            const text = qrText.value.trim();
            if (!text) {
                showNotification('Please enter text or URL', 'error');
                return;
            }

            // Check if QRCode library is loaded
            if (typeof QRCode === 'undefined') {
                showNotification('QRCode library is loading... Please wait a moment and try again.', 'error');
                console.error('QRCode library not loaded yet');
                return;
            }

            try {
                qrPreview.innerHTML = '';

                // Create a temporary container for the library to render into
                const tempContainer = document.createElement('div');

                // Use the QRCode constructor (qrcodejs style)
                // This library renders directly into the container
                new QRCode(tempContainer, {
                    text: text,
                    width: parseInt(qrSize.value),
                    height: parseInt(qrSize.value),
                    colorDark: qrColor.value,
                    colorLight: qrBgColor.value,
                    correctLevel: QRCode.CorrectLevel.H
                });

                // The library creates an img or canvas. Let's get it.
                // Wait a tick for rendering
                setTimeout(() => {
                    const img = tempContainer.querySelector('img');
                    const canvas = tempContainer.querySelector('canvas');

                    if (img) {
                        img.style.maxWidth = '100%';
                        img.style.borderRadius = '8px';
                        img.style.boxShadow = 'var(--shadow-md)';
                        qrPreview.appendChild(img);
                        currentQRDataURL = img.src;
                        downloadBtn.style.display = 'block';
                        showNotification('QR code generated!');
                    } else if (canvas) {
                        currentQRDataURL = canvas.toDataURL('image/png');
                        const newImg = document.createElement('img');
                        newImg.src = currentQRDataURL;
                        newImg.style.maxWidth = '100%';
                        newImg.style.borderRadius = '8px';
                        newImg.style.boxShadow = 'var(--shadow-md)';
                        qrPreview.appendChild(newImg);
                        downloadBtn.style.display = 'block';
                        showNotification('QR code generated!');
                    } else {
                        showNotification('Error rendering QR code', 'error');
                    }
                }, 50);

            } catch (error) {
                console.error('QR generation error:', error);
                // Fallback to API if local library fails
                try {
                    const apiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize.value}x${qrSize.value}&data=${encodeURIComponent(text)}&color=${qrColor.value.substring(1)}&bgcolor=${qrBgColor.value.substring(1)}`;
                    qrPreview.innerHTML = `<img src="${apiUrl}" alt="QR Code" style="max-width: 100%; border-radius: 8px; box-shadow: var(--shadow-md);">`;
                    currentQRDataURL = apiUrl; // Note: Download might not work due to CORS with this API
                    downloadBtn.style.display = 'block';
                    showNotification('QR code generated (via API)!');
                } catch (e) {
                    showNotification('Error generating QR code', 'error');
                }
            }
        });

        // Download QR Code
        downloadBtn.addEventListener('click', () => {
            if (!currentQRDataURL) return;

            // If it's a data URL, we can download directly
            if (currentQRDataURL.startsWith('data:')) {
                const link = document.createElement('a');
                link.download = 'qrcode.png';
                link.href = currentQRDataURL;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                showNotification('QR code downloaded!');
            } else {
                // If it's an external URL (API fallback), try to fetch and blob it
                fetch(currentQRDataURL)
                    .then(res => res.blob())
                    .then(blob => {
                        const url = window.URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.download = 'qrcode.png';
                        link.href = url;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        window.URL.revokeObjectURL(url);
                        showNotification('QR code downloaded!');
                    })
                    .catch(() => {
                        window.open(currentQRDataURL, '_blank');
                        showNotification('Opened in new tab (save from there)');
                    });
            }
        });

        // Scan QR Code
        scanUploadZone.addEventListener('click', () => scanFileInput.click());

        scanFileInput.addEventListener('change', async (e) => {
            if (e.target.files.length === 0) return;

            const file = e.target.files[0];

            if (typeof jsQR === 'undefined') {
                showNotification('Scanner library loading...', 'error');
                return;
            }

            showLoading('Scanning...');

            try {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const img = new Image();
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        const context = canvas.getContext('2d');
                        canvas.width = img.width;
                        canvas.height = img.height;
                        context.drawImage(img, 0, 0);
                        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

                        const code = jsQR(imageData.data, imageData.width, imageData.height);

                        if (code) {
                            scanResultText.value = code.data;
                            scanResult.style.display = 'block';
                            showNotification('QR Code found!');
                        } else {
                            showNotification('No QR code found in image', 'error');
                        }
                        hideLoading();
                    };
                    img.src = event.target.result;
                };
                reader.readAsDataURL(file);
            } catch (error) {
                console.error('Scan error:', error);
                showNotification('Error scanning image', 'error');
                hideLoading();
            }
        });

        copyScanBtn.addEventListener('click', () => {
            scanResultText.select();
            document.execCommand('copy');
            showNotification('Copied to clipboard!');
        });
    }
})();
