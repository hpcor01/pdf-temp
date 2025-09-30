import jsPDF from "jspdf";
import type { Column } from "@/types/kanban";
import type { FileSystemDirectoryHandle } from "@/types/pdf";

function extractOriginalImageUrl(nextImageUrl: string): string {
  try {
    if (nextImageUrl.includes("/_next/image?url=")) {
      const params = new URLSearchParams(nextImageUrl.split("?")[1]);
      const originalUrl = params.get("url");
      if (originalUrl) return decodeURIComponent(originalUrl);
    }
    return nextImageUrl;
  } catch (err) {
    console.warn("Erro ao extrair URL original:", err);
    return nextImageUrl;
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (src.startsWith("http")) img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

async function savePDF(doc: jsPDF, name: string): Promise<void> {
  const safeName = name.replace(/[/\\?%*:|"<>]/g, "-");
  const blob = doc.output("blob");

  if ("showSaveFilePicker" in window && window.showSaveFilePicker) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: `${safeName}.pdf`,
        types: [
          {
            description: "PDF",
            accept: { "application/pdf": [".pdf"] },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return;
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") throw err;
      console.error("Erro ao salvar PDF:", err);
    }
  }

  doc.save(`${safeName}.pdf`);
}

/**
 * Generate a PDF blob for a column without saving it
 * @param column The column to generate PDF for
 * @returns A Promise that resolves to a PDF blob
 */
export async function generatePDFForColumnBlob(column: Column): Promise<Blob> {
  const doc = new jsPDF({ orientation: "landscape", unit: "px", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 0; i < column.items.length; i++) {
    const item = column.items[i];
    // Add a check to ensure item is defined
    if (!item) continue;

    try {
      if (i > 0) doc.addPage();

      const src = extractOriginalImageUrl(item.src);
      const img = await loadImage(src);

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("Could not get 2D context for canvas");
      }

      const radians = (item.rotation * Math.PI) / 180;

      if (item.rotation === 90 || item.rotation === 270) {
        canvas.width = img.height;
        canvas.height = img.width;
      } else {
        canvas.width = img.width;
        canvas.height = img.height;
      }

      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(radians);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);

      const ratio = Math.min(
        pageWidth / canvas.width,
        pageHeight / canvas.height
      );
      const imgW = canvas.width * ratio;
      const imgH = canvas.height * ratio;
      const x = (pageWidth - imgW) / 2;
      const y = (pageHeight - imgH) / 2;

      doc.addImage(canvas.toDataURL("image/png"), "PNG", x, y, imgW, imgH);
    } catch (err: unknown) {
      console.error(`Erro ao processar imagem ${item.fileName}:`, err);
    }
  }

  return doc.output("blob");
}

/**
 * Save a PDF blob to a specific directory with the given filename
 * @param blob The PDF blob to save
 * @param directoryHandle The directory to save the file to
 * @param filename The name of the file to create
 */
export async function savePDFToDirectory(
  blob: Blob,
  directoryHandle: FileSystemDirectoryHandle,
  filename: string
): Promise<boolean> {
  try {
    // Sanitize filename to remove invalid characters
    const safeName = filename.replace(/[/\\?%*:|"<>]/g, "-");
    const fileHandle = await directoryHandle.getFileHandle(`${safeName}.pdf`, {
      create: true,
    });
    const writable = await fileHandle.createWritable();
    await writable.write(blob);
    await writable.close();
    return true;
  } catch (err) {
    console.error("Erro ao salvar PDF no diretório:", err);
    return false;
  }
}

async function generatePDFForColumn(column: Column): Promise<void> {
  const doc = new jsPDF({ orientation: "landscape", unit: "px", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 0; i < column.items.length; i++) {
    const item = column.items[i];
    // Add a check to ensure item is defined
    if (!item) continue;

    try {
      if (i > 0) doc.addPage();

      const src = extractOriginalImageUrl(item.src);
      const img = await loadImage(src);

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("Could not get 2D context for canvas");
      }

      const radians = (item.rotation * Math.PI) / 180;

      if (item.rotation === 90 || item.rotation === 270) {
        canvas.width = img.height;
        canvas.height = img.width;
      } else {
        canvas.width = img.width;
        canvas.height = img.height;
      }

      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(radians);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);

      const ratio = Math.min(
        pageWidth / canvas.width,
        pageHeight / canvas.height
      );
      const imgW = canvas.width * ratio;
      const imgH = canvas.height * ratio;
      const x = (pageWidth - imgW) / 2;
      const y = (pageHeight - imgH) / 2;

      doc.addImage(canvas.toDataURL("image/png"), "PNG", x, y, imgW, imgH);
    } catch (err: unknown) {
      console.error(`Erro ao processar imagem ${item.fileName}:`, err);
    }
  }

  await savePDF(doc, column.title);
}

export async function generatePDFForColumns(
  columns: Column[],
  selected: Record<string, boolean>
): Promise<void> {
  const list = columns.filter((c) => selected[c.id]);
  for (const col of list) {
    await generatePDFForColumn(col);
  }
}

/**
 * Generate a single PDF with all selected columns
 * @param columns All columns
 * @param selected Record of selected column IDs
 */
export async function generateSinglePDFForColumns(
  columns: Column[],
  selected: Record<string, boolean>
): Promise<void> {
  const selectedColumns = columns.filter((c) => selected[c.id]);

  if (selectedColumns.length === 0) {
    return;
  }

  // Create a single PDF document
  const doc = new jsPDF({ orientation: "landscape", unit: "px", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Process each selected column
  for (let colIndex = 0; colIndex < selectedColumns.length; colIndex++) {
    const column = selectedColumns[colIndex];
    // Add a check to ensure column is defined
    if (!column) continue;

    // Add a title page for the column
    if (colIndex > 0) {
      doc.addPage();
    }

    // Add column title
    doc.setFontSize(20);
    doc.text(column.title, pageWidth / 2, 30, { align: "center" });

    // Process each image in the column
    for (let imgIndex = 0; imgIndex < column.items.length; imgIndex++) {
      const item = column.items[imgIndex];
      // Add a check to ensure item is defined
      if (!item) continue;

      try {
        // Add a new page for each image (except the first one on the title page)
        if (imgIndex > 0 || colIndex > 0) {
          doc.addPage();
        }

        const src = extractOriginalImageUrl(item.src);
        const img = await loadImage(src);

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          throw new Error("Could not get 2D context for canvas");
        }

        const radians = (item.rotation * Math.PI) / 180;

        if (item.rotation === 90 || item.rotation === 270) {
          canvas.width = img.height;
          canvas.height = img.width;
        } else {
          canvas.width = img.width;
          canvas.height = img.height;
        }

        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(radians);
        ctx.drawImage(img, -img.width / 2, -img.height / 2);

        const ratio = Math.min(
          pageWidth / canvas.width,
          pageHeight / canvas.height
        );
        const imgW = canvas.width * ratio;
        const imgH = canvas.height * ratio;
        const x = (pageWidth - imgW) / 2;
        const y = (pageHeight - imgH) / 2;

        doc.addImage(canvas.toDataURL("image/png"), "PNG", x, y, imgW, imgH);
      } catch (err: unknown) {
        // Add a check to ensure item is defined before accessing fileName
        if (item) {
          console.error(`Erro ao processar imagem ${item.fileName}:`, err);
        } else {
          console.error(`Erro ao processar imagem:`, err);
        }
      }
    }
  }

  // Save the combined PDF
  await savePDF(doc, "combined-columns");
}
