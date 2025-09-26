import jsPDF from "jspdf";
import type { Column } from "@/types/kanban";

/**
 * Extrai a URL original caso seja uma imagem otimizada pelo Next.js
 */
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

/**
 * Carrega a imagem em memória
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (src.startsWith("http")) img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

/**
 * Salva o PDF no navegador (FileSystemAccess API ou fallback .save)
 */
async function savePDF(doc: jsPDF, name: string): Promise<void> {
  const safeName = name.replace(/[/\\?%*:|"<>]/g, "-");
  const blob = doc.output("blob");

  // Check if the File System Access API is supported
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

  // Fallback: download direto
  doc.save(`${safeName}.pdf`);
}

/**
 * Gera um PDF com todas as imagens de uma coluna
 * ✅ Cada imagem é uma página
 * ✅ Mantém rotação aplicada
 */
async function generatePDFForColumn(column: Column): Promise<void> {
  const doc = new jsPDF({ orientation: "landscape", unit: "px", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 0; i < column.items.length; i++) {
    const item = column.items[i];
    try {
      if (i > 0) doc.addPage();

      const src = extractOriginalImageUrl(item.src);
      const img = await loadImage(src);

      // Canvas para aplicar rotação antes de inserir no PDF
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      // Check if context is available
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

      // Ajuste para caber na página mantendo proporção
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

/**
 * Gera PDFs para todas as colunas selecionadas
 */
export async function generatePDFForColumns(
  columns: Column[],
  selected: Record<string, boolean>
): Promise<void> {
  const list = columns.filter((c) => selected[c.id]);
  for (const col of list) {
    await generatePDFForColumn(col);
  }
}
