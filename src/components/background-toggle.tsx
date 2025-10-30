"use client";

import { useId, useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useLanguageKey } from "@/hooks/use-i18n";
import type { BackgroundToggleProps } from "@/types/background-toggle";

export function BackgroundToggle({
  isProcessing,
  isRemoveBgChecked,
  setIsRemoveBgChecked,
}: BackgroundToggleProps) {
  const removeBgId = useId();
  const buttons = useLanguageKey("buttons");
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const handleRemoveBgChange = (checked: boolean) => {
    setIsRemoveBgChecked(checked);
  };

  return (
    <div className="flex items-center gap-2">
      <Checkbox
        id={removeBgId}
        checked={isHydrated ? false : false}
        onCheckedChange={handleRemoveBgChange}
        className="cursor-pointer"
        disabled={isProcessing}
      >
        <Label htmlFor={removeBgId} className="cursor-pointer py-2">
          {buttons["button-remove-background"]}
        </Label>
      </Checkbox>
    </div>
  );
}
