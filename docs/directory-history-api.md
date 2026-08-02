# CodeSpace API — Directory History Module Documentation (`/api/v1/directory-history`)

This document details the REST contracts for managing recent working directory history (`DirectoryHistory`) in `code-space-api`.

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
    "path": "/api/v1/directory-history/<action>"
  }
}
```

---

## Directory History Endpoints Overview

| Endpoint                                |  Method  | Status |   Auth    | Success Message (`message`)                     | Rate Limit |
| :-------------------------------------- | :------: | :----: | :-------: | :---------------------------------------------- | :--------: |
| `/api/v1/directory-history/list`        |  `GET`   | `200`  | 🔒 Bearer | `Get directory history successfully`            |   Global   |
| `/api/v1/directory-history/upsert`      |  `POST`  | `200`  | 🔒 Bearer | `Upsert directory history successfully`         |   Global   |
| `/api/v1/directory-history/delete/:id`  | `DELETE` | `204`  | 🔒 Bearer | `Delete directory history item successfully`    |   Global   |

---

## Endpoint Details & Examples

### 1. `GET /api/v1/directory-history/list`

Retrieves the list of recent working directory paths saved for the authenticated user, ordered by `position` ascending.

**Response `data` Example (`200 OK`):**

```json
[
  {
    "id": "a694b488-3147-46e8-93f7-c97883d8909e",
    "userId": "e78ccd10-490a-4b6d-a22e-b9d5af49b055",
    "path": "D:\\CODE\\Web\\ReactJS\\portfolio",
    "position": 0,
    "updatedAt": "2026-08-02T15:12:20.211Z"
  }
]
```

---

### 2. `POST /api/v1/directory-history/upsert`

Adds a new directory path or updates its position in user history.

**Request Body (`UpsertDirectoryHistoryDto`):**

```json
{
  "path": "D:\\CODE\\Web\\ReactJS\\portfolio",
  "position": 0
}
```

**Response `data` Example (`200 OK`):**

```json
{
  "id": "a694b488-3147-46e8-93f7-c97883d8909e",
  "userId": "e78ccd10-490a-4b6d-a22e-b9d5af49b055",
  "path": "D:\\CODE\\Web\\ReactJS\\portfolio",
  "position": 0,
  "updatedAt": "2026-08-02T15:12:20.211Z"
}
```

---

### 3. `DELETE /api/v1/directory-history/delete/:id`

Deletes a specific working directory history entry by ID.

**Path Parameters:**
- `id` (string, required): Unique UUID of the directory history record to delete.

**Response (`204 No Content`):** No body returned on success.
