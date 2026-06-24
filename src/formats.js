export const INPUT_FORMATS = [
    {
        key: 'jpeg',
        label: 'JPG',
        mimeTypes: ['image/jpeg'],
        extensions: ['jpg', 'jpeg', 'jfif', 'pjpeg', 'pjp']
    },
    {
        key: 'png',
        label: 'PNG',
        mimeTypes: ['image/png'],
        extensions: ['png']
    },
    {
        key: 'webp',
        label: 'WebP',
        mimeTypes: ['image/webp'],
        extensions: ['webp']
    },
    {
        key: 'gif',
        label: 'GIF',
        mimeTypes: ['image/gif'],
        extensions: ['gif'],
        note: 'Animated GIFs export as still images.'
    },
    {
        key: 'bmp',
        label: 'BMP',
        mimeTypes: ['image/bmp', 'image/x-ms-bmp'],
        extensions: ['bmp', 'dib']
    },
    {
        key: 'svg',
        label: 'SVG',
        mimeTypes: ['image/svg+xml'],
        extensions: ['svg']
    },
    {
        key: 'avif',
        label: 'AVIF',
        mimeTypes: ['image/avif'],
        extensions: ['avif']
    },
    {
        key: 'ico',
        label: 'ICO',
        mimeTypes: ['image/x-icon', 'image/vnd.microsoft.icon'],
        extensions: ['ico', 'cur']
    },
    {
        key: 'heic',
        label: 'HEIC/HEIF',
        mimeTypes: ['image/heic', 'image/heif'],
        extensions: ['heic', 'heif'],
        note: 'Browser support varies.'
    }
];

export const OUTPUT_FORMATS = [
    {
        key: 'jpeg',
        label: 'JPG',
        mimeType: 'image/jpeg',
        extension: 'jpg',
        supportsQuality: true
    },
    {
        key: 'png',
        label: 'PNG',
        mimeType: 'image/png',
        extension: 'png',
        supportsQuality: false
    },
    {
        key: 'webp',
        label: 'WebP',
        mimeType: 'image/webp',
        extension: 'webp',
        supportsQuality: true
    },
    {
        key: 'avif',
        label: 'AVIF',
        mimeType: 'image/avif',
        extension: 'avif',
        supportsQuality: true
    },
    {
        key: 'bmp',
        label: 'BMP',
        mimeType: 'image/bmp',
        extension: 'bmp',
        supportsQuality: false,
        encoder: 'bmp'
    },
    {
        key: 'svg',
        label: 'SVG',
        mimeType: 'image/svg+xml',
        extension: 'svg',
        supportsQuality: false,
        encoder: 'svg',
        note: 'Exports raster images inside an SVG wrapper.'
    }
];

const allExtensions = new Set(INPUT_FORMATS.flatMap((format) => format.extensions));
const allMimeTypes = new Set(INPUT_FORMATS.flatMap((format) => format.mimeTypes));

export function getAcceptAttribute() {
    const extensions = Array.from(allExtensions, (extension) => `.${extension}`);
    return [...Array.from(allMimeTypes), ...extensions].join(',');
}

export function getSupportedInputLabel() {
    return INPUT_FORMATS.map((format) => format.label).join(', ');
}

export function getFileExtension(fileName) {
    const parts = fileName.toLowerCase().split('.');
    return parts.length > 1 ? parts.pop() : '';
}

export function getBaseName(fileName) {
    return fileName.replace(/\.[^/.]+$/, '');
}

export function isSupportedInputFile(file) {
    const extension = getFileExtension(file.name);
    return allMimeTypes.has(file.type) || allExtensions.has(extension);
}

export function getOutputFormat(formatKey) {
    const format = OUTPUT_FORMATS.find((item) => item.key === formatKey);

    if (!format) {
        throw new Error(`Unsupported output format: ${formatKey}`);
    }

    return format;
}

export async function getAvailableOutputFormats() {
    const supportChecks = OUTPUT_FORMATS.map(async (format) => {
        const supported = await canEncode(format.mimeType);
        return supported ? format : null;
    });

    return (await Promise.all(supportChecks)).filter(Boolean);
}

async function canEncode(mimeType) {
    const customFormat = OUTPUT_FORMATS.find((format) => format.mimeType === mimeType && format.encoder);

    if (customFormat) {
        return true;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;

    const blob = await new Promise((resolve) => {
        canvas.toBlob(resolve, mimeType, 0.8);
    });

    return Boolean(blob && blob.type === mimeType);
}
