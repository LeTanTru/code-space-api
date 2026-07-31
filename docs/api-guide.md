# API Guide

## Base URL & Auth Headers

- **Base URL**: `/api/v1`
- **Content-Type**: `application/json`
- **Auth Header**: `Authorization: Bearer <AccessToken>`

---

## Endpoint Contracts

### Authentication (`/auth`)

| Method | Endpoint         | Description                                                  | Auth Required       |
| :----- | :--------------- | :----------------------------------------------------------- | :------------------ |
| `POST` | `/auth/register` | Create user account                                          | ❌ No               |
| `POST` | `/auth/login`    | Authenticate & issue Access Token + HTTP-only Refresh Cookie | ❌ No               |
| `POST` | `/auth/refresh`  | Rotate Refresh Token and return fresh Access Token           | ❌ No (uses Cookie) |
| `POST` | `/auth/logout`   | Revoke active Refresh Token session                          | ✅ Yes              |
| `GET`  | `/auth/me`       | Fetch authenticated user profile                             | ✅ Yes              |

#### Sample Login Payload (`POST /auth/login`)

```json
{
  "email": "user@codespace.dev",
  "password": "Password123!",
  "deviceName": "Windows Workstation"
}
```

---

### User Settings (`/settings`)

| Method | Endpoint    | Description                  | Auth Required |
| :----- | :---------- | :--------------------------- | :------------ |
| `GET`  | `/settings` | Get user settings            | ✅ Yes        |
| `PUT`  | `/settings` | Partial update user settings | ✅ Yes        |

#### Sample Settings Update Payload (`PUT /settings`)

```json
{
  "theme": "cyberpunk",
  "terminalFontSize": 14,
  "soundNotifications": true
}
```

---

### Workspace Presets (`/presets`)

| Method   | Endpoint       | Description            | Auth Required |
| :------- | :------------- | :--------------------- | :------------ |
| `GET`    | `/presets`     | List workspace presets | ✅ Yes        |
| `POST`   | `/presets`     | Create preset          | ✅ Yes        |
| `GET`    | `/presets/:id` | Fetch preset by ID     | ✅ Yes        |
| `PUT`    | `/presets/:id` | Update preset by ID    | ✅ Yes        |
| `DELETE` | `/presets/:id` | Delete preset by ID    | ✅ Yes        |

---

### Cloud Synchronization (`/sync`)

| Method | Endpoint     | Description                                    | Auth Required |
| :----- | :----------- | :--------------------------------------------- | :------------ |
| `POST` | `/sync/push` | Push desktop `db.json` state to cloud database | ✅ Yes        |
| `GET`  | `/sync/pull` | Pull full cloud state to desktop client        | ✅ Yes        |
