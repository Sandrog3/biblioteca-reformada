import imageCompression from 'browser-image-compression';

interface ProcessOptions {
  aspectRatio?: number; // width / height
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

export async function processImage(file: File, options: ProcessOptions = {}): Promise<File> {
  const {
    aspectRatio = 1,
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.8
  } = options;

  // 1. Compression first to handle large files
  const compressionOptions = {
    maxSizeMB: 0.1, // Aim for 100KB to be safe with Firestore Base64 limits (1MB per doc)
    maxWidthOrHeight: Math.max(maxWidth, maxHeight),
    useWebWorker: true,
  };
  
  const compressedFile = await imageCompression(file, compressionOptions);

  // 2. Canvas Processing for Aspect Ratio and "Professional" adjustments
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(compressedFile);
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      // Calculate dimensions for cropping to aspect ratio
      let sourceX = 0;
      let sourceY = 0;
      let sourceWidth = img.width;
      let sourceHeight = img.height;

      const currentAspectRatio = img.width / img.height;

      if (currentAspectRatio > aspectRatio) {
        // Image is wider than target
        sourceWidth = img.height * aspectRatio;
        sourceX = (img.width - sourceWidth) / 2;
      } else if (currentAspectRatio < aspectRatio) {
        // Image is taller than target
        sourceHeight = img.width / aspectRatio;
        sourceY = (img.height - sourceHeight) / 2;
      }

      // Set canvas size to target dimensions (or max)
      let targetWidth = sourceWidth;
      let targetHeight = sourceHeight;

      if (targetWidth > maxWidth) {
        targetWidth = maxWidth;
        targetHeight = targetWidth / aspectRatio;
      }
      if (targetHeight > maxHeight) {
        targetHeight = maxHeight;
        targetWidth = targetHeight * aspectRatio;
      }

      canvas.width = targetWidth;
      canvas.height = targetHeight;

      // Apply "Professional" Filters on the context
      // Subtle contrast boost and brightness adjustment
      ctx.filter = 'contrast(1.05) brightness(1.02) saturate(1.05)';
      
      // Draw the cropped image
      ctx.drawImage(
        img,
        sourceX, sourceY, sourceWidth, sourceHeight,
        0, 0, targetWidth, targetHeight
      );

      // Add a very subtle sharpening effect (optional, but can help)
      // For simplicity, we'll stick to the built-in filters

      canvas.toBlob((blob) => {
        if (blob) {
          const processedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
            type: 'image/webp',
            lastModified: Date.now(),
          });
          resolve(processedFile);
        } else {
          reject(new Error('Canvas toBlob failed'));
        }
      }, 'image/webp', quality);
      
      URL.revokeObjectURL(img.src);
    };

    img.onerror = () => {
      reject(new Error('Image load failed'));
      URL.revokeObjectURL(img.src);
    };
  });
}

export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}
