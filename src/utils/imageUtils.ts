/**
 * Image processing utilities for exam paper scanning
 */

// Optimize and resize image for ultra-fast upload (scales down 4000px raw photos to 1600px)
export async function optimizeImageForUpload(dataUrl: string, maxDimension: number = 1600): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let w = img.width;
      let h = img.height;

      if (w <= maxDimension && h <= maxDimension) {
        return resolve(dataUrl);
      }

      if (w > h) {
        if (w > maxDimension) {
          h = Math.round((h * maxDimension) / w);
          w = maxDimension;
        }
      } else {
        if (h > maxDimension) {
          w = Math.round((w * maxDimension) / h);
          h = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(dataUrl);

      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', 0.88));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

// Rotate an image data URL by given degrees (90, 180, 270)
export async function rotateImageDataUrl(dataUrl: string, degrees: number): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(dataUrl);

      if (degrees === 90 || degrees === 270) {
        canvas.width = img.height;
        canvas.height = img.width;
      } else {
        canvas.width = img.width;
        canvas.height = img.height;
      }

      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((degrees * Math.PI) / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);

      resolve(canvas.toDataURL('image/jpeg', 0.90));
    };
    img.src = dataUrl;
  });
}

// Enhance brightness and contrast
export async function enhanceImage(
  dataUrl: string,
  brightness: number = 0, // -50 to +50
  contrast: number = 0    // -50 to +50
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(dataUrl);

      canvas.width = img.width;
      canvas.height = img.height;

      // Apply filter
      const bFactor = 100 + brightness;
      const cFactor = 100 + contrast;
      ctx.filter = `brightness(${bFactor}%) contrast(${cFactor}%)`;
      ctx.drawImage(img, 0, 0);

      resolve(canvas.toDataURL('image/jpeg', 0.92));
    };
    img.src = dataUrl;
  });
}

// Blur detection via simplified Laplacian variance on a thumbnail
export async function checkImageBlur(dataUrl: string): Promise<{ isBlurry: boolean; score: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      // Downscale to 200x200 for fast edge variance calculation
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve({ isBlurry: false, score: 100 });

      const w = 200;
      const h = 200;
      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(img, 0, 0, w, h);

      const imageData = ctx.getImageData(0, 0, w, h);
      const data = imageData.data;

      // Convert to grayscale
      const gray = new Float32Array(w * h);
      for (let i = 0; i < data.length; i += 4) {
        gray[i / 4] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      }

      // Laplacian kernel: [0, 1, 0; 1, -4, 1; 0, 1, 0]
      let mean = 0;
      const laplacian = new Float32Array(w * h);
      let count = 0;

      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          const idx = y * w + x;
          const val =
            gray[(y - 1) * w + x] +
            gray[(y + 1) * w + x] +
            gray[y * w + (x - 1)] +
            gray[y * w + (x + 1)] -
            4 * gray[idx];
          laplacian[idx] = val;
          mean += val;
          count++;
        }
      }
      mean /= count;

      let variance = 0;
      for (let i = 0; i < laplacian.length; i++) {
        variance += Math.pow(laplacian[i] - mean, 2);
      }
      variance /= count;

      // Score threshold (low variance means blurry image)
      const isBlurry = variance < 45;
      resolve({ isBlurry, score: Math.round(variance) });
    };
    img.onerror = () => resolve({ isBlurry: false, score: 100 });
    img.src = dataUrl;
  });
}
