# Desktop Cloud Sync Guide

## Architecture

`code-space-desktop` operates as an offline-first client. Changes are saved locally to `userData/db.json` and synchronized in the background with `code-space-api`.

```
Desktop App (Zustand + db.json) <──> Express API (/sync) <──> MySQL 8.0
```

## Sync Rules

1. **Local Autonomy**: Desktop mutations write to disk immediately without waiting for API responses.
2. **Debounced Push**: Electron main process buffers local changes (2s debounce) before invoking `POST /api/v1/sync/push`.
3. **Last-Write-Wins (LWW)**: Server reconciles conflict by comparing `updatedAt` timestamps. Stale payloads receive an authoritative server pull payload to reconcile local storage.

## Data Structure

```json
{
  "clientDeviceId": "win-desktop-01",
  "dbState": {
    "theme": "cyberpunk",
    "font": "inter",
    "terminalFontSize": 14,
    "workspacePresets": [],
    "cliSettings": { "customClis": [], "builtInOverrides": {} },
    "customSounds": [],
    "directoryHistory": []
  }
}
```
