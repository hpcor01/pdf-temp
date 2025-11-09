"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import ComboboxChangeLanguage from "@/components/combobox-change-language";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { Toast } from "@/components/ui/toast";
import { useLanguageKey } from "@/hooks/use-i18n";
import { directoryHandleManager } from "@/lib/directory-handle";
import {
  generatePDFForColumnBlob,
  generatePDFForColumns,
  generateSinglePDFForColumns,
  savePDFToDirectory,
} from "@/lib/pdf";

import { useKanban } from "@/providers/kanban-provider";
import type { HeaderProps } from "@/types/header";
import type { Column } from "@/types/kanban";
import { useSaveLocation } from "../hooks/use-save-location";
import { useToast } from "../hooks/use-toast";
import { BackgroundToggle } from "./background-toggle";
import { LoadingOverlay } from "./loading-overlay";
import { PDFToggle } from "./pdf-toggle";
import { PreviewToggle } from "./preview-toggle";
import { SaveLocationToggle } from "./save-location-toggle";
import { SelectionToggle } from "./selection-toggle";

export function Header({
  onToggleAllChange,
  toggleAllColumnsSave,
}: HeaderProps) {
  const { selectedColumns, columns } = useKanban();

  const buttons = useLanguageKey("buttons");
  const headerTranslations = useLanguageKey("header");
  const saveLocationTranslations = useLanguageKey("save-location-toggle");

  const [isConvertToPDFChecked, setIsConvertToPDFChecked] = useState(true);
  const [isRemoveBgChecked, setIsRemoveBgChecked] = useState(false);
  const [isSingleSaveLocation, setIsSingleSaveLocation] = useState(false);
  const [saveFolderPath, setSaveFolderPath] = useState("");
  const [toastOpen, setToastOpen] = useState(false);
  const [toastVariant, setToastVariant] = useState<"default" | "destructive">(
    "default"
  );
  const [toastTitle, setToastTitle] = useState("");
  const [toastDescription, setToastDescription] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const selectedColumnsCount =
    Object.values(selectedColumns).filter(Boolean).length;
  const isSaveButtonEnabled = selectedColumnsCount > 0 && !isProcessing;

  const { showToast } = useToast({
    setToastVariant,
    setToastTitle,
    setToastDescription,
    setToastOpen,
  });

  useSaveLocation({
    showToast,
  });

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
      setIsProcessing(true);

      showToast(
        "default",
        headerTranslations.processing,
        headerTranslations["generating-file"]
      );

      const selectedCols = columns.filter((col) => selectedColumns[col.id]);

      if (selectedCols.length === 0) {
        setIsProcessing(false);
        showToast(
          "destructive",
          headerTranslations["no-column-selected-title"],
          headerTranslations["no-column-selected-description"]
        );
        return;
      }

      // New behavior: when isSingleSaveLocation is true and saveFolderPath is set
      if (isSingleSaveLocation && saveFolderPath) {
        // Get the directory handle from the manager
        const directoryHandle = directoryHandleManager.getDirectoryHandle();

        if (directoryHandle) {
          // Process each selected column
          let successCount = 0;
          let errorCount = 0;

          for (const col of selectedCols) {
            try {
              // Generate PDF blob for the column
              const blob = await generatePDFForColumnBlob(col);

              // Save PDF to directory
              const success = await savePDFToDirectory(
                blob,
                directoryHandle,
                col.title
              );

              if (success) {
                successCount++;
              } else {
                errorCount++;
              }
            } catch (error) {
              console.error(`Erro ao processar coluna ${col.title}:`, error);
              errorCount++;
            }
          }

          // Show result toast
          setIsProcessing(false);
          if (errorCount === 0) {
            showToast(
              "default",
              headerTranslations["pdfs-generated-title"],
              headerTranslations["pdfs-generated-description"].replace(
                "{{count}}",
                successCount.toString()
              )
            );
          } else {
            showToast(
              "destructive",
              headerTranslations["partial-error-title"],
              `Foram salvos ${successCount} de ${selectedCols.length} arquivos. ${errorCount} arquivos falharam.`
            );
          }

          return;
        } else if (!("showDirectoryPicker" in window)) {
          // Browser doesn't support File System Access API
          showToast(
            "destructive",
            headerTranslations["unsupported-browser-title"],
            headerTranslations["unsupported-browser-description"]
          );
          setIsProcessing(false);
          return;
        } else {
          // Directory handle not available
          showToast(
            "destructive",
            headerTranslations["error-accessing-folder-title"],
            saveLocationTranslations["error-selecting-folder-description"]
          );
          setIsProcessing(false);
          return;
        }
      }

      if (isRemoveBgChecked && isConvertToPDFChecked) {
        const processedColumns: Column[] = [];

        for (const col of selectedCols) {
          const processedItems = await removeBackgroundBatch(col.items);
          processedColumns.push({
            ...col,
            items: processedItems,
          });
        }

        if (isSingleSaveLocation) {
          // Generate a single PDF with all columns when single save location is enabled
          await generateSinglePDFForColumns(
            processedColumns,
            processedColumns.reduce(
              (acc, col) => {
                acc[col.id] = true;
                return acc;
              },
              {} as Record<string, boolean>
            )
          );

          setIsProcessing(false);
          showToast(
            "default",
            headerTranslations["pdfs-generated-title"],
            headerTranslations["pdfs-generated-description"].replace(
              "{{count}}",
              "1"
            )
          );
        } else {
          // Generate separate PDFs for each column
          for (const col of processedColumns) {
            await generatePDFForColumns([col], { [col.id]: true });
          }

          setIsProcessing(false);
          showToast(
            "default",
            headerTranslations["pdfs-generated-title"],
            headerTranslations["pdfs-generated-description"].replace(
              "{{count}}",
              selectedCols.length.toString()
            )
          );
        }
      } else if (!isRemoveBgChecked && isConvertToPDFChecked) {
        if (isSingleSaveLocation) {
          // Generate a single PDF with all columns when single save location is enabled
          await generateSinglePDFForColumns(columns, selectedColumns);

          setIsProcessing(false);
          showToast(
            "default",
            headerTranslations["pdf-generated-title"],
            headerTranslations["pdf-generated-description"].replace(
              "{{count}}",
              "1"
            )
          );
        } else {
          // Generate separate PDFs for each column
          await generatePDFForColumns(columns, selectedColumns);

          setIsProcessing(false);
          showToast(
            "default",
            headerTranslations["pdf-generated-title"],
            headerTranslations["pdf-generated-description"].replace(
              "{{count}}",
              selectedColumnsCount.toString()
            )
          );
        }
      } else if (isRemoveBgChecked && !isConvertToPDFChecked) {
        let downloadCount = 0;

        for (const col of selectedCols) {
          const processedItems = await removeBackgroundBatch(col.items);
          for (const item of processedItems) {
            triggerDownload(item.src, item.fileName);
            downloadCount++;
          }
        }

        setIsProcessing(false);
        showToast(
          "default",
          headerTranslations["images-downloaded-title"],
          headerTranslations["images-downloaded-description"].replace(
            "{{count}}",
            downloadCount.toString()
          )
        );
      } else {
        setIsProcessing(false);
        showToast(
          "default",
          headerTranslations["download-started-title"],
          headerTranslations["download-started-description"]
        );
      }
    } catch (error: unknown) {
      setIsProcessing(false);
      if (error instanceof Error && error?.name === "AbortError") {
        showToast(
          "default",
          headerTranslations["cancelled-title"],
          headerTranslations["cancelled-description"]
        );
      } else {
        showToast(
          "destructive",
          headerTranslations["error-title"],
          headerTranslations["error-description"]
        );
      }
    }
  };

  return (
    <>
      {isProcessing && (
        <LoadingOverlay message={`${headerTranslations["generating-file"]}`} />
      )}

      <Toast
        open={toastOpen}
        onOpenChange={setToastOpen}
        variant={toastVariant}
        title={toastTitle}
        description={toastDescription}
      />

      <header className="flex flex-wrap gap-4 justify-between items-center border-1 rounded-b-lg p-2.5">
        <section
          className="flex flex-wrap items-center gap-4"
          aria-label={useLanguageKey(
            "combobox-change-language.select-language"
          )}
        >
          <ModeToggle />
          <ComboboxChangeLanguage />
          <PreviewToggle isProcessing={isProcessing} />
        </section>

        <section
          className="flex flex-wrap items-center gap-4 relative"
          aria-label="Actions toolbar"
        >
          <SelectionToggle
            isProcessing={isProcessing}
            onToggleAllChange={onToggleAllChange}
            toggleAllColumnsSave={toggleAllColumnsSave}
          />
          <BackgroundToggle
            isProcessing={isProcessing}
            isRemoveBgChecked={isRemoveBgChecked}
            setIsRemoveBgChecked={setIsRemoveBgChecked}
          />
          <PDFToggle
            isProcessing={isProcessing}
            isConvertToPDFChecked={isConvertToPDFChecked}
            setIsConvertToPDFChecked={setIsConvertToPDFChecked}
          />
          <SaveLocationToggle
            isProcessing={isProcessing}
            isSingleSaveLocation={isSingleSaveLocation}
            setIsSingleSaveLocation={setIsSingleSaveLocation}
            setSaveFolderPath={setSaveFolderPath}
            setToastVariant={setToastVariant}
            setToastTitle={setToastTitle}
            setToastDescription={setToastDescription}
            setToastOpen={setToastOpen}
          />
          <div>
            <Button
              className="cursor-pointer"
              disabled={!isSaveButtonEnabled}
              onClick={handleSaveClick}
              aria-label={buttons["button-save"]}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {headerTranslations.processing}
                </>
              ) : (
                buttons["button-save"]
              )}
              {selectedColumnsCount > 0 && !isProcessing
                ? ` (${selectedColumnsCount})`
                : ""}
            </Button>
          </div>
        </section>
      </header>
    </>
  );
}
