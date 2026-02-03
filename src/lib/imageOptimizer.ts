import imageCompression from 'browser-image-compression';
import { logger } from './logger';

export interface ImageOptimizationOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
  quality?: number;
}

const DEFAULT_OPTIONS: ImageOptimizationOptions = {
  maxSizeMB: 2,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
  quality: 0.8,
};

/**
 * Optimize image before upload
 * Reduces file size and dimensions while maintaining quality
 */
export async function optimizeImage(
  file: File,
  options: ImageOptimizationOptions = {}
): Promise<File> {
  try {
    const mergedOptions = { ...DEFAULT_OPTIONS, ...options };

    logger.log('Optimizing image:', {
      originalSize: (file.size / 1024 / 1024).toFixed(2) + 'MB',
      name: file.name,
    });

    const compressedFile = await imageCompression(file, mergedOptions);

    logger.log('Image optimized:', {
      originalSize: (file.size / 1024 / 1024).toFixed(2) + 'MB',
      compressedSize: (compressedFile.size / 1024 / 1024).toFixed(2) + 'MB',
      reduction: (((file.size - compressedFile.size) / file.size) * 100).toFixed(1) + '%',
    });

    return compressedFile;
  } catch (error) {
    logger.error('Image optimization failed:', error);
    // Return original file if optimization fails
    return file;
  }
}

/**
 * Create thumbnail from image
 */
export async function createThumbnail(file: File): Promise<File> {
  return optimizeImage(file, {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 300,
    quality: 0.7,
  });
}

/**
 * Validate image dimensions
 */
export async function getImageDimensions(
  file: File
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Check if image needs optimization
 */
export function needsOptimization(file: File, maxSizeMB: number = 2): boolean {
  const sizeMB = file.size / 1024 / 1024;
  return sizeMB > maxSizeMB;
}
