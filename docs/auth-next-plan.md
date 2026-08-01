# Auth API — Remaining Implementation Plan

> **Source of truth for this plan**: cross-referenced against the desktop app's
> [`auth.ts` store](../../code-space-desktop/src/store/auth.ts) and all four auth form components.

## Current State (Completed)

| Endpoint             | Method                          | Called By (Desktop)                     | Status  |
| :------------------- | :------------------------------ | :-------------------------------------- | :------ |
| `POST /auth/login`   | Login + device/IP tracking      | `login-form.tsx` → `authStore.login()`  | ✅ Done |
| `GET /auth/me`       | User profile + active sessions  | `authStore.initFromDb()` (on app start) | ✅ Done |
| `GET /auth/sessions` | List all active device sessions | Future sessions UI                      | ✅ Done |

---

## Remaining Endpoints to Implement

| Priority | Endpoint                     | Called By (Desktop)                                          | Auth                          |
| :------: | :--------------------------- | :----------------------------------------------------------- | :---------------------------- |
|    1     | `POST /auth/register`        | `signup-form.tsx` → `authStore.register()`                   | ❌ No                         |
|    2     | `POST /auth/verify-email`    | `verify-email-form.tsx` → `authStore.verifyEmail()`          | ❌ No (uses token from email) |
|    3     | `POST /auth/refresh`         | `authStore` background token refresh                         | ❌ Cookie                     |
|    4     | `POST /auth/logout`          | `authStore.logout()`                                         | ✅ Guard                      |
|    5     | `POST /auth/forgot-password` | `forgot-password-form.tsx` → `authStore.sendPasswordReset()` | ❌ No                         |
|    6     | `POST /auth/reset-password`  | Future `reset-password-form.tsx`                             | ❌ No (uses token from email) |
|    7     | `DELETE /auth/sessions/:id`  | Future sessions management UI                                | ✅ Guard                      |

---

## 1. `POST /auth/register` — User Registration

### Desktop caller

`signup-form.tsx` → `authStore.register(name, email, password)`
After success: sets `mode = 'verify-email'` and `unverifiedEmail = email`.

### Request DTO

```typescript
class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
  password: string;

  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name: string;
}
```

### Flow

```
1. Validate DTO
2. Check email uniqueness → 409 if exists
3. argon2.hash(password, { type: argon2id, memoryCost: 65536, timeCost: 3, parallelism: 4 })
4. prisma.user.create({ email, passwordHash, name })
5. Generate 6-digit OTP → store hashed in DB (new EmailVerification model) with 15-min expiry
6. Send verification email via email service (e.g. nodemailer / Resend)
7. Return 201 { id, email, name, role, createdAt }
```

### Error Cases

| Scenario             | HTTP | Message                    |
| :------------------- | :--: | :------------------------- |
| Email already exists | 409  | `Email already registered` |
| Weak password        | 400  | Validation error           |

> [!NOTE]
> Requires a new `email_verifications` table in Prisma schema to store OTP hash + expiry.

---

## 2. `POST /auth/verify-email` — Email OTP Verification

### Desktop caller

`verify-email-form.tsx` → `authStore.verifyEmail(code)`
After success: auto-logs in user (sets `user`, `isAuthenticated = true`).

### Request DTO

```typescript
class VerifyEmailDto {
  @IsEmail()
  email: string; // sent from store's unverifiedEmail state

  @IsString()
  @Length(6)
  code: string; // 6-digit OTP from email
}
```

### Flow

```
1. Find email_verifications row by email (WHERE usedAt IS NULL AND expiresAt > NOW())
2. Hash incoming code with SHA-256 → compare to stored codeHash
3. If mismatch → 401 "Invalid or expired verification code"
4. Mark row as used: SET usedAt = NOW()
5. Set user.emailVerifiedAt = NOW()
6. Auto-login: generate Access Token + Refresh Token pair (same as login flow)
7. Set refreshToken HTTP-only cookie
8. Return LoginResponseDataDto (same shape as login)
```

### Error Cases

| Scenario                 | HTTP | Message                                |
| :----------------------- | :--: | :------------------------------------- |
| Code not found / expired | 401  | `Invalid or expired verification code` |
| Already used             | 401  | `Invalid or expired verification code` |

---

## 3. `POST /auth/refresh` — Refresh Token Rotation

### Desktop caller

Background auto-refresh interceptor in the API client (when Access Token expires — 401 response triggers this).

### Flow

```
Client ──[ Cookie: refreshToken ]──▶ POST /api/v1/auth/refresh
        1. Read cookie → SHA-256 hash
        2. Lookup: { tokenHash, revokedAt: null, expiresAt: { gt: now } }
        3. Not found → 401 "Session expired or invalid"
        4. $transaction: revoke old + create new DB row (same device/IP/userAgent)
        5. Set new refreshToken HTTP-only cookie
        6. Sign new Access Token
        └── Return { accessToken, tokenType, expiresIn }
```

### Response DTO

```typescript
class RefreshResponseDto {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number; // seconds
}
```

### Error Cases

| Scenario                | HTTP | Message                      |
| :---------------------- | :--: | :--------------------------- |
| Missing cookie          | 401  | `Refresh token not provided` |
| Token expired / revoked | 401  | `Session expired or invalid` |

---

## 4. `POST /auth/logout` — Revoke Current Session

### Desktop caller

`authStore.logout()` → clears local user state + calls API.

### Flow

```
Client ──[ Bearer <AT> + Cookie: refreshToken ]──▶ POST /api/v1/auth/logout
        1. Extract refreshToken cookie → hash
        2. Find & revoke: UPDATE refresh_tokens SET revokedAt = NOW()
           WHERE tokenHash = ? AND userId = ? AND revokedAt IS NULL
        3. res.clearCookie('refreshToken', { path: '/api/v1/auth' })
        └── Return 204 No Content
```

> [!IMPORTANT]
> Guard: `JwtAuthGuard`. Scope revocation by `userId` from JWT so a
> user cannot revoke another user's session.

---

## 5. `POST /auth/forgot-password` — Request Password Reset

### Desktop caller

`forgot-password-form.tsx` → `authStore.sendPasswordReset(email)`
After success: displays "Reset code sent!" confirmation in the form.

### Request DTO

```typescript
class ForgotPasswordDto {
  @IsEmail()
  email: string;
}
```

### Flow

```
1. Look up user by email
2. If not found → return 200 OK anyway (prevent email enumeration)
3. Generate 6-digit OTP → store hashed in DB (password_reset_tokens table) with 15-min expiry
4. Send reset email via email service
5. Return 200 { message: "If this email is registered, a reset code has been sent." }
```

> [!NOTE]
> Always return HTTP 200 regardless of whether the email exists to prevent email enumeration attacks.

---

## 6. `POST /auth/reset-password` — Submit New Password

### Desktop caller

Future `reset-password-form.tsx` (not yet built in the desktop app — needs to be added as a new auth `mode`).

### Request DTO

```typescript
class ResetPasswordDto {
  @IsEmail()
  email: string;

  @IsString()
  @Length(6)
  code: string; // OTP from reset email

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
  newPassword: string;
}
```

### Flow

```
1. Find password_reset_tokens row: { email, usedAt: null, expiresAt: { gt: now } }
2. Hash code → compare to storedHash → 401 if mismatch
3. Hash newPassword with Argon2id
4. $transaction: update user.passwordHash + mark token as usedAt = NOW()
5. Revoke ALL existing refresh tokens for this user (security: force re-login on all devices)
6. Return 200 { message: "Password updated successfully" }
```

### Error Cases

| Scenario               | HTTP | Message                         |
| :--------------------- | :--: | :------------------------------ |
| Invalid / expired code | 401  | `Invalid or expired reset code` |
| Password too weak      | 400  | Validation error                |

---

## 7. `DELETE /auth/sessions/:id` — Revoke Specific Session

### Desktop caller

Future sessions management UI (not yet built — follows from `GET /auth/sessions`).

### Flow

```
Client ──[ Bearer <AT> ]──▶ DELETE /api/v1/auth/sessions/:id
        1. Parse BigInt(id)
        2. Find: { id, userId, revokedAt: null } — scope by JWT userId (IDOR prevention)
        3. Not found → 404 "Session not found"
        4. SET revokedAt = NOW()
        └── Return 204 No Content
```

---

## Schema Changes Needed

| New Table               | Purpose                                                           |
| :---------------------- | :---------------------------------------------------------------- |
| `email_verifications`   | Stores OTP hash + expiry for email verification (endpoints 1 & 2) |
| `password_reset_tokens` | Stores OTP hash + expiry for password resets (endpoints 5 & 6)    |

```prisma
model EmailVerification {
  id        BigInt    @id @default(autoincrement()) @db.UnsignedBigInt
  email     String    @db.VarChar(255)
  codeHash  String    @map("code_hash") @db.VarChar(64)
  expiresAt DateTime  @map("expires_at") @db.DateTime(3)
  usedAt    DateTime? @map("used_at") @db.DateTime(3)
  createdAt DateTime  @default(now()) @map("created_at") @db.DateTime(3)

  @@index([email], map: "idx_email_verifications_email")
  @@map("email_verifications")
}

model PasswordResetToken {
  id        BigInt    @id @default(autoincrement()) @db.UnsignedBigInt
  email     String    @db.VarChar(255)
  codeHash  String    @map("code_hash") @db.VarChar(64)
  expiresAt DateTime  @map("expires_at") @db.DateTime(3)
  usedAt    DateTime? @map("used_at") @db.DateTime(3)
  createdAt DateTime  @default(now()) @map("created_at") @db.DateTime(3)

  @@index([email], map: "idx_password_reset_tokens_email")
  @@map("password_reset_tokens")
}
```

---

## New File Structure After Full Implementation

```
src/auth/
├── dto/
│   ├── login.dto.ts                  ✅
│   ├── register.dto.ts               [ NEW ]
│   ├── verify-email.dto.ts           [ NEW ]
│   ├── forgot-password.dto.ts        [ NEW ]
│   ├── reset-password.dto.ts         [ NEW ]
│   └── auth-response.dto.ts          ✅ (add RegisterResponseDto, RefreshResponseDto)
├── guards/
│   └── jwt-auth.guard.ts             ✅
├── strategies/
│   └── jwt.strategy.ts               ✅
├── auth.controller.ts                 ✅ (add all new endpoints)
├── auth.service.ts                    ✅ (add register, verifyEmail, refresh, logout, forgotPassword, resetPassword, revokeSession)
├── auth.module.ts                     ✅ (add MailModule when ready)
└── tests/
    ├── auth.controller.spec.ts        ✅ (expand)
    └── auth.service.spec.ts           ✅ (expand)
```

---

## Desktop App Changes Needed Alongside API

| Desktop File                                | Change Needed                                                                       |
| :------------------------------------------ | :---------------------------------------------------------------------------------- |
| `src/store/auth.ts`                         | Replace all stubbed `setTimeout` mocks with real `fetch`/`axios` API calls          |
| `src/store/auth.ts`                         | Store `accessToken` in memory (not localStorage); `refreshToken` handled via cookie |
| `src/components/auth/verify-email-form.tsx` | Pass `unverifiedEmail` in request body to `POST /auth/verify-email`                 |
| `src/components/auth/`                      | Add `reset-password-form.tsx` (new mode: `'reset-password'`)                        |
| `src/store/auth.ts`                         | Add `resetPassword(email, code, newPassword)` action                                |
| `src/types/auth.type.ts`                    | Add `'reset-password'` to `AuthFormMode` union                                      |

---

## Verification Plan

### Per-endpoint Unit Tests

| Endpoint               | Key Test Cases                                                |
| :--------------------- | :------------------------------------------------------------ |
| `register`             | creates user, 409 on duplicate email, Argon2 hash called      |
| `verify-email`         | valid OTP → auto-login, expired OTP → 401, already used → 401 |
| `refresh`              | rotates token, 401 on missing/expired/revoked cookie          |
| `logout`               | revokes session + clears cookie, 401 if no token              |
| `forgot-password`      | always 200, OTP stored hashed, email sent                     |
| `reset-password`       | updates password, revokes all sessions, 401 on bad OTP        |
| `DELETE /sessions/:id` | revokes scoped session, 404 if not owned by user              |

### Manual Verification (Swagger at `http://localhost:4000/api/docs`)

1. `POST /auth/register` → receive email with 6-digit code.
2. `POST /auth/verify-email` with code → get Access Token + cookie set.
3. `GET /auth/sessions` → confirm session row has `deviceName`, `userAgent`, `ipAddress`.
4. `POST /auth/refresh` → new Access Token returned, old token revoked.
5. `POST /auth/forgot-password` → receive reset code email.
6. `POST /auth/reset-password` → confirm all sessions revoked.
7. `POST /auth/logout` → cookie cleared, `revokedAt` set in DB.
8. `DELETE /auth/sessions/:id` → specific session revoked without affecting current session.
