import { useState, useCallback } from 'react';
import imageCompression from 'browser-image-compression';

interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  quality?: number;
  convertToWebP?: boolean;
  preserveExif?: boolean;
}

interface CompressionResult {
  originalFile: File;
  compressedFile: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: string;
  savings: number;
  method: 'webp' | 'jpeg' | 'original';
  warnings?: string[];
}

// Phone-specific file detection
const isPhoneImage = (file: File): boolean => {
  // Check for common phone image patterns
  const phonePatterns = [
    /^\d+_\d+\.jpg$/i,  // Your specific pattern: 123213_234.jpg
    /^IMG_\d+\.jpg$/i,  // IMG_1234.jpg
    /^DSC_\d+\.jpg$/i,  // DSC_1234.jpg
    /^PXL_\d+\.jpg$/i,  // Pixel phones
    /^DCIM_\d+\.jpg$/i, // DCIM format
    /^photo_\d+\.jpg$/i, // photo_1234.jpg
  ];
  
  return phonePatterns.some(pattern => pattern.test(file.name));
};

// Check if file has potential EXIF/orientation issues
const hasPotentialExifIssues = (file: File): boolean => {
  return (
    file.type === 'image/jpeg' && 
    file.size > 1024 * 1024 && // Larger than 1MB
    isPhoneImage(file)
  );
};

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

    const warnings: string[] = [];
    let method: 'webp' | 'jpeg' | 'original' = 'original';

    // Detect phone image characteristics
    const isPhone = isPhoneImage(file);
    const hasExifIssues = hasPotentialExifIssues(file);
    
    if (isPhone) {
      console.log('📱 Phone image detected:', {
        filename: file.name,
        size: file.size,
        type: file.type,
        hasExifIssues
      });
    }

    const defaultOptions = {
      maxSizeMB: 1.5,
      maxWidthOrHeight: 1600,
      quality: 0.7,
      useWebWorker: true,
      convertToWebP: false, // Start with false, we'll try WebP as fallback
      preserveExif: false, // Remove EXIF data to avoid issues
      ...options,
    };

    try {
      // Strategy 1: Try WebP conversion first (if requested and not a problematic phone image)
      if (defaultOptions.convertToWebP && !hasExifIssues) {
        try {
          const webpOptions = {
            maxSizeMB: defaultOptions.maxSizeMB,
            maxWidthOrHeight: defaultOptions.maxWidthOrHeight,
            useWebWorker: defaultOptions.useWebWorker,
            fileType: 'image/webp' as const,
            onProgress: (progress: number) => {
              setCompressionProgress(Math.round(progress * 0.6)); // 60% of progress for WebP attempt
            },
          };

          const compressedBlob = await imageCompression(file, webpOptions);
          
          const compressedFile = new File(
            [compressedBlob], 
            file.name.replace(/\.[^/.]+$/, '.webp'), // Change extension to .webp
            { 
              type: compressedBlob.type,
              lastModified: file.lastModified 
            }
          );
          
          method = 'webp';
          console.log('✅ WebP compression successful:', {
            original: file.name,
            compressed: compressedFile.name,
            originalSize: file.size,
            compressedSize: compressedFile.size
          });

          const compressionRatio = ((file.size - compressedFile.size) / file.size * 100).toFixed(1);
          
          return {
            originalFile: file,
            compressedFile,
            originalSize: file.size,
            compressedSize: compressedFile.size,
            compressionRatio: `${compressionRatio}%`,
            savings: file.size - compressedFile.size,
            method,
            warnings: warnings.length > 0 ? warnings : undefined,
          };
        } catch (webpError) {
          console.log('⚠️ WebP conversion failed, falling back to JPEG:', webpError);
          warnings.push('WebP conversion failed, using JPEG instead');
          // Continue to JPEG compression
        }
      }

      // Strategy 2: JPEG compression with phone-optimized settings
      const jpegOptions = {
        maxSizeMB: defaultOptions.maxSizeMB,
        maxWidthOrHeight: defaultOptions.maxWidthOrHeight,
        useWebWorker: defaultOptions.useWebWorker,
        initialQuality: isPhone ? 0.8 : 0.7, // Higher quality for phone images
        alwaysKeepResolution: false,
        exifOrientation: 1, // Reset orientation to avoid issues
        onProgress: (progress: number) => {
          const baseProgress = defaultOptions.convertToWebP ? 60 : 0;
          setCompressionProgress(Math.round(baseProgress + (progress * 0.4)));
        },
      };

      const compressedBlob = await imageCompression(file, jpegOptions);
      
      const compressedFile = new File(
        [compressedBlob], 
        file.name, 
        { 
          type: compressedBlob.type,
          lastModified: file.lastModified 
        }
      );
      
      method = 'jpeg';
      console.log('✅ JPEG compression successful:', {
        original: file.name,
        compressed: compressedFile.name,
        originalSize: file.size,
        compressedSize: compressedFile.size,
        method
      });

      const compressionRatio = ((file.size - compressedFile.size) / file.size * 100).toFixed(1);
      
      return {
        originalFile: file,
        compressedFile,
        originalSize: file.size,
        compressedSize: compressedFile.size,
        compressionRatio: `${compressionRatio}%`,
        savings: file.size - compressedFile.size,
        method,
        warnings: warnings.length > 0 ? warnings : undefined,
      };

    } catch (error) {
      // Strategy 3: If all compression fails, provide detailed error info
      console.error('🚨 All compression strategies failed:', {
        filename: file.name,
        fileSize: file.size,
        fileType: file.type,
        isPhone,
        hasExifIssues,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      const errorMessage = error instanceof Error ? error.message : 'Compression failed';
      
      // For phone images, provide more specific error message
      if (isPhone) {
        const phoneErrorMessage = `Phone image compression failed: ${errorMessage}. This sometimes happens with images that have complex metadata.`;
        setCompressionError(phoneErrorMessage);
        throw new Error(phoneErrorMessage);
      }
      
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