// PDF Security - Password Protection and Unlock
(() => {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPDFSecurity);
    } else {
        initPDFSecurity();
    }

    function initPDFSecurity() {
        const container = document.getElementById('pdf-security');
        if (!container) return;

        // Create or get tool card


        let toolCard = container.querySelector('.tool-card');


        if (!toolCard) {


            toolCard = document.createElement('div');


            toolCard.className = 'tool-card';


            container.appendChild(toolCard);


        }

        toolCard.innerHTML = `
            <h3 class="tool-title">PDF Security</h3>
            <p class="tool-description">Protect or unlock PDF documents</p>
            
            <div class="pdf-tools-tabs">
                <button class="pdf-tool-btn active" data-tool="protect">Protect PDF</button>
                <button class="pdf-tool-btn" data-tool="unlock">Unlock PDF</button>
            </div>
            
            <!-- Protect PDF -->
            <div class="pdf-tool-content active" id="protect-pdf-tool">
                <div class="upload-zone" id="protect-upload-zone">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    <p>Upload PDF to protect</p>
                    <span>PDF files only</span>
                    <input type="file" id="protect-file-input" accept=".pdf" hidden>
                </div>
                
                <div class="options-grid" id="protect-options" style="display: none;">
                    <div class="option-group">
                        <label for="protect-password">Password</label>
                        <input type="password" id="protect-password" class="text-input" placeholder="Enter password">
                    </div>
                    <div class="option-group">
                        <label for="protect-confirm">Confirm Password</label>
                        <input type="password" id="protect-confirm" class="text-input" placeholder="Confirm password">
                    </div>
                </div>
                
                <div style="background: var(--bg-tertiary); padding: 1rem; border-radius: 8px; margin: 1rem 0; display: none;" id="protect-note">
                    <p style="font-size: 0.875rem; color: var(--text-secondary);">
                        ⚠️ <strong>Note:</strong> PDF password protection in browsers has limitations. 
                        For production use, consider server-side encryption or dedicated PDF tools.
                    </p>
                </div>
                
                <button id="protect-pdf-btn" class="btn-primary" disabled>Protect PDF</button>
            </div>
            
            <!-- Unlock PDF -->
            <div class="pdf-tool-content" id="unlock-pdf-tool">
                <div class="upload-zone" id="unlock-upload-zone">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    <p>Upload protected PDF</p>
                    <span>PDF files only</span>
                    <input type="file" id="unlock-file-input" accept=".pdf" hidden>
                </div>
                
                <div class="options-grid" id="unlock-options" style="display: none;">
                    <div class="option-group" style="grid-column: 1 / -1;">
                        <label for="unlock-password">Password</label>
                        <input type="password" id="unlock-password" class="text-input" placeholder="Enter password">
                    </div>
                </div>
                
                <button id="unlock-pdf-btn" class="btn-primary" disabled>Unlock PDF</button>
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
                document.getElementById(`${tool}-pdf-tool`).classList.add('active');
            });
        });

        // PROTECT PDF
        const protectInput = document.getElementById('protect-file-input');
        const protectZone = document.getElementById('protect-upload-zone');
        const protectOptions = document.getElementById('protect-options');
        const protectNote = document.getElementById('protect-note');
        const protectBtn = document.getElementById('protect-pdf-btn');
        const protectPassword = document.getElementById('protect-password');
        const protectConfirm = document.getElementById('protect-confirm');
        let protectPdfFile = null;

        protectZone.addEventListener('click', () => protectInput.click());

        protectInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                protectPdfFile = e.target.files[0];
                protectOptions.style.display = 'grid';
                protectNote.style.display = 'block';
                protectBtn.disabled = false;
            }
        });

        protectBtn.addEventListener('click', async () => {
            if (!protectPdfFile) return;

            const password = protectPassword.value;
            const confirm = protectConfirm.value;

            if (!password) {
                showNotification('Please enter a password', 'error');
                return;
            }

            if (password !== confirm) {
                showNotification('Passwords do not match', 'error');
                return;
            }

            showLoading('Protecting PDF...');

            try {
                const { PDFDocument } = PDFLib;
                const arrayBuffer = await protectPdfFile.arrayBuffer();
                const pdfDoc = await PDFDocument.load(arrayBuffer);

                // Note: pdf-lib doesn't support encryption directly
                // This is a placeholder - real encryption requires additional libraries
                showNotification('PDF password protection requires additional encryption libraries. Consider using server-side tools for production.', 'error');

                // For demonstration, we'll just save the PDF
                // In production, use libraries like pdf-lib with encryption support
                // or server-side tools

            } catch (error) {
                console.error('Protect PDF error:', error);
                showNotification('Error protecting PDF', 'error');
            } finally {
                hideLoading();
            }
        });

        // UNLOCK PDF
        const unlockInput = document.getElementById('unlock-file-input');
        const unlockZone = document.getElementById('unlock-upload-zone');
        const unlockOptions = document.getElementById('unlock-options');
        const unlockBtn = document.getElementById('unlock-pdf-btn');
        const unlockPassword = document.getElementById('unlock-password');
        let unlockPdfFile = null;

        unlockZone.addEventListener('click', () => unlockInput.click());

        unlockInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                unlockPdfFile = e.target.files[0];
                unlockOptions.style.display = 'grid';
                unlockBtn.disabled = false;
            }
        });

        unlockBtn.addEventListener('click', async () => {
            if (!unlockPdfFile) return;

            const password = unlockPassword.value;

            if (!password) {
                showNotification('Please enter the password', 'error');
                return;
            }

            showLoading('Unlocking PDF...');

            try {
                const { PDFDocument } = PDFLib;
                const arrayBuffer = await unlockPdfFile.arrayBuffer();

                // Try to load with password
                const pdfDoc = await PDFDocument.load(arrayBuffer, {
                    password: password,
                    ignoreEncryption: false
                });

                // Save without encryption
                const pdfBytes = await pdfDoc.save();
                const blob = new Blob([pdfBytes], { type: 'application/pdf' });
                downloadFile(blob, 'unlocked.pdf');
                showNotification('PDF unlocked successfully!');

            } catch (error) {
                console.error('Unlock PDF error:', error);
                if (error.message.includes('password')) {
                    showNotification('Incorrect password', 'error');
                } else {
                    showNotification('Error unlocking PDF. The file may not be password-protected.', 'error');
                }
            } finally {
                hideLoading();
            }
        });
    }
})();
