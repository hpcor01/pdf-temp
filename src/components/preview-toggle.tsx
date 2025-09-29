"use client";

import { useId } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useLanguageKey } from "@/hooks/use-i18n";
import { usePreview } from "@/providers/preview-provider";
import type { PreviewToggleProps } from "@/types/preview-toggle";

export function PreviewToggle({ isProcessing }: PreviewToggleProps) {
  const { isPreviewerImageChecked, setIsPreviewerImageChecked } = usePreview();
  const togglePreviewerImage = useId();
  const toggleButtonPreviewerImages = useLanguageKey(
    "buttons.button-toggle-previewer-image",
  );

  const handlePreviewerImageChange = (checked: boolean) => {
    setIsPreviewerImageChecked(checked);
  };

  return (
    <div className="flex items-center gap-2">
      <Checkbox
        id={togglePreviewerImage}
        checked={isPreviewerImageChecked}
        onCheckedChange={handlePreviewerImageChange}
        className="cursor-pointer"
        disabled={isProcessing}
      >
        <Label htmlFor={togglePreviewerImage} className="cursor-pointer py-2">
          {isPreviewerImageChecked
            ? toggleButtonPreviewerImages.active
            : toggleButtonPreviewerImages.disabled}
        </Label>
      </Checkbox>
    </div>
  );
}
