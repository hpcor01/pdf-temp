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
import { useKanban } from "@/providers/kanban-provider";
import type { HeaderProps } from "@/types/header";

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

  const handleSaveClick = async () => {
    try {
      if (isConvertToPDFChecked) {
        await generatePDFForColumns(columns, selectedColumns);
        showToast(
          "default",
          "PDF gerado",
          `${selectedColumnsCount} PDF(s) foram salvos.`
        );
      } else {
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
        showToast("destructive", "Erro", "Falha ao gerar os PDFs.");
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
                defaultChecked
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
