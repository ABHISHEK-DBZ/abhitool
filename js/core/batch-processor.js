// Batch Processing Queue System
class BatchProcessor {
    constructor() {
        this.queue = [];
        this.processing = [];
        this.completed = [];
        this.failed = [];
        this.maxConcurrent = 3;
        this.callbacks = {};
    }

    addJob(file, operation, options = {}) {
        const job = {
            id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            file,
            operation,
            options,
            status: 'pending',
            progress: 0,
            result: null,
            error: null,
            startTime: null,
            endTime: null
        };

        this.queue.push(job);
        this.processNext();
        return job.id;
    }

    async processNext() {
        if (this.processing.length >= this.maxConcurrent) return;
        if (this.queue.length === 0) {
            if (this.processing.length === 0) {
                this.onAllComplete();
            }
            return;
        }

        const job = this.queue.shift();
        this.processing.push(job);
        job.status = 'processing';
        job.startTime = Date.now();

        this.onJobStart(job);

        try {
            const result = await this.executeJob(job);
            job.result = result;
            job.status = 'completed';
            job.endTime = Date.now();
            job.progress = 100;

            this.processing = this.processing.filter(j => j.id !== job.id);
            this.completed.push(job);
            this.onJobComplete(job);

        } catch (error) {
            job.error = error.message;
            job.status = 'failed';
            job.endTime = Date.now();

            this.processing = this.processing.filter(j => j.id !== job.id);
            this.failed.push(job);
            this.onJobFailed(job);
        }

        this.processNext();
    }

    async executeJob(job) {
        const { file, operation, options } = job;

        // Progress callback
        const updateProgress = (progress) => {
            job.progress = progress;
            this.onJobProgress(job);
        };

        // Execute the operation
        if (typeof operation === 'function') {
            return await operation(file, options, updateProgress);
        }

        throw new Error('Invalid operation');
    }

    onJobStart(job) {
        if (this.callbacks.onJobStart) {
            this.callbacks.onJobStart(job);
        }
    }

    onJobProgress(job) {
        if (this.callbacks.onJobProgress) {
            this.callbacks.onJobProgress(job);
        }
    }

    onJobComplete(job) {
        if (this.callbacks.onJobComplete) {
            this.callbacks.onJobComplete(job);
        }
    }

    onJobFailed(job) {
        if (this.callbacks.onJobFailed) {
            this.callbacks.onJobFailed(job);
        }
    }

    onAllComplete() {
        if (this.callbacks.onAllComplete) {
            this.callbacks.onAllComplete({
                total: this.completed.length + this.failed.length,
                completed: this.completed.length,
                failed: this.failed.length
            });
        }
    }

    on(event, callback) {
        this.callbacks[event] = callback;
    }

    getStatus() {
        return {
            pending: this.queue.length,
            processing: this.processing.length,
            completed: this.completed.length,
            failed: this.failed.length,
            total: this.queue.length + this.processing.length + this.completed.length + this.failed.length
        };
    }

    clear() {
        this.queue = [];
        this.processing = [];
        this.completed = [];
        this.failed = [];
    }

    cancel(jobId) {
        this.queue = this.queue.filter(j => j.id !== jobId);
    }
}

// Global batch processor instance
window.batchProcessor = new BatchProcessor();

// Batch UI Component
class BatchUI {
    constructor() {
        this.container = null;
        this.init();
    }

    init() {
        // Create batch processing modal
        const modal = document.createElement('div');
        modal.id = 'batch-modal';
        modal.className = 'batch-modal';
        modal.innerHTML = `
            <div class="batch-modal-content">
                <div class="batch-modal-header">
                    <h3>Batch Processing</h3>
                    <button class="batch-close-btn" onclick="batchUI.hide()">×</button>
                </div>
                <div class="batch-modal-body">
                    <div class="batch-stats">
                        <div class="batch-stat">
                            <span class="batch-stat-number" id="batch-total">0</span>
                            <span class="batch-stat-label">Total</span>
                        </div>
                        <div class="batch-stat">
                            <span class="batch-stat-number" id="batch-processing">0</span>
                            <span class="batch-stat-label">Processing</span>
                        </div>
                        <div class="batch-stat">
                            <span class="batch-stat-number" id="batch-completed">0</span>
                            <span class="batch-stat-label">Completed</span>
                        </div>
                        <div class="batch-stat">
                            <span class="batch-stat-number" id="batch-failed">0</span>
                            <span class="batch-stat-label">Failed</span>
                        </div>
                    </div>
                    <div class="batch-progress-container">
                        <div class="batch-progress-bar" id="batch-progress-bar"></div>
                    </div>
                    <div class="batch-jobs-list" id="batch-jobs-list"></div>
                </div>
                <div class="batch-modal-footer">
                    <button class="btn-primary" onclick="batchUI.downloadAll()" id="batch-download-btn" disabled>
                        Download All
                    </button>
                    <button class="btn-secondary" onclick="batchUI.clear()">Clear</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        this.container = modal;

        // Setup event listeners
        this.setupListeners();
    }

    setupListeners() {
        window.batchProcessor.on('onJobStart', (job) => this.onJobStart(job));
        window.batchProcessor.on('onJobProgress', (job) => this.onJobProgress(job));
        window.batchProcessor.on('onJobComplete', (job) => this.onJobComplete(job));
        window.batchProcessor.on('onJobFailed', (job) => this.onJobFailed(job));
        window.batchProcessor.on('onAllComplete', (stats) => this.onAllComplete(stats));
    }

    show() {
        this.container.classList.add('active');
    }

    hide() {
        this.container.classList.remove('active');
    }

    updateStats() {
        const status = window.batchProcessor.getStatus();
        document.getElementById('batch-total').textContent = status.total;
        document.getElementById('batch-processing').textContent = status.processing;
        document.getElementById('batch-completed').textContent = status.completed;
        document.getElementById('batch-failed').textContent = status.failed;

        const progress = status.total > 0 ? (status.completed / status.total) * 100 : 0;
        document.getElementById('batch-progress-bar').style.width = `${progress}%`;

        if (status.completed > 0) {
            document.getElementById('batch-download-btn').disabled = false;
        }
    }

    onJobStart(job) {
        const jobEl = document.createElement('div');
        jobEl.id = `job-${job.id}`;
        jobEl.className = 'batch-job-item';
        jobEl.innerHTML = `
            <div class="batch-job-info">
                <span class="batch-job-name">${job.file.name}</span>
                <span class="batch-job-status">Processing...</span>
            </div>
            <div class="batch-job-progress">
                <div class="batch-job-progress-bar" style="width: 0%"></div>
            </div>
        `;
        document.getElementById('batch-jobs-list').appendChild(jobEl);
        this.updateStats();
        this.show();
    }

    onJobProgress(job) {
        const jobEl = document.getElementById(`job-${job.id}`);
        if (jobEl) {
            const progressBar = jobEl.querySelector('.batch-job-progress-bar');
            progressBar.style.width = `${job.progress}%`;
        }
    }

    onJobComplete(job) {
        const jobEl = document.getElementById(`job-${job.id}`);
        if (jobEl) {
            jobEl.classList.add('completed');
            jobEl.querySelector('.batch-job-status').textContent = 'Completed ✓';
            jobEl.querySelector('.batch-job-progress-bar').style.width = '100%';
        }
        this.updateStats();
    }

    onJobFailed(job) {
        const jobEl = document.getElementById(`job-${job.id}`);
        if (jobEl) {
            jobEl.classList.add('failed');
            jobEl.querySelector('.batch-job-status').textContent = `Failed: ${job.error}`;
        }
        this.updateStats();
    }

    onAllComplete(stats) {
        showNotification(`Batch complete! ${stats.completed} succeeded, ${stats.failed} failed`);
    }

    async downloadAll() {
        const completed = window.batchProcessor.completed;
        if (completed.length === 0) return;

        if (completed.length === 1) {
            // Single file - direct download
            downloadFile(completed[0].result, completed[0].file.name);
        } else {
            // Multiple files - create ZIP
            showLoading('Creating ZIP archive...');
            try {
                const zip = new JSZip();
                completed.forEach((job, index) => {
                    const filename = job.file.name.replace(/\.[^/.]+$/, '') + '_processed' + (job.options.extension || '.pdf');
                    zip.file(filename, job.result);
                });
                const blob = await zip.generateAsync({ type: 'blob' });
                downloadFile(blob, 'batch_processed.zip');
                showNotification('All files downloaded as ZIP!');
            } catch (error) {
                showNotification('Error creating ZIP', 'error');
            } finally {
                hideLoading();
            }
        }
    }

    clear() {
        window.batchProcessor.clear();
        document.getElementById('batch-jobs-list').innerHTML = '';
        this.updateStats();
        document.getElementById('batch-download-btn').disabled = true;
    }
}

// Initialize batch UI
window.batchUI = new BatchUI();
