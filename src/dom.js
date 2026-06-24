export function getElements() {
    return {
        dropZone: document.getElementById('dropZone'),
        fileInput: document.getElementById('fileInput'),
        imagesGrid: document.getElementById('imagesGrid'),
        downloadAllBtn: document.getElementById('downloadAll'),
        clearAllBtn: document.getElementById('clearAll'),
        formatSelect: document.getElementById('format'),
        qualitySelect: document.getElementById('quality'),
        qualityHelp: document.getElementById('qualityHelp'),
        addMoreBtn: document.getElementById('addMoreBtn'),
        supportedTypesText: document.getElementById('supportedTypesText'),
        formatHelp: document.getElementById('formatHelp')
    };
}

export function createIcon(className) {
    const icon = document.createElement('i');
    icon.className = className;
    icon.setAttribute('aria-hidden', 'true');
    return icon;
}

export function setButtonLoading(button, loading) {
    button.classList.toggle('loading', loading);
    button.disabled = loading;
}
