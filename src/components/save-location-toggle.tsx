"use client";

import { useCallback, useId } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useLanguageKey } from "@/hooks/use-i18n";
import { directoryHandleManager } from "@/lib/directory-handle";
import type { SaveLocationToggleProps } from "@/types/save-location-toggle";

export function SaveLocationToggle({
  isProcessing,
  isSingleSaveLocation,
  setIsSingleSaveLocation,
  setSaveFolderPath,
  setToastVariant,
  setToastTitle,
  setToastDescription,
  setToastOpen,
}: SaveLocationToggleProps) {
  const saveLocationId = useId();
  const saveLocationTranslations = useLanguageKey("save-location-toggle");

  // Local implementation of showToast since we can't import useToast without providing arguments
  const showToast = useCallback(
    (
      variant: "default" | "destructive",
      title: string,
      description: string
    ) => {
      setToastVariant(variant);
      setToastTitle(title);
      setToastDescription(description);
      setToastOpen(true);
      setTimeout(() => setToastOpen(false), 5000);
    },
    [setToastVariant, setToastTitle, setToastDescription, setToastOpen]
  );

  const handleSaveLocationChange = useCallback(
    async (isSingle: boolean) => {
      setIsSingleSaveLocation(isSingle);
      // If enabling single save location, prompt for folder selection
      if (isSingle) {
        try {
          // Check if the File System Access API is supported
          if ("showDirectoryPicker" in window && window.showDirectoryPicker) {
            const dirHandle = await window.showDirectoryPicker({
              mode: "readwrite",
            });
            directoryHandleManager.setDirectoryHandle(dirHandle);
            // Due to browser security restrictions, we can't get the full path
            // We'll use a descriptive representation instead
            const path = `Selected folder: ${dirHandle.name}`;
            setSaveFolderPath(path);
            // Show toast notification when folder is selected
            showToast(
              "default",
              saveLocationTranslations["folder-selected-title"],
              saveLocationTranslations["folder-selected-description"].replace(
                "{path}",
                dirHandle.name // Use just the name in the toast for clarity
              )
            );
          } else {
            // Fallback for browsers that don't support the File System Access API
            const path = prompt(
              saveLocationTranslations["select-folder-prompt"],
              ""
            );
            if (path !== null) {
              setSaveFolderPath(path);
              // Show toast notification when folder is selected
              showToast(
                "default",
                saveLocationTranslations["folder-selected-title"],
                saveLocationTranslations["folder-selected-description"].replace(
                  "{path}",
                  path
                )
              );
            } else {
              // User cancelled, revert the selection
              setIsSingleSaveLocation(false);
            }
          }
        } catch (error) {
          // User cancelled the directory picker or there was an error
          console.error("Error selecting directory:", error);
          setIsSingleSaveLocation(false);
          setSaveFolderPath("");

          // Show error message to user
          showToast(
            "destructive",
            saveLocationTranslations["error-selecting-folder-title"],
            saveLocationTranslations["error-selecting-folder-description"]
          );
        }
      } else {
        // When disabling single save location, clear the stored handle
        directoryHandleManager.clearDirectoryHandle();
        setSaveFolderPath("");
      }
    },
    [
      setIsSingleSaveLocation,
      setSaveFolderPath,
      showToast,
      saveLocationTranslations["folder-selected-title"],
      saveLocationTranslations["folder-selected-description"],
      saveLocationTranslations["error-selecting-folder-title"],
      saveLocationTranslations["error-selecting-folder-description"],
      saveLocationTranslations["select-folder-prompt"],
    ]
  );

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <Checkbox
          id={`${saveLocationId}-separate`}
          checked={!isSingleSaveLocation}
          onCheckedChange={(checked) => {
            if (checked) {
              handleSaveLocationChange(false);
            }
          }}
          className="cursor-pointer"
          disabled={isProcessing}
        />
        <Label
          htmlFor={`${saveLocationId}-separate`}
          className="cursor-pointer py-2"
        >
          {saveLocationTranslations["folder-per-column"]}
        </Label>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id={`${saveLocationId}-group`}
          checked={isSingleSaveLocation}
          onCheckedChange={(checked) => {
            if (checked) {
              handleSaveLocationChange(true);
            }
          }}
          className="cursor-pointer"
          disabled={isProcessing}
        />
        <Label
          htmlFor={`${saveLocationId}-group`}
          className="cursor-pointer py-2"
        >
          {saveLocationTranslations["single-folder"]}
        </Label>
      </div>
    </div>
  );
}
