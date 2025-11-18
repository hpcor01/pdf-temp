import * as tf from '@tensorflow/tfjs';
import { pipeline, Pipeline } from '@huggingface/transformers';

export interface TextRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  label: string;
}

export class LayoutAnalyzer {
  private processor: Pipeline | null = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Initialize the LayoutLMv3 model for document layout analysis
      this.processor = await pipeline('document-question-answering', 'impira/layoutlm-document-qa', {
        device: 'webgpu', // Use WebGPU if available, fallback to CPU
      });
      this.isInitialized = true;
    } catch (error) {
      console.warn('LayoutLMv3 initialization failed, falling back to basic text detection:', error);
      // Fallback to basic OCR if LayoutLMv3 fails
      this.isInitialized = true;
    }
  }

  async detectTextRegions(imageElement: HTMLImageElement): Promise<TextRegion[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const regions: TextRegion[] = [];

    try {
      // Create a canvas to process the image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      canvas.width = imageElement.width;
      canvas.height = imageElement.height;
      ctx.drawImage(imageElement, 0, 0);

      // Convert to base64 for processing
      const imageData = canvas.toDataURL('image/png');

      if (this.processor) {
        // Use LayoutLMv3 for advanced layout analysis
        const result = await this.processor({
          image: imageData,
          question: "What are the text regions in this document?",
        });

        // Parse the result to extract text regions
        // Note: This is a simplified parsing - actual implementation would depend on model output format
        if (result && Array.isArray(result)) {
          result.forEach((item: any) => {
            if (item.bbox && item.label === 'text') {
              regions.push({
                x: item.bbox[0] * canvas.width,
                y: item.bbox[1] * canvas.height,
                width: (item.bbox[2] - item.bbox[0]) * canvas.width,
                height: (item.bbox[3] - item.bbox[1]) * canvas.height,
                confidence: item.score || 0.8,
                label: 'text'
              });
            }
          });
        }
      } else {
        // Fallback: Use basic edge detection for potential text areas
        regions.push(...await this.basicTextDetection(canvas));
      }

    } catch (error) {
      console.error('Error detecting text regions:', error);
      // Return empty array on error
    }

    return regions;
  }

  private async basicTextDetection(canvas: HTMLCanvasElement): Promise<TextRegion[]> {
    const regions: TextRegion[] = [];
    const ctx = canvas.getContext('2d');
    if (!ctx) return regions;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Simple edge detection to find potential text areas
    const edges = new Uint8Array(canvas.width * canvas.height);

    for (let y = 1; y < canvas.height - 1; y++) {
      for (let x = 1; x < canvas.width - 1; x++) {
        const idx = (y * canvas.width + x) * 4;
        const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;

        // Simple Sobel edge detection
        const idxUp = ((y - 1) * canvas.width + x) * 4;
        const idxDown = ((y + 1) * canvas.width + x) * 4;
        const idxLeft = (y * canvas.width + (x - 1)) * 4;
        const idxRight = (y * canvas.width + (x + 1)) * 4;

        const grayUp = (data[idxUp] + data[idxUp + 1] + data[idxUp + 2]) / 3;
        const grayDown = (data[idxDown] + data[idxDown + 1] + data[idxDown + 2]) / 3;
        const grayLeft = (data[idxLeft] + data[idxLeft + 1] + data[idxLeft + 2]) / 3;
        const grayRight = (data[idxRight] + data[idxRight + 1] + data[idxRight + 2]) / 3;

        const edgeX = grayRight - grayLeft;
        const edgeY = grayDown - grayUp;
        const edge = Math.sqrt(edgeX * edgeX + edgeY * edgeY);

        edges[y * canvas.width + x] = edge > 50 ? 255 : 0; // Threshold
      }
    }

    // Group edges into regions (simplified clustering)
    const visited = new Set<number>();
    const minRegionSize = 100; // Minimum pixels for a text region

    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const idx = y * canvas.width + x;
        if (edges[idx] === 255 && !visited.has(idx)) {
          // Flood fill to find connected region
          const region = this.floodFill(edges, visited, x, y, canvas.width, canvas.height);
          if (region.length >= minRegionSize) {
            const bounds = this.getBounds(region, canvas.width);
            regions.push({
              x: bounds.minX,
              y: bounds.minY,
              width: bounds.maxX - bounds.minX,
              height: bounds.maxY - bounds.minY,
              confidence: 0.5, // Low confidence for fallback method
              label: 'potential_text'
            });
          }
        }
      }
    }

    return regions;
  }

  private floodFill(
    edges: Uint8Array,
    visited: Set<number>,
    startX: number,
    startY: number,
    width: number,
    height: number
  ): number[] {
    const region: number[] = [];
    const stack: number[] = [startY * width + startX];

    while (stack.length > 0) {
      const idx = stack.pop()!;
      if (visited.has(idx)) continue;

      const x = idx % width;
      const y = Math.floor(idx / width);

      if (x < 0 || x >= width || y < 0 || y >= height) continue;
      if (edges[idx] !== 255) continue;

      visited.add(idx);
      region.push(idx);

      // Add neighbors
      stack.push((y - 1) * width + x); // up
      stack.push((y + 1) * width + x); // down
      stack.push(y * width + (x - 1)); // left
      stack.push(y * width + (x + 1)); // right
    }

    return region;
  }

  private getBounds(region: number[], width: number): { minX: number; minY: number; maxX: number; maxY: number } {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    region.forEach(idx => {
      const x = idx % width;
      const y = Math.floor(idx / width);
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    });

    return { minX, minY, maxX, maxY };
  }

  async createPreservationMask(
    imageElement: HTMLImageElement,
    textRegions: TextRegion[],
    canvas: HTMLCanvasElement
  ): Promise<ImageData> {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    canvas.width = imageElement.width;
    canvas.height = imageElement.height;

    // Create a mask where text regions are white (preserve) and background is black (remove)
    const maskData = new ImageData(canvas.width, canvas.height);
    const data = maskData.data;

    // Fill with black (remove background)
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 0;     // R
      data[i + 1] = 0; // G
      data[i + 2] = 0; // B
      data[i + 3] = 255; // A
    }

    // Mark text regions as white (preserve)
    textRegions.forEach(region => {
      const startX = Math.max(0, Math.floor(region.x));
      const startY = Math.max(0, Math.floor(region.y));
      const endX = Math.min(canvas.width, Math.ceil(region.x + region.width));
      const endY = Math.min(canvas.height, Math.ceil(region.y + region.height));

      for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
          const idx = (y * canvas.width + x) * 4;
          data[idx] = 255;     // R
          data[idx + 1] = 255; // G
          data[idx + 2] = 255; // B
          data[idx + 3] = 255; // A
        }
      }
    });

    return maskData;
  }
}

// Singleton instance
export const layoutAnalyzer = new LayoutAnalyzer();
