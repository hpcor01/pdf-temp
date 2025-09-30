"use client";

import { RefreshCcw, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAutoUpdate } from "@/hooks/use-auto-update";
import { useLanguageKey } from "@/hooks/use-i18n";

/**
 * Toast notification for app updates
 * Displays when a new version is available and allows user to update
 */
export function UpdateToast() {
  const { hasUpdate, reload, isLoading } = useAutoUpdate();
  const [isVisible, setIsVisible] = useState(false);
  const [autoReloadTimeout, setAutoReloadTimeout] =
    useState<NodeJS.Timeout | null>(null);

  // Update toast translations
  const updateToastTranslations = useLanguageKey("update-toast");

  useEffect(() => {
    if (hasUpdate) {
      setIsVisible(true);

      const autoReloadDelay = parseInt(
        process.env.NEXT_PUBLIC_AUTO_RELOAD_DELAY || "0",
        10
      );

      if (autoReloadDelay > 0) {
        const timeout = setTimeout(() => {
          reload();
        }, autoReloadDelay);

        setAutoReloadTimeout(timeout);
      }
    }
  }, [hasUpdate, reload]);

  useEffect(() => {
    return () => {
      if (autoReloadTimeout) {
        clearTimeout(autoReloadTimeout);
      }
    };
  }, [autoReloadTimeout]);

  if (!hasUpdate || !isVisible) return null;

  const handleUpdate = () => {
    if (autoReloadTimeout) clearTimeout(autoReloadTimeout);
    reload();
  };

  const handleDismiss = () => {
    setIsVisible(false);
    if (autoReloadTimeout) clearTimeout(autoReloadTimeout);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-background border border-border rounded-lg shadow-lg p-4 max-w-sm">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <h3 className="font-medium text-foreground">
              {updateToastTranslations["new-version-title"]}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {updateToastTranslations["new-version-description"]}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
            aria-label={updateToastTranslations["close-notification"]}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex gap-2 mt-4">
          <Button
            onClick={handleUpdate}
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? (
              <>
                <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
                {updateToastTranslations.updating}
              </>
            ) : (
              updateToastTranslations.update
            )}
          </Button>
          <Button variant="outline" onClick={handleDismiss}>
            {updateToastTranslations.later}
          </Button>
        </div>
      </div>
    </div>
  );
}
