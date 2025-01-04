import { Jimp } from 'jimp';
import * as core from '@tauri-apps/api/core';

export async function resizeImage(src: string): Promise<string | undefined> {
    try {
        const mimeType = getMimeType(src);
        const image1 = await Jimp.read(core.convertFileSrc(src));
        // image1.fisheye();

        if (image1.bitmap.width < 256 || image1.bitmap.height < 256) {
            const scalingFactor = Math.max(
                256 / image1.bitmap.width,
                256 / image1.bitmap.height
            );

            const width = image1.bitmap.width;
            const height = image1.bitmap.height;
            const jimp = new Jimp({
                width: width * scalingFactor,
                height: height * scalingFactor
            });
            console.log(
                'Created image with dimensions:',
                jimp.bitmap.width,
                jimp.bitmap.height
            );
            for (let i = 0; i < width; i++) {
                for (let j = 0; j < height; j++) {
                    const pixelColor = image1.getPixelColor(i, j);
                    for (let a = 0; a < scalingFactor; a++) {
                        for (let b = 0; b < scalingFactor; b++) {
                            jimp.setPixelColor(
                                pixelColor,
                                i * scalingFactor + a,
                                j * scalingFactor + b
                            );
                        }
                    }
                }
            }
            return jimp.getBase64('image/png');
        }

        switch (mimeType) {
            case 'image/png':
                return image1.getBase64('image/png');
            case 'image/jpeg':
                return image1.getBase64('image/jpeg');
            default:
                throw new Error('Unsupported image type');
        }
    } catch (error) {
        console.error('Error resizing image:', error);
        console.error('Image source:', src);
    }
}

const getMimeType = (url: string) => {
    const extension = url.split('.').pop();
    switch (extension) {
        case 'png':
            return 'image/png';
        case 'jpeg':
        case 'jpg':
            return 'image/jpeg';
        default:
            return '';
    }
};
