"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Define the version response type
interface VersionResponse {
  version: string;
}

/**
 * Hook to automatically detect when a new version of the app is available
 * Polls the version API at intervals and notifies when an update is available
 *
 * @returns Object containing:
 * - hasUpdate: boolean indicating if a new version is available
 * - reload: function to reload the page with the new version
 * - isLoading: boolean indicating if the hook is currently checking for updates
 */
export function useAutoUpdate() {
  const [hasUpdate, setHasUpdate] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const currentVersion = useRef<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize the current version from environment variables
  useEffect(() => {
    // Only run in browser environment
    if (typeof window !== "undefined") {
      // Get the current version from environment variables
      // This is set at build time by Next.js
      currentVersion.current = process.env.NEXT_PUBLIC_VERSION || "development";
    }
  }, []);

  // Function to check for updates
  const checkForUpdate = useCallback(async () => {
    // Only check for updates in production
    if (process.env.NODE_ENV !== "production") {
      return;
    }

    // Don't check if we're already showing an update
    if (hasUpdate) {
      return;
    }

    try {
      setIsLoading(true);

      // Fetch the current version from the API
      const response = await fetch("/api/version", {
        cache: "no-store", // Ensure we don't get a cached response
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch version: ${response.status}`);
      }

      const data: VersionResponse = await response.json();
      const remoteVersion = data.version;

      // Compare versions - if different, we have an update
      if (currentVersion.current && remoteVersion !== currentVersion.current) {
        setHasUpdate(true);
      }
    } catch (error) {
      console.error("Error checking for updates:", error);
    } finally {
      setIsLoading(false);
    }
  }, [hasUpdate]);

  // Set up polling interval
  useEffect(() => {
    // Only run in production and browser environment
    if (
      process.env.NODE_ENV !== "production" ||
      typeof window === "undefined"
    ) {
      return;
    }

    // Get polling interval from environment variable or default to 30 seconds
    const pollInterval = parseInt(
      process.env.NEXT_PUBLIC_POLL_INTERVAL || "30000",
      10,
    );

    // Start polling
    intervalRef.current = setInterval(checkForUpdate, pollInterval);

    // Check immediately on mount
    checkForUpdate();

    // Clean up interval on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [checkForUpdate]); // Add checkForUpdate as dependency

  // Function to reload the page with the new version
  const reload = () => {
    // Force reload from server, bypassing cache
    window.location.reload();
  };

  return {
    hasUpdate,
    reload,
    isLoading,
  };
}
