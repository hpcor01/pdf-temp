# Auto Update Feature

This document explains how the automatic update feature works in this Next.js application.

## How It Works

1. **Version Detection**: The system uses the Git commit SHA as the version identifier
2. **API Endpoint**: A `/api/version` endpoint exposes the current build version
3. **Frontend Polling**: The frontend polls this endpoint every 30 seconds (configurable)
4. **Update Notification**: When a version mismatch is detected, a toast notification appears
5. **User Action**: Users can click "Update" to reload with the new version

## Environment Variables

The following environment variables can be configured:

| Variable                        | Description                                      | Default            |
| ------------------------------- | ------------------------------------------------ | ------------------ |
| `NEXT_PUBLIC_POLL_INTERVAL`     | Polling interval in milliseconds                 | 30000 (30 seconds) |
| `NEXT_PUBLIC_AUTO_RELOAD_DELAY` | Auto-reload delay in milliseconds (0 to disable) | 0 (disabled)       |

## How to Test

1. Deploy the application to Vercel
2. Make a change and deploy again
3. Keep the first version open in a browser
4. The update notification should appear within 30 seconds

## How to Configure

To enable auto-reload with a 10-second delay:

```bash
NEXT_PUBLIC_AUTO_RELOAD_DELAY=10000
```

To change polling interval to 1 minute:

```bash
NEXT_PUBLIC_POLL_INTERVAL=60000
```

## Technical Details

### API Route (`/api/version`)

- Returns the current build version as JSON
- Has `no-store` cache headers to prevent caching
- Uses `VERCEL_GIT_COMMIT_SHA` environment variable

### Hook (`useAutoUpdate`)

- Automatically starts polling when mounted
- Only runs in production environment
- Compares current version with remote version
- Exposes `hasUpdate`, `reload`, and `isLoading` states

### Component (`UpdateToast`)

- Displays when an update is available
- Provides "Update" and "Later" options
- Supports auto-reload with configurable delay
- Clean animation using Tailwind classes

## Security Considerations

- The API endpoint is public but only exposes a commit SHA
- No sensitive information is exposed
- Polling is disabled in development environment
- All requests use standard HTTP GET method
