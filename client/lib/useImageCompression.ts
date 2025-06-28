import { useState, useCallback } from 'react';
import imageCompression from 'browser-image-compression';

interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  quality?: number;
  convertToWebP?: boolean;
}

interface CompressionResult {
  originalFile: File;
  compressedFile: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: string;
  savings: number;
}

// Interface for compression errors - currently unused but may be needed for future error handling
// interface CompressionError {
//   message: string;
//   originalFile: File;
// }

export const useImageCompression = () => {
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionError, setCompressionError] = useState<string | null>(null);
  const [compressionProgress, setCompressionProgress] = useState<number>(0);

  const compressImage = useCallback(async (
    file: File, 
    options: CompressionOptions = {}
  ): Promise<CompressionResult> => {
    setIsCompressing(true);
    setCompressionError(null);
    setCompressionProgress(0);

    const defaultOptions = {
      maxSizeMB: 2,
      maxWidthOrHeight: 2000,
      quality: 0.9,
      useWebWorker: true,
      convertToWebP: false,
      ...options,
    };

    try {
      // Convert to WebP if requested and supported
      const compressionOptions = {
        maxSizeMB: defaultOptions.maxSizeMB,
        maxWidthOrHeight: defaultOptions.maxWidthOrHeight,
        useWebWorker: defaultOptions.useWebWorker,
        fileType: defaultOptions.convertToWebP ? 'image/webp' : undefined,
        onProgress: (progress: number) => {
          setCompressionProgress(Math.round(progress));
        },
      };

      const compressedFile = await imageCompression(file, compressionOptions);
      
      // Calculate compression ratio
      const compressionRatio = ((file.size - compressedFile.size) / file.size * 100).toFixed(1);
      
      const result: CompressionResult = {
        originalFile: file,
        compressedFile,
        originalSize: file.size,
        compressedSize: compressedFile.size,
        compressionRatio: `${compressionRatio}%`,
        savings: file.size - compressedFile.size,
      };

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Compression failed';
      setCompressionError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsCompressing(false);
      setCompressionProgress(0);
    }
  }, []);

  const compressMultipleImages = useCallback(async (
    files: File[], 
    options: CompressionOptions = {}
  ) => {
    setIsCompressing(true);
    setCompressionError(null);

    const results = await Promise.allSettled(
      files.map(file => compressImage(file, options))
    );
    
    const processedResults = results.map((result, index) => ({
      index,
      success: result.status === 'fulfilled',
      data: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason?.message || 'Unknown error' : null,
      originalFile: files[index],
    }));

    setIsCompressing(false);
    return processedResults;
  }, [compressImage]);

  const getReadableFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  return {
    compressImage,
    compressMultipleImages,
    isCompressing,
    compressionError,
    compressionProgress,
    getReadableFileSize,
  };
}; 