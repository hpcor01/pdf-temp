"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAutoUpdate } from "@/hooks/use-auto-update";

/**
 * Toast notification for app updates
 * Displays when a new version is available and allows user to update
 */
export function UpdateToast() {
  const { hasUpdate, reload, isLoading } = useAutoUpdate();
  const [isVisible, setIsVisible] = useState(false);
  const [autoReloadTimeout, setAutoReloadTimeout] =
    useState<NodeJS.Timeout | null>(null);

  // Show toast when update is available
  useEffect(() => {
    if (hasUpdate) {
      setIsVisible(true);

      // Set auto-reload timeout if configured
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

  // Clear auto-reload timeout when component unmounts
  useEffect(() => {
    return () => {
      if (autoReloadTimeout) {
        clearTimeout(autoReloadTimeout);
      }
    };
  }, [autoReloadTimeout]);

  // Don't render anything if no update or not visible
  if (!hasUpdate || !isVisible) {
    return null;
  }

  // Function to handle update click
  const handleUpdate = () => {
    // Clear any pending auto-reload
    if (autoReloadTimeout) {
      clearTimeout(autoReloadTimeout);
    }

    // Reload the page
    reload();
  };

  // Function to dismiss the toast
  const handleDismiss = () => {
    setIsVisible(false);

    // Clear any pending auto-reload
    if (autoReloadTimeout) {
      clearTimeout(autoReloadTimeout);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-background border border-border rounded-lg shadow-lg p-4 max-w-sm">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <h3 className="font-medium text-foreground">
              Nova versão disponível
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Uma nova versão do aplicativo está disponível. Clique em Atualizar
              para carregar a nova versão.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
            aria-label="Fechar notificação"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              role="img"
              aria-label="Fechar"
            >
              <title>Fechar</title>
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
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
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-2 h-4 w-4 animate-spin"
                  role="img"
                  aria-label="Carregando"
                >
                  <title>Carregando</title>
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
                </svg>
                Atualizando...
              </>
            ) : (
              "Atualizar"
            )}
          </Button>
          <Button variant="outline" onClick={handleDismiss}>
            Depois
          </Button>
        </div>
      </div>
    </div>
  );
}
