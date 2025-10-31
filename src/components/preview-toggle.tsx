"use client";

import { useId } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useLanguageKey } from "@/hooks/use-i18n";
import { usePreview } from "@/providers/preview-provider";
import type { PreviewToggleProps } from "@/types/preview-toggle";

export function PreviewToggle({ isProcessing }: PreviewToggleProps) {
  const { isPreviewerImageChecked, setIsPreviewerImageChecked } = usePreview();
  const togglePreviewerImage = useId();
  const toggleButtonPreviewerImages = useLanguageKey(
    "buttons.button-toggle-previewer-image"
  );

  const handlePreviewerImageChange = (checked: boolean) => {
    setIsPreviewerImageChecked(checked);
  };

  return (
    <div className="flex items-center gap-2">
      <Switch
        id={togglePreviewerImage}
        checked={isPreviewerImageChecked}
        onCheckedChange={handlePreviewerImageChange}
        className="cursor-pointer"
        disabled={false}
      />
      <Label htmlFor={togglePreviewerImage} className="cursor-pointer py-2">
        {isPreviewerImageChecked
          ? toggleButtonPreviewerImages.active
          : toggleButtonPreviewerImages.disabled}
      </Label>
    </div>
  );
}
