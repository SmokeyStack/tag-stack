import { createCanvas, loadImage } from 'canvas';
export const resizeImage = async (
    src: string,
    pixel_ratio: number
): Promise<string> => {
    const image = await loadImage(src);
    const base_width = image.width;
    const base_height = image.height;
    // Calculate new size
    const adj_size = Math.ceil(Math.max(base_width, base_height) * pixel_ratio);
    let new_width = adj_size;
    let new_height = adj_size;

    if (base_width > base_height) {
        new_width = adj_size;
        new_height = Math.ceil(adj_size * (base_height / base_width));
    } else if (base_height > base_width) {
        new_height = adj_size;
        new_width = Math.ceil(adj_size * (base_width / base_height));
    }

    const canvas = createCanvas(new_width, new_height);
    const ctx = canvas.getContext('2d'); // Use multiple drawImage calls to improve quality (poor-man's resampling)
    const intermediateCanvas = createCanvas(image.width, image.height);
    const intermediateCtx = intermediateCanvas.getContext('2d');
    intermediateCtx.drawImage(image, 0, 0);
    ctx.drawImage(
        intermediateCanvas,
        0,
        0,
        image.width,
        image.height,
        0,
        0,
        new_width,
        new_height
    );

    // // Invert colors
    // const imageData = ctx.getImageData(0, 0, new_width, new_height);
    // const data = imageData.data;
    // for (let i = 0; i < data.length; i += 4) {
    //     data[i] = 255 - data[i]; // Red
    //     data[i + 1] = 255 - data[i + 1]; // Green
    //     data[i + 2] = 255 - data[i + 2]; // Blue
    //     // Alpha (data[i + 3]) remains unchanged
    // }
    // ctx.putImageData(imageData, 0, 0);

    return canvas.toDataURL(); // Return the resized image as data URL
};
