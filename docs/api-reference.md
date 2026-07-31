# API Reference

Base URL: `http://localhost:4000/api/v1` (development)

All responses follow the standard envelope:

```json
{
  "success": true | false,
  "message": "Human-readable status",
  "data": { ... }           // present on success
}
```

Error responses include an `errors` array for validation failures and a `stack` field in development.

---

## Health

### `GET /health`

Returns server status. No authentication required.

**Response `200`**

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "status": "ok",
    "uptime": 42.3,
    "timestamp": "2026-07-31T07:00:00.000Z"
  }
}
```

---

## Authentication — `/auth`

### `POST /auth/register`

Create a new user account.

**Request body**

```json
{
  "email": "user@example.com",
  "username": "codespacer",
  "password": "MinimumLength8!"
}
```

| Field      | Type   | Rules                              |
| ---------- | ------ | ---------------------------------- |
| `email`    | string | valid email format, unique         |
| `username` | string | 3–30 chars, alphanumeric + `_-`, unique |
| `password` | string | minimum 8 characters               |

**Response `201`**

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "codespacer"
  }
}
```

**Errors**

| Status | Cause                          |
| ------ | ------------------------------ |
| `400`  | Validation failure             |
| `409`  | Email or username already taken |

---

### `POST /auth/login`

Authenticate a user and issue tokens.

**Request body**

```json
{
  "email": "user@example.com",
  "password": "MinimumLength8!"
}
```

**Response `200`**

Sets `refreshToken` HttpOnly cookie (7-day TTL).

```json
{
  "success": true,
  "message": "Logged in successfully",
  "data": {
    "accessToken": "eyJ...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "codespacer"
    }
  }
}
```

**Errors**

| Status | Cause                           |
| ------ | ------------------------------- |
| `400`  | Validation failure              |
| `401`  | Invalid credentials             |

---

### `POST /auth/refresh`

Exchange the HttpOnly refresh token cookie for a new access token. Also rotates the refresh token.

**Request**

No body. The `refreshToken` cookie must be present.

**Response `200`**

Sets a new `refreshToken` cookie.

```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJ..."
  }
}
```

**Errors**

| Status | Cause                                   |
| ------ | --------------------------------------- |
| `401`  | Cookie missing, token invalid/expired   |
| `403`  | Token reuse detected (family revoked)   |

---

### `POST /auth/logout`

Invalidate the current refresh token. Requires authentication.

**Headers:** `Authorization: Bearer <access_token>`

**Response `204`** — No content.

---

### `GET /auth/me`

Return the authenticated user's profile.

**Headers:** `Authorization: Bearer <access_token>`

**Response `200`**

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "codespacer",
    "createdAt": "2026-07-31T07:00:00.000Z"
  }
}
```

---

## Synchronization — `/sync`

All sync endpoints require authentication: `Authorization: Bearer <access_token>`

### `GET /sync/pull`

Fetch the complete 14-key state snapshot for the authenticated user.

**Response `200`**

```json
{
  "success": true,
  "message": "State snapshot pulled successfully",
  "data": {
    "theme": "cyber-noir",
    "font": "quicksand",
    "tabOrientation": "horizontal",
    "terminalFontSize": 13,
    "terminalCursorStyle": "block",
    "terminalCursorBlink": true,
    "defaultDirectory": "",
    "soundNotifications": true,
    "desktopNotifications": true,
    "selectedSoundId": "default",
    "cliSettings": {
      "customClis": [],
      "builtInOverrides": {}
    },
    "workspacePresets": [],
    "directoryHistory": [],
    "customSounds": []
  }
}
```

---

### `POST /sync/push`

Push local state delta or full snapshot to the server. The server merges using Last-Write-Wins.

**Request body**

A partial or full `DbState` object. Only the keys provided are updated.

```json
{
  "theme": "ocean-dark",
  "terminalFontSize": 14
}
```

**Response `200`**

Returns the full merged server state (same shape as `GET /sync/pull`).

```json
{
  "success": true,
  "message": "State snapshot pushed and merged successfully",
  "data": { ... }
}
```

---

## Workspace Presets — `/presets`

All preset endpoints require authentication.

### `GET /presets`

List all workspace presets for the authenticated user.

**Response `200`**

```json
{
  "success": true,
  "message": "Success",
  "data": [
    {
      "id": "uuid",
      "presetId": "client-generated-id",
      "name": "My Project",
      "description": "Main project workspace",
      "color": "#6366f1",
      "rootPath": "C:/dev/my-project",
      "terminalCount": 2,
      "selectedCLI": "node",
      "ideSelection": { "vscode": true, "antigravity": false },
      "layout": null,
      "terminals": [
        { "cli": "node", "cwd": "C:/dev/my-project", "position": 0 }
      ],
      "createdAt": 1722398400000,
      "updatedAt": 1722398400000
    }
  ]
}
```

---

### `POST /presets`

Create a new workspace preset.

**Request body**

```json
{
  "presetId": "client-generated-id",
  "name": "My Project",
  "description": "",
  "color": "#6366f1",
  "rootPath": "C:/dev/my-project",
  "terminalCount": 1,
  "selectedCLI": null,
  "ideSelection": {},
  "layout": null,
  "terminals": [
    { "cli": null, "cwd": "C:/dev/my-project", "customTitle": null, "command": null, "position": 0 }
  ],
  "createdAt": 1722398400000,
  "updatedAt": 1722398400000
}
```

**Response `201`** — Returns the created preset object.

---

### `PUT /presets/:id`

Update an existing preset by its server `id` (UUID).

**Request body** — Partial preset object (same shape as POST, all fields optional).

**Response `200`** — Returns the updated preset object.

**Errors**

| Status | Cause                                |
| ------ | ------------------------------------ |
| `403`  | Preset belongs to another user       |
| `404`  | Preset not found                     |

---

### `DELETE /presets/:id`

Delete a preset by its server `id`.

**Response `204`** — No content.

**Errors**

| Status | Cause                          |
| ------ | ------------------------------ |
| `403`  | Preset belongs to another user |
| `404`  | Preset not found               |

---

## User Settings — `/settings`

All settings endpoints require authentication.

### `GET /settings`

Return the authenticated user's settings.

**Response `200`**

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "theme": "cyber-noir",
    "font": "quicksand",
    "tabOrientation": "horizontal",
    "terminalFontSize": 13,
    "terminalCursorStyle": "block",
    "terminalCursorBlink": true,
    "defaultDirectory": "",
    "soundNotifications": true,
    "desktopNotifications": true,
    "selectedSoundId": "default",
    "autoRestoreSession": true,
    "sessionRestore": null,
    "updatedAt": "2026-07-31T07:00:00.000Z"
  }
}
```

---

### `PATCH /settings`

Update one or more settings fields.

**Request body** — Partial settings object. Only provided fields are updated.

```json
{
  "theme": "ocean-dark",
  "terminalFontSize": 14
}
```

**Response `200`** — Returns the full updated settings object.

---

## Error Codes

| HTTP Status | Meaning                             |
| ----------- | ----------------------------------- |
| `400`       | Validation error (see `errors[]`)   |
| `401`       | Missing or invalid auth token       |
| `403`       | Forbidden (wrong owner, reused token) |
| `404`       | Resource not found                  |
| `409`       | Conflict (duplicate email/username) |
| `429`       | Too many requests (rate limited)    |
| `500`       | Internal server error               |
