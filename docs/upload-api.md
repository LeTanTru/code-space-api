# CodeSpace API — File & Media Upload Module Documentation (`/api/v1/upload`)

This document details the REST contracts for uploading, serving, and managing image assets (user profile avatars, workspace icons) and custom sound audio clips in `code-space-api`.

---

## Storage Location

All uploaded files are written directly into `uploads/` in the project root:

- Images & Avatars: `uploads/images/`
- Custom Audio Clips: `uploads/sounds/`

Files are served statically by NestJS at `/uploads/*` (e.g. `http://localhost:8080/uploads/images/<filename>`).

---

## Response Envelope Structure

All upload endpoints wrap responses in the standard `code-space-api` response envelope:

```json
{
  "status": "success",
  "data": { ... },
  "message": "<endpoint-specific-message>",
  "meta": {
    "timestamp": 1785645000000,
    "version": "v1",
    "path": "/api/v1/upload/avatar"
  }
}
```

---

## Upload Endpoints Overview

| Endpoint                          |  Method  | Status |   Auth    |     Content-Type      | Max Size | Success Message (`message`)         |
| :-------------------------------- | :------: | :----: | :-------: | :-------------------: | :------: | :---------------------------------- |
| `/api/v1/upload/image`            |  `POST`  | `201`  | 🔒 Bearer | `multipart/form-data` |   5 MB   | `Image uploaded successfully`       |
| `/api/v1/upload/avatar`           |  `POST`  | `201`  | 🔒 Bearer | `multipart/form-data` |   5 MB   | `Avatar uploaded successfully`      |
| `/api/v1/upload/avatar`           | `DELETE` | `200`  | 🔒 Bearer |  `application/json`   |    —     | `Avatar reset successfully`         |
| `/api/v1/upload/sound`            |  `POST`  | `201`  | 🔒 Bearer | `multipart/form-data` |  10 MB   | `Sound file uploaded successfully`  |
| `/api/v1/upload/sound/:id`        | `DELETE` | `200`  | 🔒 Bearer |  `application/json`   |    —     | `Custom sound deleted successfully` |
| `/api/v1/upload/delete/:filename` | `DELETE` | `200`  | 🔒 Bearer |  `application/json`   |    —     | `File deleted successfully`         |

---

## Endpoint Details & Examples

### 1. `POST /api/v1/upload/avatar`

Uploads user profile avatar image file and updates `User.avatarUrl` in the database.

- **Headers:** `Authorization: Bearer <access_token>`, `Content-Type: multipart/form-data`
- **Body Field:** `file` (Binary file)
- **Allowed MIME Types:** `image/jpeg`, `image/png`, `image/webp`, `image/gif`, `image/svg+xml`
- **Max File Size:** `5MB`

**Response (`201 Created`):**

```json
{
  "status": "success",
  "data": {
    "id": "img-e78ccd10-1785691136351",
    "filename": "img-e78ccd10-1785691136351.jpg",
    "originalName": "avatar.jpg",
    "url": "http://localhost:8080/uploads/images/img-e78ccd10-1785691136351.jpg",
    "mimeType": "image/jpeg",
    "sizeBytes": 51734,
    "createdAt": "2026-08-02T17:18:56.352Z",
    "avatarUrl": "http://localhost:8080/uploads/images/img-e78ccd10-1785691136351.jpg"
  },
  "message": "Avatar uploaded successfully",
  "meta": {
    "timestamp": 1785691136800,
    "version": "v1",
    "path": "/api/v1/upload/avatar"
  }
}
```

---

### 2. `DELETE /api/v1/upload/avatar`

Deletes user avatar image and resets `User.avatarUrl` to `null`.

- **Headers:** `Authorization: Bearer <access_token>`

**Response (`200 OK`):**

```json
{
  "status": "success",
  "data": {
    "filename": "avatar",
    "deleted": true
  },
  "message": "Avatar reset successfully",
  "meta": {
    "timestamp": 1785691136800,
    "version": "v1",
    "path": "/api/v1/upload/avatar"
  }
}
```

---

### 3. `POST /api/v1/upload/sound`

Uploads a custom notification sound audio clip and saves `CustomSound` model entry.

- **Headers:** `Authorization: Bearer <access_token>`, `Content-Type: multipart/form-data`
- **Body Field:** `file` (Binary file), optional `name` (string display name)
- **Allowed MIME Types:** `audio/mpeg`, `audio/mp3`, `audio/wav`, `audio/ogg`, `audio/webm`
- **Max File Size:** `10MB`

**Response (`201 Created`):**

```json
{
  "status": "success",
  "data": {
    "id": "sound-custom-1785645000000",
    "filename": "notification-alert.mp3",
    "originalName": "my-alert.mp3",
    "name": "Custom Chime Alert",
    "url": "http://localhost:8080/uploads/sounds/notification-alert.mp3",
    "mimeType": "audio/mpeg",
    "sizeBytes": 320450,
    "createdAt": "2026-08-02T11:32:00.000Z"
  },
  "message": "Sound file uploaded successfully",
  "meta": {
    "timestamp": 1785645000000,
    "version": "v1",
    "path": "/api/v1/upload/sound"
  }
}
```

---

### 4. `DELETE /api/v1/upload/sound/:id`

Deletes a custom sound record by ID and removes local audio file.

- **Headers:** `Authorization: Bearer <access_token>`

**Response (`200 OK`):**

```json
{
  "status": "success",
  "data": {
    "filename": "sound-custom-1785645000000",
    "deleted": true
  },
  "message": "Custom sound deleted successfully",
  "meta": {
    "timestamp": 1785645000000,
    "version": "v1",
    "path": "/api/v1/upload/sound/sound-custom-1785645000000"
  }
}
```

---

## Error Handling

|    Status Code     | Error Code          | Scenario                                                                 |
| :----------------: | :------------------ | :----------------------------------------------------------------------- |
| `400 Bad Request`  | `INVALID_FILE_TYPE` | File extension or MIME type is not allowed (e.g. uploading `.exe`).      |
| `400 Bad Request`  | `FILE_TOO_LARGE`    | File exceeds maximum size limits (5MB for images, 10MB for audio).       |
| `400 Bad Request`  | `FILE_MISSING`      | Request sent without `file` field in multipart data.                     |
| `401 Unauthorized` | `UNAUTHORIZED`      | Missing or invalid Bearer JWT token.                                     |
|  `404 Not Found`   | `FILE_NOT_FOUND`    | Specified filename does not exist or user lacks permission to delete it. |
