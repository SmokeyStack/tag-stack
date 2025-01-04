import { Jimp } from 'jimp';

export async function resizeImage(image: string): Promise<string> {
    try {
        const original_image = await Jimp.read(image);
        const original_width = original_image.bitmap.width;
        const original_height = original_image.bitmap.height;
        // Calculate the scaling factor to maintain the aspect ratio
        const scaling_factor = Math.min(
            256 / original_width,
            256 / original_height
        );
        const new_width = Math.floor(original_width * scaling_factor);
        const new_height = Math.floor(original_height * scaling_factor);
        const resized_image = new Jimp({
            width: new_width,
            height: new_height
        });

        for (let x = 0; x < new_width; x++)
            for (let y = 0; y < new_height; y++) {
                const original_x = Math.floor(x / scaling_factor);
                const original_y = Math.floor(y / scaling_factor);
                const color = original_image.getPixelColor(
                    original_x,
                    original_y
                );
                resized_image.setPixelColor(color, x, y);
            }

        return resized_image.getBase64('image/png');
    } catch (error) {
        throw new Error(`Error resizing ${image}: ${error}`);
    }
}
