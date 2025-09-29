"use client";

import { useId } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useLanguageKey } from "@/hooks/use-i18n";
import { useKanban } from "@/providers/kanban-provider";
import type { SelectionToggleProps } from "@/types/selection-toggle";

export function SelectionToggle({
  onToggleAllChange,
  toggleAllColumnsSave,
}: SelectionToggleProps) {
  const { toggleAllColumnsSelection, areAllColumnsSelected } = useKanban();

  const toggleAllColumns = useId();
  const toggleButtonLabels = useLanguageKey(
    "buttons.button-toggle-selected-all",
  );

  const handleToggleAllChange = (checked: boolean) => {
    toggleAllColumnsSelection(checked);
    onToggleAllChange?.(checked);
    toggleAllColumnsSave?.(checked);
  };

  return (
    <div className="flex items-center gap-2">
      <Checkbox
        id={toggleAllColumns}
        className="cursor-pointer"
        checked={areAllColumnsSelected}
        onCheckedChange={(checked) => handleToggleAllChange(checked as boolean)}
      >
        <Label htmlFor={toggleAllColumns} className="cursor-pointer py-2">
          {areAllColumnsSelected
            ? toggleButtonLabels.disabled
            : toggleButtonLabels.active}
        </Label>
      </Checkbox>
    </div>
  );
}
