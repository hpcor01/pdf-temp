"use client";

import { useCallback, useId } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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

  // Local implementation of showToast since we can't import useToast without providing arguments
  const showToast = useCallback(
    (
      variant: "default" | "destructive",
      title: string,
      description: string,
    ) => {
      setToastVariant(variant);
      setToastTitle(title);
      setToastDescription(description);
      setToastOpen(true);
      setTimeout(() => setToastOpen(false), 5000);
    },
    [setToastVariant, setToastTitle, setToastDescription, setToastOpen],
  );

  const handleSaveLocationChange = useCallback(
    async (checked: boolean) => {
      setIsSingleSaveLocation(checked);
      // If enabling single save location, prompt for folder selection
      if (checked) {
        try {
          // Check if the File System Access API is supported
          if ("showDirectoryPicker" in window && window.showDirectoryPicker) {
            const dirHandle = await window.showDirectoryPicker({
              mode: "readwrite",
            });
            directoryHandleManager.setDirectoryHandle(dirHandle);
            const path = dirHandle.name; // Get the directory name
            setSaveFolderPath(path);
            // Show toast notification when folder is selected
            showToast(
              "default",
              "Pasta de salvamento selecionada",
              `A pasta "${path}" será usada para salvar todos os arquivos.`,
            );
          } else {
            // Fallback for browsers that don't support the File System Access API
            const path = prompt(
              "Selecione a pasta onde deseja salvar (OneDrive é compatível):",
              "",
            );
            if (path !== null) {
              setSaveFolderPath(path);
              // Show toast notification when folder is selected
              showToast(
                "default",
                "Pasta de salvamento selecionada",
                `A pasta "${path}" será usada para salvar todos os arquivos.`,
              );
            } else {
              // User cancelled, revert the switch
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
            "Erro ao selecionar pasta",
            "Não foi possível acessar a pasta selecionada. Verifique se a pasta está disponível e tente novamente.",
          );
        }
      } else {
        // When disabling single save location, clear the stored handle
        directoryHandleManager.clearDirectoryHandle();
        setSaveFolderPath("");
      }
    },
    [setIsSingleSaveLocation, setSaveFolderPath, showToast],
  );

  return (
    <div className="flex items-center gap-2 relative">
      <Switch
        id={saveLocationId}
        checked={isSingleSaveLocation}
        onCheckedChange={handleSaveLocationChange}
        className="cursor-pointer"
        disabled={isProcessing}
      />
      <Label htmlFor={saveLocationId} className="cursor-pointer py-2">
        Salvar
        {isSingleSaveLocation
          ? " (uma pasta única)"
          : " (uma pasta por coluna)"}
      </Label>
    </div>
  );
}
