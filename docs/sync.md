# Cloud Sync

## Overview

The sync system allows CodeSpace Desktop to push its local state to the server and pull it back on any authenticated device. The protocol is designed to be:

- **Offline-first**: the desktop app functions fully without the API. Sync is additive.
- **Idempotent**: pushing the same state twice is safe.
- **Conflict-tolerant**: concurrent writes from multiple devices are resolved by Last-Write-Wins (LWW) using the server's `updatedAt` timestamps.

---

## The 14-Key Snapshot

The CodeSpace desktop stores all user state in a flat JSON file (`db.json`) with 14 top-level keys. The sync protocol operates on this same shape:

```typescript
interface DbState {
  theme: string;
  font: string;
  tabOrientation: string;
  terminalFontSize: number;
  terminalCursorStyle: string;
  terminalCursorBlink: boolean;
  defaultDirectory: string;
  soundNotifications: boolean;
  desktopNotifications: boolean;
  selectedSoundId: string;
  cliSettings: {
    customClis: CliTool[];
    builtInOverrides: Record<string, Partial<CliTool>>;
  };
  workspacePresets: WorkspacePreset[];
  directoryHistory: string[];
  customSounds: CustomSoundFile[];
}
```

The server decomposes this into its normalized relational schema on `push` and recomposes it on `pull`.

---

## Pull Flow — `GET /api/v1/sync/pull`

Assembles the complete 14-key snapshot from relational tables for the authenticated user.

```
Client                              Server
  │                                   │
  │ GET /sync/pull                    │
  │ Authorization: Bearer <token>     │
  │ ─────────────────────────────── > │
  │                                   │ SELECT user_settings WHERE user_id = ?
  │                                   │ SELECT cli_tools WHERE user_id = ?
  │                                   │ SELECT cli_builtin_overrides WHERE user_id = ?
  │                                   │ SELECT workspace_presets + preset_terminals
  │                                   │ SELECT directory_history WHERE user_id = ?
  │                                   │ SELECT custom_sounds WHERE user_id = ?
  │                                   │ ── assemble DbState ──
  │ < ─────────────────────────────── │
  │ 200 { data: DbState }             │
```

---

## Push Flow — `POST /api/v1/sync/push`

Accepts a partial or full `DbState` and merges it into the database. Only keys present in the request body are processed.

```
Client                                Server
  │                                     │
  │ POST /sync/push                     │
  │ Body: { theme: "ocean-dark",        │
  │         terminalFontSize: 14 }      │
  │ ─────────────────────────────────> │
  │                                     │ upsert user_settings
  │                                     │   SET theme = 'ocean-dark',
  │                                     │       terminal_font_size = 14,
  │                                     │       updated_at = NOW()
  │                                     │
  │                                     │ ── assemble + return full DbState ──
  │ <───────────────────────────────── │
  │ 200 { data: DbState }              │
```

### Key decomposition on push

| Incoming key       | Server action                                                        |
| ------------------ | -------------------------------------------------------------------- |
| Settings keys (10) | `upsert` on `user_settings` for `user_id`                            |
| `cliSettings`      | `upsert` each `customClis[]` item into `cli_tools`; `upsert` each `builtInOverrides` entry into `cli_builtin_overrides` |
| `workspacePresets` | `upsert` each preset into `workspace_presets`; replace `preset_terminals` for each preset |
| `directoryHistory` | Replace all `directory_history` rows for the user; re-insert with `position` index |
| `customSounds`     | `upsert` each sound into `custom_sounds` by `(user_id, sound_id)`    |

---

## Last-Write-Wins (LWW) Conflict Resolution

The API does not implement operational transforms or three-way merging. Conflict resolution is timestamp-based:

1. **Settings** — the server always accepts the incoming value. The client is responsible for pushing only changes that occurred after the last pull. The server `updated_at` acts as a reference point: after a successful push, the client records the server timestamp as its sync checkpoint. On the next push, the client can omit keys unchanged since that checkpoint.

2. **Presets** — each preset carries its own `updatedAt` (BigInt Unix ms, client-provided). The server compares the incoming `updatedAt` to the stored value and only upserts if the incoming timestamp is equal or newer.

3. **Directory history and custom sounds** — replaced wholesale on push (no per-item timestamp comparison).

---

## Desktop Client Integration

The desktop app interacts with the sync API through a `SyncService` (to be implemented in the renderer or Electron main process):

```
User changes theme to "ocean-dark"
         │
         ▼
updateDbKey('theme', 'ocean-dark')     ← local db.json write
         │
         ▼
Is user authenticated?
    ├── NO  → stay local-only
    └── YES → SyncService.push({ theme: 'ocean-dark' })
                    │
                    ▼
              POST /api/v1/sync/push
                    │
                    ▼
              Update local sync checkpoint
```

On app launch:

```
App starts
    │
    ▼
Is user authenticated + online?
    ├── NO  → load local db.json
    └── YES → GET /api/v1/sync/pull
                   │
                   ▼
             Merge remote state into local db.json
             (remote wins for keys modified after last sync)
```

---

## Error Cases

| Situation                             | Behavior                                          |
| ------------------------------------- | ------------------------------------------------- |
| No network / server down              | Push silently fails; desktop continues with local state |
| Token expired mid-session             | Refresh flow re-issues access token; push retried |
| Server returns 5xx                    | Push queued for retry on next app focus           |
| Push with unknown preset `presetId`   | New preset created (upsert semantics)             |
| Push with deleted preset not in body  | Server record is not touched (push is additive)   |

---

## Related Docs

- [api-reference.md](api-reference.md) — `/sync/pull` and `/sync/push` endpoint shapes
- [database.md](database.md) — table schema for all synced models
- [authentication.md](authentication.md) — how the user session is managed
