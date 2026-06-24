import { createIcon } from './dom.js';
import { createObjectUrl, estimateCompressedSize } from './image-codec.js';
import { formatFileSize } from './format-size.js';
import { getBaseName, getOutputFormat } from './formats.js';

export function createImageCard(file, actions) {
    const imageItem = document.createElement('article');
    const previewWrapper = document.createElement('div');
    const img = document.createElement('img');
    const fileSizeDiv = document.createElement('div');
    const downloadHistoryDiv = document.createElement('div');
    const inputRow = document.createElement('div');
    const nameInput = document.createElement('input');
    const downloadBtn = document.createElement('button');
    const removeBtn = document.createElement('button');

    imageItem.className = 'image-item';
    imageItem.dataset.originalSize = String(file.size);

    previewWrapper.className = 'image-preview-wrapper';

    img.src = createObjectUrl(file);
    img.className = 'image-preview';
    img.alt = `Preview of ${file.name}`;

    fileSizeDiv.className = 'file-size-info';
    downloadHistoryDiv.className = 'download-history';
    inputRow.className = 'input-row';

    nameInput.type = 'text';
    nameInput.className = 'filename-input';
    nameInput.value = getBaseName(file.name);
    nameInput.placeholder = 'File name';
    nameInput.autocomplete = 'off';

    downloadBtn.type = 'button';
    downloadBtn.className = 'btn download-btn';

    removeBtn.type = 'button';
    removeBtn.className = 'remove-btn';
    removeBtn.title = 'Remove image';
    removeBtn.setAttribute('aria-label', `Remove ${file.name}`);
    removeBtn.appendChild(createIcon('fas fa-times'));

    inputRow.appendChild(nameInput);
    inputRow.appendChild(downloadBtn);
    previewWrapper.appendChild(img);
    previewWrapper.appendChild(fileSizeDiv);
    imageItem.appendChild(removeBtn);
    imageItem.appendChild(previewWrapper);
    imageItem.appendChild(inputRow);
    imageItem.appendChild(downloadHistoryDiv);

    const card = {
        element: imageItem,
        img,
        file,
        fileSizeDiv,
        downloadHistoryDiv,
        nameInput,
        downloadBtn,
        removeBtn,
        objectUrl: img.src
    };

    downloadBtn.addEventListener('click', () => actions.onDownload(card));
    removeBtn.addEventListener('click', () => actions.onRemove(card));

    updateCompressionButtonText(card, actions.getOutputKey());
    updateSizeInfo(card, actions.getOutputKey(), actions.getQuality());

    return card;
}

export function updateCompressionButtonText(card, outputKey) {
    const format = getOutputFormat(outputKey);
    card.downloadBtn.innerHTML = '';
    card.downloadBtn.appendChild(createIcon('fas fa-download'));
    card.downloadBtn.append(` ${format.label}`);
}

export async function updateSizeInfo(card, outputKey, quality) {
    try {
        const compressedSize = await estimateCompressedSize(card.img, outputKey, quality);
        card.fileSizeDiv.innerHTML = `
            <div class="size-info">
                <span class="original-size">
                    <i class="fas fa-file-arrow-up" aria-hidden="true"></i>
                    ${formatFileSize(card.file.size)}
                </span>
                <span class="compressed-size">
                    <i class="fas fa-file-arrow-down" aria-hidden="true"></i>
                    ${formatFileSize(compressedSize)}
                </span>
            </div>
        `;
    } catch (error) {
        card.fileSizeDiv.innerHTML = `
            <div class="size-error">
                <i class="fas fa-triangle-exclamation" aria-hidden="true"></i>
                Cannot preview
            </div>
        `;
    }
}

export function updateDownloadHistory(card, outputKey, qualityLabel) {
    const format = getOutputFormat(outputKey);
    const timestamp = new Date().toLocaleTimeString();

    card.downloadHistoryDiv.innerHTML = `
        <div class="last-download">
            <i class="fas fa-check-circle" aria-hidden="true"></i>
            ${format.label} - ${qualityLabel}
            <span class="download-time">${timestamp}</span>
        </div>
    `;
}
