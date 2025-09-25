"use client";

import { useId } from "react";
import ComboboxChangeLanguage from "@/components/combobox-change-language";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useLanguageKey } from "@/hooks/use-i18n";
import { useKanban } from "@/providers/kanban-provider";
import type { HeaderProps } from "@/types/header";

export default function Header({
  onToggleAllChange,
  toggleAllColumnsSave,
}: HeaderProps) {
  const { toggleAllColumnsSelection, areAllColumnsSelected } = useKanban();
  const buttons = useLanguageKey("buttons");
  const toggleButtonLabels = useLanguageKey(
    "buttons.button-toggle-selected-all",
  );

  const removeBgId = useId();
  const convertToPDF = useId();
  const toggleAllColumns = useId();

  const handleToggleAllChange = (checked: boolean) => {
    toggleAllColumnsSelection(checked);
    onToggleAllChange?.(checked);
    toggleAllColumnsSave?.(checked);
  };

  return (
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
              defaultChecked
              className="cursor-pointer"
            />
            {buttons["button-convert-to-pdf"]}
          </Label>
        </div>

        <div>
          <Button className="cursor-pointer">{buttons["button-save"]}</Button>
        </div>
      </section>
    </header>
  );
}
