import { Platform } from 'react-native';
import { Camera } from 'expo-camera';
import jsQR from 'jsqr';

/**
 * Decode QR code from image URI
 * Works on both web and native platforms
 */
export const decodeQRFromImageURI = async (imageURI: string, base64?: string): Promise<string | null> => {
  // Web platform can use canvas
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    return decodeQRFromImageWeb(imageURI, base64);
  }

  // Native platforms use expo-camera static scan
  return decodeQRFromImageNative(imageURI);
};

const decodeQRFromImageNative = async (imageURI: string): Promise<string | null> => {
  try {
    const result = await Camera.scanFromURLAsync(imageURI, ['qr']);
    if (result && result.length > 0 && result[0].data) {
      return result[0].data;
    }
    return null;
  } catch {
    return null;
  }
};

const decodeQRFromImageWeb = async (imageURI: string, base64Data?: string): Promise<string | null> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });

        if (code && code.data) {
          resolve(code.data);
        } else {
          resolve(null);
        }
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    if (base64Data) {
      img.src = `data:image/jpeg;base64,${base64Data}`;
    } else {
      img.src = imageURI;
    }
  });
};
