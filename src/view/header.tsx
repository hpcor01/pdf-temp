"use client";

import { useId, useState } from "react";
import ComboboxChangeLanguage from "@/components/combobox-change-language";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Toast } from "@/components/ui/toast";
import { useLanguageKey } from "@/hooks/use-i18n";
import { generatePDFForColumns } from "@/lib/pdf";
import { removeBackgroundBatch } from "@/lib/rem-bg";
import { useKanban } from "@/providers/kanban-provider";
import type { HeaderProps } from "@/types/header";
import type { Column } from "@/types/kanban";

export default function Header({
  onToggleAllChange,
  toggleAllColumnsSave,
}: HeaderProps) {
  const {
    toggleAllColumnsSelection,
    areAllColumnsSelected,
    selectedColumns,
    columns,
  } = useKanban();
  const buttons = useLanguageKey("buttons");
  const toggleButtonLabels = useLanguageKey(
    "buttons.button-toggle-selected-all"
  );

  const removeBgId = useId();
  const convertToPDF = useId();
  const toggleAllColumns = useId();

  const [isConvertToPDFChecked, setIsConvertToPDFChecked] = useState(true);
  const [isRemoveBgChecked, setIsRemoveBgChecked] = useState(true);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastVariant, setToastVariant] = useState<"default" | "destructive">(
    "default"
  );
  const [toastTitle, setToastTitle] = useState("");
  const [toastDescription, setToastDescription] = useState("");
  const selectedColumnsCount =
    Object.values(selectedColumns).filter(Boolean).length;
  const isSaveButtonEnabled = selectedColumnsCount > 0;

  const handleToggleAllChange = (checked: boolean) => {
    toggleAllColumnsSelection(checked);
    onToggleAllChange?.(checked);
    toggleAllColumnsSave?.(checked);
  };

  const handleConvertToPDFChange = (checked: boolean) => {
    setIsConvertToPDFChecked(checked);
  };

  const handleRemoveBgChange = (checked: boolean) => {
    setIsRemoveBgChecked(checked);
  };

  const showToast = (
    variant: "default" | "destructive",
    title: string,
    description: string
  ) => {
    setToastVariant(variant);
    setToastTitle(title);
    setToastDescription(description);
    setToastOpen(true);

    // Auto close toast after 5 seconds
    setTimeout(() => {
      setToastOpen(false);
    }, 5000);
  };

  const triggerDownload = (url: string, filename: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveClick = async () => {
    try {
      // Get selected columns
      const selectedCols = columns.filter((col) => selectedColumns[col.id]);

      if (selectedCols.length === 0) {
        showToast(
          "destructive",
          "Nenhuma coluna selecionada",
          "Selecione pelo menos uma coluna para salvar."
        );
        return;
      }

      // Case 1: Remove background + Convert to PDF
      if (isRemoveBgChecked && isConvertToPDFChecked) {
        // Process all images to remove background
        const processedColumns: Column[] = [];

        for (const col of selectedCols) {
          const processedItems = await removeBackgroundBatch(col.items);
          processedColumns.push({
            ...col,
            items: processedItems,
          });
        }

        // Generate PDFs with processed images
        for (const col of processedColumns) {
          await generatePDFForColumns([col], { [col.id]: true });
        }

        showToast(
          "default",
          "PDFs gerados",
          `${selectedCols.length} PDF(s) foram salvos com fundo removido.`
        );
      }
      // Case 2: Convert to PDF only (no background removal)
      else if (!isRemoveBgChecked && isConvertToPDFChecked) {
        await generatePDFForColumns(columns, selectedColumns);
        showToast(
          "default",
          "PDF gerado",
          `${selectedColumnsCount} PDF(s) foram salvos.`
        );
      }
      // Case 3: Remove background only (no PDF conversion)
      else if (isRemoveBgChecked && !isConvertToPDFChecked) {
        // Process all images and download individually
        let downloadCount = 0;

        for (const col of selectedCols) {
          const processedItems = await removeBackgroundBatch(col.items);

          // Download each processed image
          for (const item of processedItems) {
            triggerDownload(item.src, item.fileName);
            downloadCount++;
          }
        }

        showToast(
          "default",
          "Imagens baixadas",
          `${downloadCount} imagem(s) foram baixadas com fundo removido.`
        );
      }
      // Case 4: No processing (original behavior)
      else {
        showToast(
          "default",
          "Download iniciado",
          `Baixando imagens individuais...`
        );
      }
    } catch (error: unknown) {
      if (error instanceof Error && error?.name === "AbortError") {
        showToast("default", "Cancelado", "Operação de salvamento cancelada.");
      } else {
        showToast("destructive", "Erro", "Falha ao processar as imagens.");
      }
    }
  };

  return (
    <>
      <Toast
        open={toastOpen}
        onOpenChange={setToastOpen}
        variant={toastVariant}
        title={toastTitle}
        description={toastDescription}
      />
      <header className="flex flex-wrap gap-4 justify-between items-center border-1 rounded-b-lg p-2.5">
        <section className="flex flex-wrap items-center gap-4">
          <ModeToggle />
          <ComboboxChangeLanguage />
        </section>

        <section className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor={toggleAllColumns} className="cursor-pointer py-2">
              <Checkbox
                id={toggleAllColumns}
                className="cursor-pointer"
                checked={areAllColumnsSelected}
                onCheckedChange={(checked) =>
                  handleToggleAllChange(checked as boolean)
                }
              />
              {areAllColumnsSelected
                ? toggleButtonLabels.disabled
                : toggleButtonLabels.active}
            </Label>
          </div>

          <div className="flex items-center gap-2">
            <Label htmlFor={removeBgId} className="cursor-pointer py-2">
              <Checkbox
                id={removeBgId}
                checked={isRemoveBgChecked}
                onCheckedChange={handleRemoveBgChange}
                className="cursor-pointer"
              />
              {buttons["button-remove-background"]}
            </Label>
          </div>

          <div className="flex items-center gap-2">
            <Label htmlFor={convertToPDF} className="cursor-pointer py-2">
              <Checkbox
                id={convertToPDF}
                checked={isConvertToPDFChecked}
                onCheckedChange={handleConvertToPDFChange}
                className="cursor-pointer"
              />
              {buttons["button-convert-to-pdf"]}
            </Label>
          </div>

          <div>
            <Button
              className="cursor-pointer"
              disabled={!isSaveButtonEnabled}
              onClick={handleSaveClick}
            >
              {buttons["button-save"]}{" "}
              {selectedColumnsCount > 0 ? `(${selectedColumnsCount})` : ""}
            </Button>
          </div>
        </section>
      </header>
    </>
  );
}
