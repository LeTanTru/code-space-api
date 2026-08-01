# CodeSpace API — Health Check Module Documentation (`/api/v1/health`)

This document provides detailed API specifications, response envelope structures, payload examples, and health indicators for system and database health endpoints in `code-space-api`.

---

## Response Envelope Structure

All successful responses are automatically formatted by the global `ResponseInterceptor` into the standardized envelope structure:

```json
{
  "status": "success",
  "data": { ... },
  "message": "<custom_endpoint_message>",
  "meta": {
    "timestamp": 1785564382331,
    "version": "v1"
  }
}
```

---

## Health Endpoint Overview

| Endpoint         | Method | Status |  Auth   | Success Message (`message`) | Implementation State |
| :--------------- | :----: | :----: | :-----: | :-------------------------- | :------------------: |
| `/api/v1/health` | `GET`  | `200`  | ❌ None | `Check health successfully` |    ✅ Implemented    |

---

## Response Data Examples by Endpoint

### `GET /api/v1/health`

```json
{
  "status": "success",
  "data": {
    "status": "ok",
    "info": {
      "database": { "status": "up" },
      "memory_heap": { "status": "up" }
    },
    "error": {},
    "details": {
      "database": { "status": "up" },
      "memory_heap": { "status": "up" }
    }
  },
  "message": "Check health successfully",
  "meta": { "timestamp": 1785564382331, "version": "v1" }
}
```

---

## Error Messages & Scenarios

When a health indicator fails (e.g. database down or memory limit exceeded), Terminus returns HTTP 530 Service Unavailable:

```json
{
  "status": "error",
  "message": "Health check failed",
  "meta": {
    "timestamp": 1785564382331,
    "version": "v1"
  }
}
```

| Scenario                   | Triggering Endpoint | HTTP Code | Error Message (`message`) |
| :------------------------- | :------------------ | :-------: | :------------------------ |
| Database Connection Failed | `GET /health`       |   `530`   | `Health check failed`     |
| Heap Memory > 300MB        | `GET /health`       |   `530`   | `Health check failed`     |
