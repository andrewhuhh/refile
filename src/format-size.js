export function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';

    const unit = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const index = Math.min(Math.floor(Math.log(bytes) / Math.log(unit)), sizes.length - 1);
    const amount = bytes / Math.pow(unit, index);

    return `${amount.toFixed(1)} ${sizes[index]}`;
}
