// PDF Form Filling Tool
(() => {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPDFFormFilling);
    } else {
        initPDFFormFilling();
    }

    function initPDFFormFilling() {
        const container = document.getElementById('pdf-form-filling');
        if (!container) return;

        // Create or get tool card


        let toolCard = container.querySelector('.tool-card');


        if (!toolCard) {


            toolCard = document.createElement('div');


            toolCard.className = 'tool-card';


            container.appendChild(toolCard);


        }

        toolCard.innerHTML = `
            <h3 class="tool-title">PDF Form Filling</h3>
            <p class="tool-description">Fill out PDF forms programmatically</p>
            
            <div class="upload-zone" id="form-upload-zone">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <p>Upload PDF form</p>
                <span>PDF files only</span>
                <input type="file" id="form-file-input" accept=".pdf" hidden>
            </div>
            
            <div id="form-fields-container" style="display: none;">
                <div style="background: var(--bg-secondary); padding: 1.5rem; border-radius: var(--radius-lg); margin: 1.5rem 0;">
                    <h4 style="margin-bottom: 1rem; color: var(--primary);">Detected Form Fields:</h4>
                    <div id="form-fields-list"></div>
                </div>
                
                <button id="fill-form-btn" class="btn-primary">Fill & Download Form</button>
            </div>
            
            <div style="background: var(--bg-tertiary); padding: 1rem; border-radius: 8px; margin-top: 1rem;">
                <p style="font-size: 0.875rem; color: var(--text-secondary);">
                    💡 <strong>Note:</strong> This tool works with interactive PDF forms (AcroForms). 
                    If no fields are detected, the PDF may not contain fillable forms.
                </p>
            </div>
        `;

        const fileInput = document.getElementById('form-file-input');
        const uploadZone = document.getElementById('form-upload-zone');
        const fieldsContainer = document.getElementById('form-fields-container');
        const fieldsList = document.getElementById('form-fields-list');
        const fillBtn = document.getElementById('fill-form-btn');

        let pdfFile = null;
        let formFields = [];

        uploadZone.addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', async (e) => {
            if (e.target.files.length === 0) return;

            pdfFile = e.target.files[0];
            showLoading('Analyzing PDF form...');

            try {
                const { PDFDocument } = PDFLib;
                const arrayBuffer = await pdfFile.arrayBuffer();
                const pdfDoc = await PDFDocument.load(arrayBuffer);

                const form = pdfDoc.getForm();
                const fields = form.getFields();

                if (fields.length === 0) {
                    showNotification('No form fields detected in this PDF', 'error');
                    hideLoading();
                    return;
                }

                formFields = [];
                fieldsList.innerHTML = '';

                fields.forEach((field, index) => {
                    const fieldName = field.getName();
                    const fieldType = field.constructor.name;

                    formFields.push({ field, name: fieldName, type: fieldType });

                    const fieldItem = document.createElement('div');
                    fieldItem.className = 'option-group';
                    fieldItem.style.marginBottom = '1rem';

                    let inputHTML = '';

                    if (fieldType.includes('Text')) {
                        inputHTML = `<input type="text" id="field-${index}" class="text-input" placeholder="Enter value">`;
                    } else if (fieldType.includes('CheckBox')) {
                        inputHTML = `<input type="checkbox" id="field-${index}" style="width: 20px; height: 20px;">`;
                    } else if (fieldType.includes('Dropdown') || fieldType.includes('Option')) {
                        inputHTML = `<input type="text" id="field-${index}" class="text-input" placeholder="Enter value">`;
                    } else {
                        inputHTML = `<input type="text" id="field-${index}" class="text-input" placeholder="Enter value">`;
                    }

                    fieldItem.innerHTML = `
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">
                            ${fieldName}
                            <span style="font-size: 0.75rem; color: var(--text-tertiary); font-weight: normal;">(${fieldType})</span>
                        </label>
                        ${inputHTML}
                    `;

                    fieldsList.appendChild(fieldItem);
                });

                fieldsContainer.style.display = 'block';
                uploadZone.style.display = 'none';
                showNotification(`Found ${fields.length} form fields!`);

            } catch (error) {
                console.error('Form analysis error:', error);
                showNotification('Error analyzing PDF form', 'error');
            } finally {
                hideLoading();
            }
        });

        fillBtn.addEventListener('click', async () => {
            if (!pdfFile || formFields.length === 0) return;

            showLoading('Filling form...');

            try {
                const { PDFDocument } = PDFLib;
                const arrayBuffer = await pdfFile.arrayBuffer();
                const pdfDoc = await PDFDocument.load(arrayBuffer);
                const form = pdfDoc.getForm();

                formFields.forEach((fieldData, index) => {
                    const input = document.getElementById(`field-${index}`);
                    const value = input.type === 'checkbox' ? input.checked : input.value;

                    if (!value && input.type !== 'checkbox') return;

                    try {
                        const field = fieldData.field;

                        if (fieldData.type.includes('Text')) {
                            field.setText(value.toString());
                        } else if (fieldData.type.includes('CheckBox')) {
                            if (value) {
                                field.check();
                            } else {
                                field.uncheck();
                            }
                        } else if (fieldData.type.includes('Dropdown')) {
                            field.select(value.toString());
                        }
                    } catch (err) {
                        console.warn(`Could not fill field ${fieldData.name}:`, err);
                    }
                });

                // Flatten form (make fields non-editable)
                // form.flatten();

                const pdfBytes = await pdfDoc.save();
                const blob = new Blob([pdfBytes], { type: 'application/pdf' });
                downloadFile(blob, 'filled_form.pdf');
                showNotification('Form filled successfully!');

            } catch (error) {
                console.error('Form filling error:', error);
                showNotification('Error filling form', 'error');
            } finally {
                hideLoading();
            }
        });
    }
})();
