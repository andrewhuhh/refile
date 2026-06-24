import { getElements, setButtonLoading } from './dom.js';
import { downloadBlob, downloadZip, sanitizeFileName } from './downloads.js';
import {
    getAcceptAttribute,
    getAvailableOutputFormats,
    getOutputFormat,
    getSupportedInputLabel,
    isSupportedInputFile
} from './formats.js';
import { encodeImage } from './image-codec.js';
import {
    createImageCard,
    updateCompressionButtonText,
    updateDownloadHistory,
    updateSizeInfo
} from './image-card.js';

const elements = getElements();
const imageCards = [];
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

init();

async function init() {
    elements.imagesGrid.style.display = 'none';
    elements.fileInput.setAttribute('accept', getAcceptAttribute());
    elements.supportedTypesText.textContent = `Supports ${getSupportedInputLabel()}`;

    await hydrateOutputFormats();
    bindEvents();
    updateQualityControl();
    updateVisibleState();
    updateDownloadAllButtonText();
}

async function hydrateOutputFormats() {
    const formats = await getAvailableOutputFormats();
    elements.formatSelect.innerHTML = '';

    formats.forEach((format) => {
        const option = document.createElement('option');
        option.value = format.key;
        option.textContent = format.label;
        elements.formatSelect.appendChild(option);
    });

    if (!formats.some((format) => format.key === 'avif')) {
        elements.formatHelp.textContent = 'AVIF export is hidden because this browser cannot encode it.';
    }
}

function bindEvents() {
    elements.clearAllBtn.addEventListener('click', clearAllCards);
    elements.addMoreBtn.addEventListener('click', () => elements.fileInput.click());
    elements.dropZone.addEventListener('click', () => elements.fileInput.click());
    elements.fileInput.addEventListener('change', (event) => {
        handleFiles(event.target.files);
        elements.fileInput.value = '';
    });

    elements.dropZone.addEventListener('dragover', (event) => {
        event.preventDefault();
        elements.dropZone.classList.add('is-dragging');
    });

    elements.dropZone.addEventListener('dragleave', () => {
        elements.dropZone.classList.remove('is-dragging');
    });

    elements.dropZone.addEventListener('drop', (event) => {
        event.preventDefault();
        elements.dropZone.classList.remove('is-dragging');
        handleFiles(event.dataTransfer.files);
    });

    elements.formatSelect.addEventListener('change', () => {
        updateQualityControl();
        refreshCardsForSettings();
    });
    elements.qualitySelect.addEventListener('change', refreshCardsForSettings);
    elements.downloadAllBtn.addEventListener('click', downloadAll);
}

function getOutputKey() {
    return elements.formatSelect.value;
}

function getQuality() {
    return Number.parseFloat(elements.qualitySelect.value);
}

function getQualityLabel() {
    if (!getOutputFormat(getOutputKey()).supportsQuality) {
        return 'Lossless';
    }

    return elements.qualitySelect.options[elements.qualitySelect.selectedIndex].text.split(' ')[0];
}

function updateQualityControl() {
    const format = getOutputFormat(getOutputKey());

    elements.qualitySelect.disabled = !format.supportsQuality;
    elements.qualityHelp.textContent = format.supportsQuality
        ? 'Applies to lossy output formats.'
        : `${format.label} uses lossless browser encoding, so compression level is disabled.`;
}

function handleFiles(files) {
    Array.from(files).forEach((file) => {
        if (!isSupportedInputFile(file)) {
            alert(`"${file.name}" is not a supported image type.`);
            return;
        }

        addImageCard(file);
    });

    updateVisibleState();
    updateDownloadAllButtonText();
}

function addImageCard(file) {
    const card = createImageCard(file, {
        getOutputKey,
        getQuality,
        onDownload: downloadSingle,
        onRemove: removeCard
    });

    card.element.style.animation = 'fadeIn 0.3s ease';
    imageCards.push(card);
    elements.imagesGrid.appendChild(card.element);
}

async function downloadSingle(card) {
    setButtonLoading(card.downloadBtn, true);

    try {
        const { blob, format } = await encodeImage(card.img, getOutputKey(), getQuality());
        const fileName = `${sanitizeFileName(card.nameInput.value)}.${format.extension}`;

        downloadBlob(blob, fileName);
        updateDownloadHistory(card, getOutputKey(), getQualityLabel());
        await updateSizeInfo(card, getOutputKey(), getQuality());
    } catch (error) {
        alert(error.message);
    } finally {
        setButtonLoading(card.downloadBtn, false);
    }
}

function removeCard(card) {
    card.element.style.animation = 'fadeOut 0.3s ease';

    setTimeout(() => {
        const index = imageCards.indexOf(card);

        if (index >= 0) {
            imageCards.splice(index, 1);
        }

        URL.revokeObjectURL(card.objectUrl);
        card.element.remove();
        updateVisibleState();
        updateDownloadAllButtonText();
    }, 300);
}

function clearAllCards() {
    imageCards.slice().forEach((card) => {
        URL.revokeObjectURL(card.objectUrl);
        card.element.style.animation = 'fadeOut 0.3s ease';
    });

    setTimeout(() => {
        imageCards.length = 0;
        elements.imagesGrid.innerHTML = '';
        updateVisibleState();
        updateDownloadAllButtonText();
    }, 300);
}

async function refreshCardsForSettings() {
    const outputKey = getOutputKey();
    const quality = getQuality();

    await Promise.all(imageCards.map(async (card) => {
        updateCompressionButtonText(card, outputKey);
        await updateSizeInfo(card, outputKey, quality);
    }));
}

async function downloadAll() {
    if (imageCards.length === 0) return;

    if (isMobile && !confirmMobileZipDownload()) {
        await downloadIndividually();
        return;
    }

    setButtonLoading(elements.downloadAllBtn, true);

    try {
        const entries = await Promise.all(imageCards.map(async (card, index) => {
            const { blob, format } = await encodeImage(card.img, getOutputKey(), getQuality());
            const baseName = sanitizeFileName(card.nameInput.value, `image_${index + 1}`);

            updateDownloadHistory(card, getOutputKey(), getQualityLabel());

            return {
                blob,
                fileName: `${baseName}.${format.extension}`
            };
        }));

        await downloadZip(entries, 'compressed_images.zip');
    } catch (error) {
        alert(error.message);
    } finally {
        setButtonLoading(elements.downloadAllBtn, false);
    }
}

async function downloadIndividually() {
    setButtonLoading(elements.downloadAllBtn, true);

    try {
        for (const card of imageCards) {
            await downloadSingle(card);
            await new Promise((resolve) => setTimeout(resolve, 500));
        }
    } finally {
        setButtonLoading(elements.downloadAllBtn, false);
    }
}

function confirmMobileZipDownload() {
    return confirm(
        'Would you like to download as a ZIP file?\n\n' +
        'You may need a file extractor app to open ZIP files on your device.\n\n' +
        'Select "Cancel" to download files individually instead.'
    );
}

function updateVisibleState() {
    const hasImages = imageCards.length > 0;

    elements.downloadAllBtn.style.display = hasImages ? 'block' : 'none';
    elements.clearAllBtn.style.display = hasImages ? 'block' : 'none';
    elements.imagesGrid.style.display = hasImages ? 'flex' : 'none';
    elements.dropZone.style.display = hasImages ? 'none' : 'block';
    elements.addMoreBtn.style.display = hasImages ? 'flex' : 'none';
}

function updateDownloadAllButtonText() {
    const imageCount = imageCards.length;
    const baseText = isMobile ? 'Download All as ZIP' : 'Download All';
    const imageText = imageCount === 1 ? 'image' : 'images';

    elements.downloadAllBtn.innerHTML = `<i class="fas fa-download" aria-hidden="true"></i> ${baseText} (${imageCount} ${imageText})`;

    if (isMobile) {
        elements.downloadAllBtn.innerHTML += '<span class="mobile-zip-note">You may need a file extractor app to open ZIP files on mobile</span>';
    }
}
