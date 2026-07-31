# Database

## Overview

The database layer uses **Prisma ORM** with **PostgreSQL 16+**. The schema in `prisma/schema.prisma` maps all 14 CodeSpace DB keys from the local `db.json` into a normalized relational structure.

---

## Model Relationships

```
User
 ├── UserSettings       (1:1)
 ├── RefreshToken[]     (1:N)
 ├── CustomSound[]      (1:N)
 ├── CliTool[]          (1:N)
 ├── CliBuiltinOverride[] (1:N)
 ├── WorkspacePreset[]  (1:N)
 │    └── PresetTerminal[] (1:N)
 └── DirectoryHistory[] (1:N)
```

All child records cascade-delete when the parent `User` is deleted.

---

## Models

### `User`

Primary identity record. Stores credentials and is the FK root for all user data.

| Column          | Type      | Notes                         |
| --------------- | --------- | ----------------------------- |
| `id`            | UUID (PK) | Auto-generated                |
| `email`         | String    | Unique                        |
| `username`      | String    | Unique, 3–30 chars            |
| `password_hash` | String    | Argon2id hash                 |
| `created_at`    | DateTime  | Auto-set on create            |
| `updated_at`    | DateTime  | Auto-updated                  |

---

### `RefreshToken`

Stores active refresh tokens for the token rotation/family pattern.

| Column       | Type      | Notes                   |
| ------------ | --------- | ----------------------- |
| `id`         | UUID (PK) | Auto-generated          |
| `token`      | String    | Unique (the JWT string) |
| `user_id`    | UUID (FK) | → `users.id`, cascade   |
| `expires_at` | DateTime  | TTL from JWT claim      |
| `created_at` | DateTime  | Auto-set                |

---

### `UserSettings`

One-to-one with `User`. Stores all appearance, terminal, and notification preferences. Defaults match CodeSpace Desktop defaults exactly.

| Column                  | Type     | Default          | Desktop DB Key           |
| ----------------------- | -------- | ---------------- | ------------------------ |
| `theme`                 | String   | `'cyber-noir'`   | `theme`                  |
| `font`                  | String   | `'quicksand'`    | `font`                   |
| `tab_orientation`       | String   | `'horizontal'`   | `tabOrientation`         |
| `terminal_font_size`    | Int      | `13`             | `terminalFontSize`       |
| `terminal_cursor_style` | String   | `'block'`        | `terminalCursorStyle`    |
| `terminal_cursor_blink` | Boolean  | `true`           | `terminalCursorBlink`    |
| `default_directory`     | String   | `''`             | `defaultDirectory`       |
| `sound_notifications`   | Boolean  | `true`           | `soundNotifications`     |
| `desktop_notifications` | Boolean  | `true`           | `desktopNotifications`   |
| `selected_sound_id`     | String   | `'default'`      | `selectedSoundId`        |
| `auto_restore_session`  | Boolean  | `true`           | *(API-only, future use)* |
| `session_restore`       | Json?    | `null`           | *(API-only, future use)* |
| `updated_at`            | DateTime | Auto-updated     | —                        |

---

### `CustomSound`

Stores user-uploaded custom notification sounds. `data` holds a base64 Data URL or an object storage URL.

| Column       | Type      | Notes                            |
| ------------ | --------- | -------------------------------- |
| `id`         | UUID (PK) | Auto-generated                   |
| `user_id`    | UUID (FK) | → `users.id`, cascade            |
| `sound_id`   | String    | Client-generated ID, unique/user |
| `name`       | String    | Display name                     |
| `data`       | String    | Base64 Data URL or storage URL   |
| `created_at` | DateTime  | Auto-set                         |

Unique constraint: `(user_id, sound_id)`.

---

### `CliTool`

Stores custom CLI tool definitions added by the user.

| Column          | Type      | Notes                            |
| --------------- | --------- | -------------------------------- |
| `id`            | UUID (PK) | Auto-generated                   |
| `user_id`       | UUID (FK) | → `users.id`, cascade            |
| `cli_id`        | String    | Client-generated ID, unique/user |
| `name`          | String    | Display label                    |
| `command`       | String    | Launch command                   |
| `check_command` | String?   | Availability check command       |
| `link`          | String?   | Homepage or docs URL             |
| `is_custom`     | Boolean   | `true` for user-created tools    |
| `unstable_exit` | Boolean   | Whether exit codes are unreliable|
| `created_at`    | DateTime  | Auto-set                         |

Unique constraint: `(user_id, cli_id)`.

---

### `CliBuiltinOverride`

Stores user overrides for built-in CLI tool definitions (e.g. renamed command, custom check).

| Column          | Type      | Notes                                  |
| --------------- | --------- | -------------------------------------- |
| `id`            | UUID (PK) | Auto-generated                         |
| `user_id`       | UUID (FK) | → `users.id`, cascade                  |
| `cli_id`        | String    | Matches a built-in CLI ID              |
| `name`          | String?   | Override display name                  |
| `command`       | String?   | Override launch command                |
| `check_command` | String?   | Override availability check            |
| `link`          | String?   | Override URL                           |
| `unstable_exit` | Boolean?  | Override unstable exit flag            |
| `updated_at`    | DateTime  | Auto-updated                           |

Unique constraint: `(user_id, cli_id)`.

---

### `WorkspacePreset`

Stores saved workspace preset profiles. `layout` is a recursive JSON tree (mirrors the CodeSpace `LayoutNode` type). `ide_selection` is a key-boolean map.

| Column          | Type      | Notes                                           |
| --------------- | --------- | ----------------------------------------------- |
| `id`            | UUID (PK) | Server-assigned UUID                            |
| `user_id`       | UUID (FK) | → `users.id`, cascade                           |
| `preset_id`     | String    | Client-generated stable ID                      |
| `name`          | String    | Display name                                    |
| `description`   | String    | Default `''`                                    |
| `color`         | String    | Hex color, default `'#6366f1'`                  |
| `root_path`     | String    | Workspace root directory                        |
| `terminal_count`| Int       | Number of terminals, default `1`                |
| `selected_cli`  | String?   | CLI ID selected at preset creation              |
| `ide_selection` | Json?     | `{ vscode: boolean, antigravity: boolean, ... }`|
| `layout`        | Json?     | Recursive `LayoutNode` split tree               |
| `created_at`    | BigInt    | Client-provided Unix ms timestamp               |
| `updated_at`    | BigInt    | Client-provided Unix ms timestamp               |

Unique constraint: `(user_id, preset_id)`.

---

### `PresetTerminal`

Individual terminal definitions within a preset.

| Column        | Type      | Notes                         |
| ------------- | --------- | ----------------------------- |
| `id`          | UUID (PK) | Auto-generated                |
| `preset_id`   | UUID (FK) | → `workspace_presets.id`, cascade |
| `cli`         | String?   | CLI to launch in this terminal|
| `cwd`         | String    | Working directory             |
| `custom_title`| String?   | Optional terminal title       |
| `command`     | String?   | Optional startup command      |
| `position`    | Int       | Order within the preset       |

---

### `DirectoryHistory`

Stores the user's recent directory history (mirrors `directoryHistory` DB key).

| Column     | Type      | Notes                          |
| ---------- | --------- | ------------------------------ |
| `id`       | UUID (PK) | Auto-generated                 |
| `user_id`  | UUID (FK) | → `users.id`, cascade          |
| `path`     | String    | Directory path                 |
| `position` | Int       | Order in the history list      |
| `updated_at`| DateTime | Auto-updated                   |

Unique constraint: `(user_id, path)`.

---

## DB Key to Table Mapping

| CodeSpace DB Key       | Table(s)                                              |
| ---------------------- | ----------------------------------------------------- |
| `theme`                | `user_settings.theme`                                 |
| `font`                 | `user_settings.font`                                  |
| `tabOrientation`       | `user_settings.tab_orientation`                       |
| `terminalFontSize`     | `user_settings.terminal_font_size`                    |
| `terminalCursorStyle`  | `user_settings.terminal_cursor_style`                 |
| `terminalCursorBlink`  | `user_settings.terminal_cursor_blink`                 |
| `defaultDirectory`     | `user_settings.default_directory`                     |
| `soundNotifications`   | `user_settings.sound_notifications`                   |
| `desktopNotifications` | `user_settings.desktop_notifications`                 |
| `selectedSoundId`      | `user_settings.selected_sound_id`                     |
| `cliSettings`          | `cli_tools` + `cli_builtin_overrides`                 |
| `workspacePresets`     | `workspace_presets` + `preset_terminals`              |
| `directoryHistory`     | `directory_history`                                   |
| `customSounds`         | `custom_sounds`                                       |

---

## Migration Workflow

### Development

```bash
# Create a new migration + apply it
npx prisma migrate dev --name <descriptive-name>

# Example
npx prisma migrate dev --name add-session-restore-field
```

### Production

```bash
npx prisma migrate deploy
```

Never run `migrate dev` in production — it may reset data.

### After schema changes

```bash
npx prisma generate
```

Regenerates the Prisma client types. Required before `tsc` will pass.

---

## Prisma Studio

```bash
npx prisma studio
```

Opens a web GUI at `http://localhost:5555` to browse and edit records.
