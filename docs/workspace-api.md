# CodeSpace API — Workspace Module Documentation (`/api/v1/workspace`)

This document provides detailed API specifications, response envelope structures, request DTOs, and error scenarios for cloud workspace management.

---

## Response Envelope Structure

All successful responses follow the standard JSON envelope:

```json
{
  "status": "success",
  "data": { ... },
  "message": "<endpoint-specific-message>",
  "meta": {
    "timestamp": 1785564382331,
    "version": "v1",
    "path": "/api/v1/workspace/<action>"
  }
}
```

---

## Workspace Endpoints Overview

| Endpoint                       |  Method  | Status |   Auth    | Success Message (`message`)          | Rate Limit |
| :----------------------------- | :------: | :----: | :-------: | :----------------------------------- | :--------: |
| `/api/v1/workspace/list`       |  `GET`   | `200`  | 🔒 Bearer | `Get workspaces successfully`        |   Global   |
| `/api/v1/workspace/create`     |  `POST`  | `201`  | 🔒 Bearer | `Create workspace successfully`      |   Global   |
| `/api/v1/workspace/get/:id`    |  `GET`   | `200`  | 🔒 Bearer | `Get workspace details successfully` |   Global   |
| `/api/v1/workspace/update/:id` |  `PUT`   | `200`  | 🔒 Bearer | `Update workspace successfully`      |   Global   |
| `/api/v1/workspace/delete/:id` | `DELETE` | `204`  | 🔒 Bearer | `Delete workspace successfully`      |   Global   |

---

## Endpoint Details & Examples

### `GET /api/v1/workspace/list`

Retrieves all cloud-synced workspaces owned by the authenticated user.

**Response:**

```json
{
  "status": "success",
  "data": [
    {
      "id": "ws_12345",
      "name": "Backend Development",
      "rootPath": "d:/CODE/Web/Projects/code-space-api",
      "color": "#3b82f6",
      "icon": "server",
      "layoutConfig": {
        "count": 2,
        "orientation": "horizontal",
        "splitRatio": [0.5, 0.5]
      },
      "terminals": [
        { "id": "t1", "cliId": "antigravity", "title": "API Server" },
        { "id": "t2", "cliId": "claude", "title": "Database Seed" }
      ],
      "updatedAt": "2026-08-02T09:00:00.000Z"
    }
  ],
  "message": "Get workspaces successfully",
  "meta": { "timestamp": 1785564382331, "version": "v1", "path": "/api/v1/workspace/list" }
}
```

---

### `POST /api/v1/workspace/create`

Creates a new cloud-synced workspace.

**Request Body:**

```json
{
  "name": "Backend Development",
  "rootPath": "d:/CODE/Web/Projects/code-space-api",
  "color": "#3b82f6",
  "icon": "server",
  "layoutConfig": {
    "count": 2,
    "orientation": "horizontal",
    "splitRatio": [0.5, 0.5]
  },
  "terminals": [
    { "id": "t1", "cliId": "antigravity", "title": "API Server" },
    { "id": "t2", "cliId": "claude", "title": "Database Seed" }
  ]
}
```

**Response (`201 Created`):**

```json
{
  "status": "success",
  "data": {
    "id": "ws_12345",
    "name": "Backend Development",
    "rootPath": "d:/CODE/Web/Projects/code-space-api",
    "color": "#3b82f6",
    "icon": "server",
    "layoutConfig": { "count": 2 },
    "terminals": [],
    "createdAt": "2026-08-02T09:00:00.000Z",
    "updatedAt": "2026-08-02T09:00:00.000Z"
  },
  "message": "Create workspace successfully",
  "meta": { "timestamp": 1785564382331, "version": "v1", "path": "/api/v1/workspace/create" }
}
```

---

### `GET /api/v1/workspace/get/:id`

Retrieves details of a single cloud workspace by ID.

---

### `PUT /api/v1/workspace/update/:id`

Updates an existing workspace (layout, tab colors, or terminal configurations).

**Request Body (partial update supported):**

```json
{
  "name": "Updated Backend Workspace",
  "color": "#8b5cf6"
}
```

**Response (`200 OK`):** Updated workspace DTO.

---

### `DELETE /api/v1/workspace/delete/:id`

Permanently deletes a cloud workspace record.

**Response (`204 No Content`):** Empty response body.

---

## Error Scenarios

| Scenario               | HTTP Code | Error Code (`code`) | Error Message (`message`) |
| :--------------------- | :-------: | :------------------ | :------------------------ |
| Workspace Not Found    |   `404`   | `NOT_FOUND`         | `Workspace not found`     |
| Invalid Request Body   |   `400`   | `VALIDATION_ERROR`  | `Validation failed`       |
| Unauthenticated Access |   `401`   | `UNAUTHORIZED`      | `Unauthorized`            |
