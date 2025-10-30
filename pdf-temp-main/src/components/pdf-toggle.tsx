"use client";

import { useId } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useLanguageKey } from "@/hooks/use-i18n";
import type { PDFToggleProps } from "@/types/pdf-toggle";

export function PDFToggle({
  isProcessing,
  isConvertToPDFChecked,
  setIsConvertToPDFChecked,
}: PDFToggleProps) {
  const convertToPDF = useId();
  const buttons = useLanguageKey("buttons");

  const handleConvertToPDFChange = (checked: boolean) => {
    setIsConvertToPDFChecked(checked);
  };

  return (
    <div className="flex items-center gap-2">
      <Checkbox
        id={convertToPDF}
        checked={isConvertToPDFChecked}
        onCheckedChange={handleConvertToPDFChange}
        className="cursor-pointer"
        disabled={isProcessing}
      >
        <Label htmlFor={convertToPDF} className="cursor-pointer py-2">
          {buttons["button-convert-to-pdf"]}
        </Label>
      </Checkbox>
    </div>
  );
}
