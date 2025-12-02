declare namespace NodeJS {
  interface ProcessEnv {
    VERCEL?: string;
    VERCEL_ENV?: "development" | "preview" | "production";
    VERCEL_GIT_COMMIT_SHA?: string;
    VERCEL_URL?: string;

    NEXT_PUBLIC_VERSION?: string;
    NEXT_PUBLIC_POLL_INTERVAL?: string;
    NEXT_PUBLIC_AUTO_RELOAD_DELAY?: string;

    REMOVE_BG_API_KEY?: string;
    GEMINI_API_KEY?: string;
  }
}
