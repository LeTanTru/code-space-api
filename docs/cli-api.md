# CodeSpace API — CLI Tools & Builtin Overrides Module Documentation (`/api/v1/cli`)

This document details the REST contracts for managing custom CLI tools (`CliTool`) and builtin CLI overrides (`CliBuiltinOverride`) in `code-space-api`.

---

## Response Envelope Structure

All successful responses are automatically formatted by the global `ResponseInterceptor`:

```json
{
  "status": "success",
  "data": { ... },
  "message": "<endpoint-specific-message>",
  "meta": {
    "timestamp": 1785564382331,
    "version": "v1",
    "path": "/api/v1/cli/<endpoint>"
  }
}
```

---

## CLI Endpoints Overview

| Endpoint                             |  Method  | Status |   Auth    | Success Message (`message`)           | Rate Limit |
| :----------------------------------- | :------: | :----: | :-------: | :------------------------------------ | :--------: |
| `/api/v1/cli/list`                   |  `GET`   | `200`  | 🔒 Bearer | `Get CLI tools successfully`          |   Global   |
| `/api/v1/cli/create`                 |  `POST`  | `201`  | 🔒 Bearer | `Create custom CLI tool successfully` |   Global   |
| `/api/v1/cli/update/:id`             |  `PUT`   | `200`  | 🔒 Bearer | `Update custom CLI tool successfully` |   Global   |
| `/api/v1/cli/delete/:id`             | `DELETE` | `204`  | 🔒 Bearer | `Delete custom CLI tool successfully` |   Global   |
| `/api/v1/cli/override/upsert`        |  `POST`  | `200`  | 🔒 Bearer | `Upsert CLI override successfully`    |   Global   |
| `/api/v1/cli/override/delete/:cliId` | `DELETE` | `204`  | 🔒 Bearer | `Delete CLI override successfully`    |   Global   |

---

## Endpoint Details & Examples

### 1. `GET /api/v1/cli/list`

Retrieves all custom CLI tools registered by the user alongside their builtin CLI overrides.

**Response:**

```json
{
  "status": "success",
  "data": {
    "customClis": [
      {
        "id": "cli-custom-01",
        "name": "Custom Deploy CLI",
        "command": "./deploy.sh",
        "checkCommand": "which deploy",
        "link": "https://example.com/docs/deploy",
        "isCustom": true,
        "createdAt": "2026-08-02T09:00:00.000Z",
        "updatedAt": "2026-08-02T09:00:00.000Z"
      }
    ],
    "builtinOverrides": [
      {
        "id": "override-uuid-01",
        "cliId": "antigravity",
        "name": "Antigravity Dev",
        "command": "antigravity --dev",
        "checkCommand": "antigravity --version",
        "link": null,
        "updatedAt": "2026-08-02T09:00:00.000Z"
      }
    ]
  },
  "message": "Get CLI tools successfully",
  "meta": { "timestamp": 1785564382331, "version": "v1", "path": "/api/v1/cli/list" }
}
```

---

### 2. `POST /api/v1/cli/create`

Registers a new user-defined custom CLI tool.

---

### 3. `PUT /api/v1/cli/update/:id`

Updates an existing user-defined custom CLI tool.

---

### 4. `DELETE /api/v1/cli/delete/:id`

Deletes a custom CLI tool owned by the user.

---

### 5. `POST /api/v1/cli/override/upsert`

Creates or updates an override configuration for a built-in CLI tool.

---

### 6. `DELETE /api/v1/cli/override/delete/:cliId`

Removes a custom override for a built-in CLI tool.
