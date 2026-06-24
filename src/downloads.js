export function sanitizeFileName(value, fallback = 'image') {
    const normalized = value.trim().replace(/[<>:"/\\|?*\u0000-\u001F]/g, '-');
    const collapsed = normalized.replace(/\s+/g, ' ').replace(/-+/g, '-');
    return collapsed || fallback;
}

export function downloadBlob(blob, fileName) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
}

export async function downloadZip(entries, zipName) {
    const zip = new JSZip();

    entries.forEach(({ blob, fileName }) => {
        zip.file(fileName, blob);
    });

    const content = await zip.generateAsync({ type: 'blob' });
    downloadBlob(content, zipName);
}
