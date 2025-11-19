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
  private processor: any = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('Initializing LayoutLMv3 for document layout analysis...');
      this.processor = await (pipeline as any)('document-question-answering', 'impira/layoutlm-document-qa', {
        device: 'webgpu'
      });
      console.log('LayoutLMv3 initialized successfully');
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize LayoutLMv3:', error);
      throw error;
    }
  }

  async detectTextRegions(imageElement: HTMLImageElement): Promise<TextRegion[]> {
    // Temporarily disable text detection to ensure background removal works
    // Return empty regions to avoid interfering with background removal
    console.log('Text detection disabled - returning empty regions for background removal');
    return [];
  }

  private parseLayoutResult(result: any, imageElement: HTMLImageElement): TextRegion[] {
    const regions: TextRegion[] = [];

    try {
      // LayoutLMv3 typically returns answers with bounding boxes
      // This is a simplified parsing - adjust based on actual model output
      if (result && result.answer) {
        // Assuming the model returns structured data about text regions
        // This would need to be adapted based on the exact output format
        const answer = result.answer;

        // For demonstration, create regions based on common document areas
        // But make them less aggressive to avoid over-preservation
        regions.push({
          x: 0,
          y: 0,
          width: imageElement.width,
          height: imageElement.height * 0.05, // Smaller header area
          confidence: 0.6,
          label: 'header'
        });

        regions.push({
          x: 0,
          y: imageElement.height * 0.05,
          width: imageElement.width,
          height: imageElement.height * 0.9, // Main content
          confidence: 0.7,
          label: 'content'
        });

        regions.push({
          x: 0,
          y: imageElement.height * 0.95,
          width: imageElement.width,
          height: imageElement.height * 0.05, // Smaller footer area
          confidence: 0.5,
          label: 'footer'
        });
      }
    } catch (error) {
      console.error('Error parsing LayoutLMv3 result:', error);
    }

    return regions;
  }

  private async basicTextDetection(canvas: HTMLCanvasElement): Promise<TextRegion[]> {
    // For now, return empty regions to avoid performance issues
    // This disables text detection temporarily to prevent UI freezing
    console.log('Text detection disabled for performance - returning empty regions');
    return [];
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
  ): Promise<HTMLCanvasElement> {
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

    ctx.putImageData(maskData, 0, 0);
    return canvas;
  }
}

// Singleton instance
export const layoutAnalyzer = new LayoutAnalyzer();
