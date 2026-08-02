# CodeSpace API — Layout Preset Module Documentation (`/api/v1/preset`)

This document details the REST contracts for creating, retrieving, updating, and deleting custom layout presets across user devices.

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
    "path": "/api/v1/preset/<action>"
  }
}
```

---

## Preset Endpoints Overview

| Endpoint                    |  Method  | Status |   Auth    | Success Message (`message`)       | Rate Limit |
| :-------------------------- | :------: | :----: | :-------: | :-------------------------------- | :--------: |
| `/api/v1/preset/list`       |  `GET`   | `200`  | 🔒 Bearer | `Get presets successfully`        |   Global   |
| `/api/v1/preset/create`     |  `POST`  | `201`  | 🔒 Bearer | `Create preset successfully`      |   Global   |
| `/api/v1/preset/get/:id`    |  `GET`   | `200`  | 🔒 Bearer | `Get preset details successfully` |   Global   |
| `/api/v1/preset/update/:id` |  `PUT`   | `200`  | 🔒 Bearer | `Update preset successfully`      |   Global   |
| `/api/v1/preset/delete/:id` | `DELETE` | `204`  | 🔒 Bearer | `Delete preset successfully`      |   Global   |

---

## Endpoint Details & Examples

### `GET /api/v1/preset/list`

Retrieves all saved layout presets for the logged-in user.

**Response:**

```json
{
  "status": "success",
  "data": [
    {
      "id": "preset_01",
      "name": "Full Stack Dev Quad",
      "description": "2x2 Grid with Node.js, Vite dev server, Prisma DB studio, and Claude CLI",
      "count": 4,
      "orientation": "grid",
      "cliIds": ["antigravity", "claude", "codex", "opencode"],
      "updatedAt": "2026-08-02T09:00:00.000Z"
    }
  ],
  "message": "Get presets successfully",
  "meta": { "timestamp": 1785564382331, "version": "v1", "path": "/api/v1/preset/list" }
}
```

---

### `POST /api/v1/preset/create`

Saves a custom layout preset.

**Request Body:**

```json
{
  "name": "Full Stack Dev Quad",
  "description": "2x2 Grid with Node.js, Vite dev server, Prisma DB studio, and Claude CLI",
  "count": 4,
  "orientation": "grid",
  "cliIds": ["antigravity", "claude", "codex", "opencode"]
}
```

**Response (`201 Created`):**

```json
{
  "status": "success",
  "data": {
    "id": "preset_01",
    "name": "Full Stack Dev Quad",
    "description": "2x2 Grid with Node.js, Vite dev server, Prisma DB studio, and Claude CLI",
    "count": 4,
    "orientation": "grid",
    "cliIds": ["antigravity", "claude", "codex", "opencode"],
    "createdAt": "2026-08-02T09:00:00.000Z",
    "updatedAt": "2026-08-02T09:00:00.000Z"
  },
  "message": "Create preset successfully",
  "meta": { "timestamp": 1785564382331, "version": "v1", "path": "/api/v1/preset/create" }
}
```

---

### `GET /api/v1/preset/get/:id`

Retrieves details of a specific layout preset by ID.

---

### `PUT /api/v1/preset/update/:id`

Updates an existing layout preset configuration.

---

### `DELETE /api/v1/preset/delete/:id`

Deletes a saved layout preset.

**Response (`204 No Content`):** Empty body.
