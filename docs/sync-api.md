# CodeSpace API — Full State Sync & Cloud Backup Module Documentation (`/api/v1/sync`)

This document provides detailed API contracts for online cloud Zustand state snapshot synchronization (`POST /api/v1/sync/push` and `GET /api/v1/sync/pull`).

---

## Response Envelope Structure

```json
{
  "status": "success",
  "data": { ... },
  "message": "<endpoint-specific-message>",
  "meta": {
    "timestamp": 1785564382331,
    "version": "v1",
    "path": "/api/v1/sync/<action>"
  }
}
```

---

## Sync Endpoints Overview

| Endpoint            | Method | Status |   Auth    | Success Message (`message`)       |  Rate Limit  |
| :------------------ | :----: | :----: | :-------: | :-------------------------------- | :----------: |
| `/api/v1/sync/push` | `POST` | `200`  | 🔒 Bearer | `State synchronized successfully` | 30 req / 60s |
| `/api/v1/sync/pull` | `GET`  | `200`  | 🔒 Bearer | `Pull state successfully`         |    Global    |
| `/api/v1/sync/logs` | `GET`  | `200`  | 🔒 Bearer | `Get sync logs successfully`      |    Global    |

---

## Conflict Resolution Rules (Last-Write-Wins)

1. Desktop clients buffer local Zustand changes (e.g. 2s debounce) and invoke `POST /api/v1/sync/push`.
2. The server compares the payload `updatedAt` timestamp with the stored cloud snapshot timestamp.
3. If client `updatedAt >= server.updatedAt`: Server accepts and overwrites cloud snapshot. Returns `synced: true`.
4. If client `updatedAt < server.updatedAt`: Server rejects client push with `synced: false` and returns the latest authoritative server state so the client can reconcile.

---

## Endpoint Details & Examples

### `POST /api/v1/sync/push`

**Request Body:**

```json
{
  "clientDeviceId": "win-desktop-01",
  "updatedAt": "2026-08-02T09:30:00.000Z",
  "dbState": {
    "workspaces": [],
    "presets": [],
    "settings": {},
    "directoryHistory": []
  }
}
```

**Response (`200 OK`):**

```json
{
  "status": "success",
  "data": {
    "synced": true,
    "serverUpdatedAt": "2026-08-02T09:30:00.000Z"
  },
  "message": "State synchronized successfully",
  "meta": { "timestamp": 1785564382331, "version": "v1", "path": "/api/v1/sync/push" }
}
```

---

### `GET /api/v1/sync/pull`

Pulls full cloud backup state snapshot to restore workspace configuration on a new device or fresh install.

**Response (`200 OK`):**

```json
{
  "status": "success",
  "data": {
    "updatedAt": "2026-08-02T09:30:00.000Z",
    "dbState": {
      "workspaces": [],
      "presets": [],
      "settings": {},
      "directoryHistory": []
    }
  },
  "message": "Pull state successfully",
  "meta": { "timestamp": 1785564382331, "version": "v1", "path": "/api/v1/sync/pull" }
}
```

---

### `GET /api/v1/sync/logs`

Retrieves cloud sync auditing history logs (`SyncLog`) for the authenticated user's devices.

**Response (`200 OK`):**

```json
{
  "status": "success",
  "data": [
    {
      "id": "log-uuid-01",
      "clientDeviceId": "win-desktop-01",
      "clientVersion": "1.0.0",
      "status": "SUCCESS",
      "payloadSummary": "Workspaces: 2, Presets: 3, Settings: updated",
      "syncedAt": "2026-08-02T09:30:00.000Z"
    }
  ],
  "message": "Get sync logs successfully",
  "meta": { "timestamp": 1785564382331, "version": "v1", "path": "/api/v1/sync/logs" }
}
```
