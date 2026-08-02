# CodeSpace API — Settings & Preferences Module Documentation (`/api/v1/setting`)

This document details the REST contracts for synchronizing desktop settings, themes, terminal font/cursor preferences, notification configurations, and custom CLI tool registries.

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
    "path": "/api/v1/setting/get"
  }
}
```

---

## Settings Endpoints Overview

| Endpoint                 | Method | Status |   Auth    | Success Message (`message`)    | Rate Limit |
| :----------------------- | :----: | :----: | :-------: | :----------------------------- | :--------: |
| `/api/v1/setting/get`    | `GET`  | `200`  | 🔒 Bearer | `Get settings successfully`    |   Global   |
| `/api/v1/setting/update` | `PUT`  | `200`  | 🔒 Bearer | `Update settings successfully` |   Global   |

---

## Endpoint Details & Examples

### `GET /api/v1/setting/get`

Retrieves cloud preferences for the user's desktop application instance.

**Response:**

```json
{
  "status": "success",
  "data": {
    "theme": "cyberpunk",
    "fontFamily": "Fira Code",
    "fontSize": 14,
    "lineHeight": 1.5,
    "cursorStyle": "block",
    "cursorBlink": true,
    "scrollbackLimit": 10000,
    "soundEnabled": true,
    "soundVolume": 0.8,
    "notificationsEnabled": true,
    "ideIntegration": "vscode",
    "customClis": [
      {
        "id": "my-script",
        "name": "Custom Deploy CLI",
        "command": "./deploy.sh",
        "isCustom": true
      }
    ],
    "updatedAt": "2026-08-02T09:00:00.000Z"
  },
  "message": "Get settings successfully",
  "meta": { "timestamp": 1785564382331, "version": "v1", "path": "/api/v1/setting/get" }
}
```

---

### `PUT /api/v1/setting/update`

Updates cloud settings and preference values.

**Request Body (all fields optional):**

```json
{
  "theme": "dracula",
  "fontSize": 16,
  "cursorStyle": "bar"
}
```

**Response (`200 OK`):** Updated settings object payload.
