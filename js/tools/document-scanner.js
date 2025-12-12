// Document Scanner Tool
(() => {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initScanner);
    } else {
        initScanner();
    }

    function initScanner() {
        const container = document.getElementById('document-scanner');
        if (!container) return;

        if (!container.querySelector('.tool-card')) {
            container.innerHTML = `
                <div class="tool-card">
                    <h3 class="tool-title">Document Scanner</h3>
                    <p class="tool-description">Scan documents using your camera</p>
                    
                    <div class="scanner-container" style="position: relative; background: #000; border-radius: 8px; overflow: hidden; min-height: 400px; display: flex; align-items: center; justify-content: center;">
                        <video id="scanner-video" autoplay playsinline style="width: 100%; max-height: 500px; object-fit: cover;"></video>
                        <canvas id="scanner-canvas" style="display: none;"></canvas>
                        
                        <div id="camera-placeholder" style="position: absolute; color: white; text-align: center;">
                            <p>Camera inactive</p>
                            <button id="start-camera-btn" class="btn-primary">Start Camera</button>
                        </div>
                    </div>

                    <div class="scanner-controls" style="margin-top: 1.5rem; display: flex; gap: 1rem; justify-content: center;">
                        <button id="capture-btn" class="btn-primary" disabled>Capture</button>
                        <button id="stop-camera-btn" class="btn-secondary" disabled>Stop</button>
                    </div>

                    <div id="scanned-preview" style="margin-top: 2rem; display: none;">
                        <h4>Scanned Document</h4>
                        <img id="scanned-image" style="max-width: 100%; border-radius: 8px; margin-top: 1rem; box-shadow: var(--shadow-md);">
                        <div style="margin-top: 1rem; display: flex; gap: 1rem;">
                            <button id="download-scan-btn" class="btn-primary">Download Image</button>
                            <button id="retake-btn" class="btn-secondary">Retake</button>
                        </div>
                    </div>
                </div>
            `;
        }

        const video = document.getElementById('scanner-video');
        const canvas = document.getElementById('scanner-canvas');
        const startBtn = document.getElementById('start-camera-btn');
        const stopBtn = document.getElementById('stop-camera-btn');
        const captureBtn = document.getElementById('capture-btn');
        const placeholder = document.getElementById('camera-placeholder');
        const previewSection = document.getElementById('scanned-preview');
        const scannedImage = document.getElementById('scanned-image');
        const downloadBtn = document.getElementById('download-scan-btn');
        const retakeBtn = document.getElementById('retake-btn');

        let stream = null;

        startBtn.addEventListener('click', async () => {
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment' }
                });
                video.srcObject = stream;
                placeholder.style.display = 'none';
                startBtn.disabled = true;
                stopBtn.disabled = false;
                captureBtn.disabled = false;
                showNotification('Camera started');
            } catch (err) {
                console.error('Camera error:', err);
                showNotification('Could not access camera', 'error');
            }
        });

        stopBtn.addEventListener('click', stopCamera);

        function stopCamera() {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
                video.srcObject = null;
                stream = null;
                placeholder.style.display = 'block';
                startBtn.disabled = false;
                stopBtn.disabled = true;
                captureBtn.disabled = true;
            }
        }

        captureBtn.addEventListener('click', () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            canvas.getContext('2d').drawImage(video, 0, 0);

            const dataUrl = canvas.toDataURL('image/jpeg');
            scannedImage.src = dataUrl;
            previewSection.style.display = 'block';
            stopCamera();
        });

        retakeBtn.addEventListener('click', () => {
            previewSection.style.display = 'none';
            startBtn.click();
        });

        downloadBtn.addEventListener('click', () => {
            const link = document.createElement('a');
            link.download = `scan_${Date.now()}.jpg`;
            link.href = scannedImage.src;
            link.click();
        });
    }
})();
