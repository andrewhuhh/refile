import { getOutputFormat } from './formats.js';

export function createObjectUrl(file) {
    return URL.createObjectURL(file);
}

export async function ensureImageCanDecode(img) {
    if (img.decode) {
        await img.decode();
        return;
    }

    if (img.complete && img.naturalWidth > 0) {
        return;
    }

    await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
    });
}

export async function encodeImage(img, outputKey, quality) {
    await ensureImageCanDecode(img);

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const format = getOutputFormat(outputKey);

    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    context.drawImage(img, 0, 0);

    if (format.encoder === 'bmp') {
        return {
            blob: encodeCanvasAsBmp(canvas, context),
            format
        };
    }

    if (format.encoder === 'svg') {
        return {
            blob: encodeCanvasAsSvg(canvas),
            format
        };
    }

    const blob = await new Promise((resolve) => {
        const qualityValue = format.supportsQuality ? quality : undefined;
        canvas.toBlob(resolve, format.mimeType, qualityValue);
    });

    if (!blob) {
        throw new Error(`Could not encode image as ${format.label}.`);
    }

    return {
        blob,
        format
    };
}

export async function estimateCompressedSize(img, outputKey, quality) {
    const { blob } = await encodeImage(img, outputKey, quality);
    return blob.size;
}

function encodeCanvasAsBmp(canvas, context) {
    const width = canvas.width;
    const height = canvas.height;
    const imageData = context.getImageData(0, 0, width, height);
    const rowStride = Math.ceil((width * 3) / 4) * 4;
    const pixelArraySize = rowStride * height;
    const fileHeaderSize = 14;
    const dibHeaderSize = 40;
    const pixelOffset = fileHeaderSize + dibHeaderSize;
    const fileSize = pixelOffset + pixelArraySize;
    const buffer = new ArrayBuffer(fileSize);
    const view = new DataView(buffer);

    view.setUint8(0, 0x42);
    view.setUint8(1, 0x4d);
    view.setUint32(2, fileSize, true);
    view.setUint32(10, pixelOffset, true);
    view.setUint32(14, dibHeaderSize, true);
    view.setInt32(18, width, true);
    view.setInt32(22, height, true);
    view.setUint16(26, 1, true);
    view.setUint16(28, 24, true);
    view.setUint32(34, pixelArraySize, true);

    let offset = pixelOffset;

    for (let y = height - 1; y >= 0; y -= 1) {
        const sourceRow = y * width * 4;

        for (let x = 0; x < width; x += 1) {
            const source = sourceRow + x * 4;
            const alpha = imageData.data[source + 3] / 255;
            const red = blendWithWhite(imageData.data[source], alpha);
            const green = blendWithWhite(imageData.data[source + 1], alpha);
            const blue = blendWithWhite(imageData.data[source + 2], alpha);

            view.setUint8(offset, blue);
            view.setUint8(offset + 1, green);
            view.setUint8(offset + 2, red);
            offset += 3;
        }

        offset += rowStride - width * 3;
    }

    return new Blob([buffer], { type: 'image/bmp' });
}

function encodeCanvasAsSvg(canvas) {
    const dataUrl = canvas.toDataURL('image/png');
    const svg = [
        `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}" viewBox="0 0 ${canvas.width} ${canvas.height}">`,
        `<image href="${dataUrl}" width="${canvas.width}" height="${canvas.height}" />`,
        '</svg>'
    ].join('');

    return new Blob([svg], { type: 'image/svg+xml' });
}

function blendWithWhite(channel, alpha) {
    return Math.round(channel * alpha + 255 * (1 - alpha));
}
