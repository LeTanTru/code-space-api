# Desktop Cloud Sync Guide

## Architecture

`code-space-desktop` operates with an online-only cloud architecture requiring an active network connection to `code-space-api`. Local changes are persisted and synchronized with `code-space-api` over REST.

```
Desktop App (Zustand) <── REST API (/sync) ──> NestJS API <──> MySQL 8.0
```

## Sync Rules

1. **Online Requirement**: Desktop application requires an active internet connection to communicate with `code-space-api`.
2. **Debounced Push**: Electron main process buffers local changes (2s debounce) before invoking `POST /api/v1/sync/push`.
3. **Last-Write-Wins (LWW)**: Server reconciles state synchronization by comparing `updatedAt` timestamps. Stale payloads receive an authoritative server pull payload to reconcile state.

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
