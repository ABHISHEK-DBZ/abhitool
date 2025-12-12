// Video Converter Tool
(() => {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initVideoConverter);
    } else {
        initVideoConverter();
    }

    function initVideoConverter() {
        const container = document.getElementById('video-converter');
        if (!container) return;

        if (!container.querySelector('.tool-card')) {
            container.innerHTML = `
                <div class="tool-card">
                    <h3 class="tool-title">Video Converter</h3>
                    <p class="tool-description">Convert video files to different formats</p>
                    
                    <div class="upload-zone" id="video-upload-zone">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <polygon points="23 7 16 12 23 17 23 7"/>
                            <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                        </svg>
                        <p>Upload video to convert</p>
                        <span>MP4, WebM, AVI supported</span>
                        <input type="file" id="video-file-input" accept="video/*" hidden>
                    </div>

                    <div id="video-options" style="display: none; margin-top: 2rem;">
                        <div class="preview-container" style="text-align: center; margin-bottom: 1.5rem;">
                            <video id="video-preview" controls style="max-width: 100%; max-height: 300px; border-radius: 8px;"></video>
                            <p id="video-info" style="color: var(--text-secondary); margin-top: 0.5rem;"></p>
                        </div>

                        <div class="options-grid">
                            <div class="option-group">
                                <label>Convert to</label>
                                <select id="video-format" class="select-input">
                                    <option value="mp4">MP4</option>
                                    <option value="webm">WebM</option>
                                    <option value="gif">GIF (Animated)</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="alert-box" style="margin-top: 1.5rem; background: rgba(255, 193, 7, 0.1); border: 1px solid rgba(255, 193, 7, 0.3); padding: 1rem; border-radius: 6px; color: #ffc107;">
                            <p><strong>Note:</strong> Browser-based video conversion is limited. For large files, please use desktop software.</p>
                        </div>

                        <button id="convert-video-btn" class="btn-primary" style="margin-top: 1.5rem;">Convert Video</button>
                    </div>
                </div>
            `;
        }

        const fileInput = document.getElementById('video-file-input');
        const uploadZone = document.getElementById('video-upload-zone');
        const options = document.getElementById('video-options');
        const preview = document.getElementById('video-preview');
        const videoInfo = document.getElementById('video-info');
        const convertBtn = document.getElementById('convert-video-btn');
        const formatSelect = document.getElementById('video-format');

        let selectedFile = null;

        uploadZone.addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                selectedFile = e.target.files[0];
                preview.src = URL.createObjectURL(selectedFile);
                videoInfo.textContent = `${selectedFile.name} (${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)`;
                options.style.display = 'block';
            }
        });

        convertBtn.addEventListener('click', () => {
            if (!selectedFile) return;

            // Placeholder for actual FFmpeg.wasm implementation
            // Since FFmpeg.wasm is heavy, we'll simulate for now or implement if requested
            showLoading('Processing video...');

            setTimeout(() => {
                showNotification('Video conversion requires FFmpeg.wasm (Coming Soon)', 'info');
                hideLoading();
            }, 2000);
        });
    }
})();
