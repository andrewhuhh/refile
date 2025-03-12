const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const imagesGrid = document.getElementById('imagesGrid');
const downloadAllBtn = document.getElementById('downloadAll');
const clearAllBtn = document.getElementById('clearAll');
const formatSelect = document.getElementById('format');
const qualitySelect = document.getElementById('quality');
const addMoreBtn = document.getElementById('addMoreBtn');

// Initially hide the imagesGrid
imagesGrid.style.display = 'none';

// Detect if user is on mobile
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

// Update download all button text for mobile users
if (isMobile) {
    downloadAllBtn.innerHTML = '<i class="fas fa-download"></i> Download All as ZIP <span style="font-size: 0.8em; display: block; opacity: 0.8">You may need a file extractor app to open ZIP files on mobile</span>';
}

// Handle clear all button click
clearAllBtn.addEventListener('click', () => {
    const imageItems = Array.from(imagesGrid.children);
    
    // Trigger fade out animation for all items
    imageItems.forEach(item => {
        item.style.animation = 'fadeOut 0.3s ease';
    });
    
    // Remove all items after animation
    setTimeout(() => {
        imagesGrid.innerHTML = '';
        downloadAllBtn.style.display = 'none';
        clearAllBtn.style.display = 'none';
        imagesGrid.style.display = 'none';
        dropZone.style.display = 'block';
        addMoreBtn.style.display = 'none';
        updateDownloadButtonText();
    }, 300);
});

// Handle add more button click
addMoreBtn.addEventListener('click', () => fileInput.click());

// Handle drag and drop
dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = 'var(--primary)';
    dropZone.style.background = 'white';
});
dropZone.addEventListener('dragleave', () => {
    dropZone.style.borderColor = 'var(--border)';
    dropZone.style.background = 'var(--bg-light)';
});
dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = 'var(--border)';
    dropZone.style.background = 'var(--bg-light)';
    handleFiles(e.dataTransfer.files);
});

fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

function updateDownloadButtonText() {
    const imageCount = imagesGrid.children.length;
    const baseText = isMobile ? 'Download All as ZIP' : 'Download All';
    const countText = `${baseText} (${imageCount} ${imageCount === 1 ? 'image' : 'images'})`;
    
    if (isMobile) {
        downloadAllBtn.innerHTML = `<i class="fas fa-download"></i> ${countText} <span style="font-size: 0.8em; display: block; opacity: 0.8">You may need a file extractor app to open ZIP files on mobile</span>`;
    } else {
        downloadAllBtn.innerHTML = `<i class="fas fa-download"></i> ${countText}`;
    }
}

function updateCompressionButtonText(downloadBtn) {
    const format = formatSelect.value.toUpperCase();
    downloadBtn.innerHTML = `<i class="fas fa-download"></i> ${format}`;
}

async function calculateCompressedSize(img, format, quality) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    ctx.drawImage(img, 0, 0);
    
    const blob = await new Promise(resolve => {
        canvas.toBlob(resolve, `image/${format}`, quality);
    });
    
    return blob.size;
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

async function updateFileSizeInfo(imageItem, img) {
    const fileSizeDiv = imageItem.querySelector('.file-size-info');
    const format = formatSelect.value;
    const quality = parseFloat(qualitySelect.value);
    
    const compressedSize = await calculateCompressedSize(img, format, quality);
    fileSizeDiv.innerHTML = `
        <div class="size-info">
            <span class="original-size">
                <i class="fas fa-file-arrow-up"></i>
                ${formatFileSize(imageItem.dataset.originalSize)}
            </span>
            <span class="compressed-size">
                <i class="fas fa-file-arrow-down"></i>
                ${formatFileSize(compressedSize)}
            </span>
        </div>
    `;
}

function handleFiles(files) {
    if (files.length > 0) {
        downloadAllBtn.style.display = 'block';
        clearAllBtn.style.display = 'block';
        imagesGrid.style.display = 'flex';
        dropZone.style.display = 'none';
        addMoreBtn.style.display = 'flex';
    }

    Array.from(files).forEach(file => {
        if (!file.type.startsWith('image/')) {
            alert(`File "${file.name}" is not an image. Please upload only image files.`);
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const imageItem = document.createElement('div');
            imageItem.className = 'image-item';
            imageItem.dataset.originalSize = file.size;
            imageItem.dataset.downloadHistory = '[]';
            
            const previewWrapper = document.createElement('div');
            previewWrapper.className = 'image-preview-wrapper';
            
            const img = document.createElement('img');
            img.src = e.target.result;
            img.className = 'image-preview';
            
            const fileSizeDiv = document.createElement('div');
            fileSizeDiv.className = 'file-size-info';
            
            const downloadHistoryDiv = document.createElement('div');
            downloadHistoryDiv.className = 'download-history';
            
            const inputRow = document.createElement('div');
            inputRow.className = 'input-row';
            
            const nameInput = document.createElement('input');
            nameInput.type = 'text';
            nameInput.className = 'filename-input';
            nameInput.value = file.name.split('.')[0];
            nameInput.placeholder = 'Enter file name';
            
            const downloadBtn = document.createElement('button');
            downloadBtn.className = 'btn download-btn';
            updateCompressionButtonText(downloadBtn);
            
            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-btn';
            removeBtn.innerHTML = '<i class="fas fa-times"></i>';
            removeBtn.title = 'Remove image';
            removeBtn.onclick = () => {
                imageItem.style.animation = 'fadeOut 0.3s ease';
                setTimeout(() => {
                    imageItem.remove();
                    if (imagesGrid.children.length === 0) {
                        downloadAllBtn.style.display = 'none';
                        clearAllBtn.style.display = 'none';
                        imagesGrid.style.display = 'none';
                        dropZone.style.display = 'block';
                        addMoreBtn.style.display = 'none';
                    }
                    updateDownloadButtonText();
                }, 300);
            };

            downloadBtn.onclick = async () => {
                downloadBtn.classList.add('loading');
                downloadBtn.disabled = true;
                await compressAndDownload(img, nameInput.value);
                
                // Update download history
                const history = JSON.parse(imageItem.dataset.downloadHistory);
                const downloadInfo = {
                    timestamp: new Date().toLocaleTimeString(),
                    format: formatSelect.value.toUpperCase(),
                    quality: qualitySelect.options[qualitySelect.selectedIndex].text.split(' ')[0]
                };
                history.push(downloadInfo);
                imageItem.dataset.downloadHistory = JSON.stringify(history);
                
                // Update download history display
                const lastDownload = history[history.length - 1];
                downloadHistoryDiv.innerHTML = `
                    <div class="last-download">
                        <i class="fas fa-check-circle"></i>
                        ${lastDownload.format} - ${lastDownload.quality}
                        <span class="download-time">${lastDownload.timestamp}</span>
                    </div>
                `;
                
                downloadBtn.classList.remove('loading');
                downloadBtn.disabled = false;
                
                // Update file size info after compression settings change
                await updateFileSizeInfo(imageItem, img);
            };

            inputRow.appendChild(nameInput);
            inputRow.appendChild(downloadBtn);

            imageItem.appendChild(removeBtn);
            imageItem.appendChild(previewWrapper);
            imageItem.appendChild(inputRow);
            imageItem.appendChild(downloadHistoryDiv);
            
            previewWrapper.appendChild(img);
            previewWrapper.appendChild(fileSizeDiv);
            
            // Add fade-in animation
            imageItem.style.animation = 'fadeIn 0.3s ease';
            imagesGrid.appendChild(imageItem);
            
            // Initialize file size info
            img.onload = async () => {
                await updateFileSizeInfo(imageItem, img);
            };
            
            updateDownloadButtonText();
        };
        reader.readAsDataURL(file);
    });
}

// Update format and quality change listeners to also update file sizes
formatSelect.addEventListener('change', async () => {
    const items = imagesGrid.querySelectorAll('.image-item');
    items.forEach(async (item) => {
        const img = item.querySelector('img');
        const btn = item.querySelector('.btn');
        updateCompressionButtonText(btn);
        await updateFileSizeInfo(item, img);
    });
});

qualitySelect.addEventListener('change', async () => {
    const items = imagesGrid.querySelectorAll('.image-item');
    items.forEach(async (item) => {
        const img = item.querySelector('img');
        const btn = item.querySelector('.btn');
        updateCompressionButtonText(btn);
        await updateFileSizeInfo(item, img);
    });
});

async function compressAndDownload(img, fileName) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    
    ctx.drawImage(img, 0, 0);
    
    const format = formatSelect.value;
    const quality = parseFloat(qualitySelect.value);
    
    const blob = await new Promise(resolve => {
        canvas.toBlob(resolve, `image/${format}`, quality);
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

downloadAllBtn.addEventListener('click', async () => {
    if (isMobile) {
        // Show mobile-friendly confirmation
        const shouldUseZip = confirm(
            'Would you like to download as a ZIP file?\n\n' +
            'Note: You may need a file extractor app to open ZIP files on your device.\n\n' +
            'Select "Cancel" to download files individually instead.'
        );

        if (!shouldUseZip) {
            // Download files individually with a small delay between each
            const imageItems = imagesGrid.querySelectorAll('.image-item');
            downloadAllBtn.classList.add('loading');
            downloadAllBtn.disabled = true;

            for (const item of imageItems) {
                const img = item.querySelector('img');
                const nameInput = item.querySelector('.filename-input');
                await compressAndDownload(img, nameInput.value);
                // Small delay between downloads to prevent browser issues
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            downloadAllBtn.classList.remove('loading');
            downloadAllBtn.disabled = false;
            return;
        }
    }

    // Original ZIP download logic
    downloadAllBtn.classList.add('loading');
    downloadAllBtn.disabled = true;

    const zip = new JSZip();
    const imageItems = imagesGrid.querySelectorAll('.image-item');
    const format = formatSelect.value;
    const quality = parseFloat(qualitySelect.value);
    
    let count = 0;
    for (const item of imageItems) {
        const img = item.querySelector('img');
        const nameInput = item.querySelector('.filename-input');
        const fileName = nameInput.value || `image_${++count}`;
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        ctx.drawImage(img, 0, 0);
        
        const blob = await new Promise(resolve => {
            canvas.toBlob(resolve, `image/${format}`, quality);
        });
        
        zip.file(`${fileName}.${format}`, blob);
    }
    
    const content = await zip.generateAsync({type: 'blob'});
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'compressed_images.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    downloadAllBtn.classList.remove('loading');
    downloadAllBtn.disabled = false;
}); 