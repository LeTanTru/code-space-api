# CodeSpace API — File & Media Upload Module Documentation (`/api/v1/upload`)

This document details the REST contracts for uploading, serving, and managing image assets (user profile avatars, workspace icons) and sound files (custom notification audio clips) in `code-space-api`.

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
    "path": "/api/v1/upload/image"
  }
}
```

---

## Upload Endpoints Overview

| Endpoint                          |  Method  | Status |   Auth    |     Content-Type      | Max Size | Success Message (`message`)        |
| :-------------------------------- | :------: | :----: | :-------: | :-------------------: | :------: | :--------------------------------- |
| `/api/v1/upload/image`            |  `POST`  | `201`  | 🔒 Bearer | `multipart/form-data` |   5 MB   | `Image uploaded successfully`      |
| `/api/v1/upload/sound`            |  `POST`  | `201`  | 🔒 Bearer | `multipart/form-data` |  10 MB   | `Sound file uploaded successfully` |
| `/api/v1/upload/delete/:filename` | `DELETE` | `200`  | 🔒 Bearer |  `application/json`   |    —     | `File deleted successfully`        |

---

## Endpoint Details & Examples

### 1. `POST /api/v1/upload/image`

Uploads an image asset (e.g. avatar image or workspace icon).

- **Headers:** `Authorization: Bearer <access_token>`, `Content-Type: multipart/form-data`
- **Body Field:** `file` (Binary file)
- **Allowed MIME Types:** `image/jpeg`, `image/png`, `image/webp`, `image/gif`, `image/svg+xml`
- **Max File Size:** `5MB` (5,242,880 bytes)

**Response (`201 Created`):**

```json
{
  "status": "success",
  "data": {
    "id": "img-e78ccd10-490a-4b6d-a22e-b9d5af49b055-1785645000000",
    "filename": "avatar-user-123.webp",
    "originalName": "my-avatar.png",
    "url": "http://localhost:8080/uploads/images/avatar-user-123.webp",
    "mimeType": "image/webp",
    "sizeBytes": 142580,
    "createdAt": "2026-08-02T11:32:00.000Z"
  },
  "message": "Image uploaded successfully",
  "meta": {
    "timestamp": 1785645000000,
    "version": "v1",
    "path": "/api/v1/upload/image"
  }
}
```

---

### 2. `POST /api/v1/upload/sound`

Uploads a custom notification sound file.

- **Headers:** `Authorization: Bearer <access_token>`, `Content-Type: multipart/form-data`
- **Body Field:** `file` (Binary file), optional `name` (string display name)
- **Allowed MIME Types:** `audio/mpeg`, `audio/mp3`, `audio/wav`, `audio/ogg`, `audio/webm`
- **Max File Size:** `10MB` (10,485,760 bytes)

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

### 3. `DELETE /api/v1/upload/delete/:filename`

Removes a previously uploaded media file owned by the user.

- **Headers:** `Authorization: Bearer <access_token>`

**Response (`200 OK`):**

```json
{
  "status": "success",
  "data": {
    "filename": "avatar-user-123.webp",
    "deleted": true
  },
  "message": "File deleted successfully",
  "meta": {
    "timestamp": 1785645000000,
    "version": "v1",
    "path": "/api/v1/upload/delete/avatar-user-123.webp"
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
