# Authentication

## Strategy

The API uses a **hybrid JWT strategy**:

- **Access Token** — short-lived (default `15m`), signed with `JWT_ACCESS_SECRET`, sent in the response body. The client stores this in memory (never `localStorage`).
- **Refresh Token** — long-lived (default `7d`), signed with `JWT_REFRESH_SECRET`, set as an `HttpOnly`, `SameSite=Strict`, `Secure` (production) cookie. The client never touches this directly.

This combination prevents XSS-based token theft (access token in memory only) while preventing CSRF (cookie is `SameSite=Strict`).

---

## Token Lifecycle

```
POST /auth/register
    │ → creates User + UserSettings (with defaults)
    ▼

POST /auth/login
    │ → verifies password (Argon2id)
    │ → creates RefreshToken record in DB
    │ → signs access token + refresh token
    │ → sets refreshToken cookie (HttpOnly)
    ▼ → returns accessToken in body

GET /api/v1/* (authenticated)
    │ → reads Authorization: Bearer <access_token>
    │ → verifyAccessToken() validates signature + expiry
    ▼ → attaches { userId, email } to req.user

POST /auth/refresh
    │ → reads refreshToken cookie
    │ → verifyRefreshToken() validates signature + expiry
    │ → looks up token in DB (confirms it hasn't been revoked)
    │ → deletes old RefreshToken record
    │ → creates new RefreshToken record (rotation)
    │ → signs new access token
    ▼ → sets new refreshToken cookie, returns new accessToken

POST /auth/logout
    │ → reads refreshToken cookie
    │ → deletes RefreshToken record from DB
    ▼ → clears cookie, returns 204
```

---

## Refresh Token Rotation & Family Protection

Each refresh token is stored in the `refresh_tokens` table and is single-use. On every `/auth/refresh` call:

1. The old token is deleted.
2. A new token is inserted.
3. The new token is set as the cookie.

If a refresh token is presented that no longer exists in the database (i.e. it was already used), **the entire user's refresh token family is revoked** — all `RefreshToken` rows for that user are deleted. This detects token replay attacks where an attacker obtained an old refresh token.

---

## Password Hashing

All passwords are hashed with **Argon2id** via the `hashPassword` utility (`src/utils/hash.util.ts`):

| Parameter      | Value             |
| -------------- | ----------------- |
| Algorithm      | Argon2id          |
| Memory cost    | 64 MB (2^16 KiB)  |
| Time cost      | 3 iterations      |
| Parallelism    | 1                 |

These defaults meet OWASP recommendations for interactive logins as of 2025.

---

## JWT Payload

Both access and refresh tokens carry the same minimal payload:

```typescript
interface JwtPayload {
  userId: string;  // UUID
  email: string;
}
```

Do not add sensitive data to the payload — JWTs are base64-encoded, not encrypted.

---

## Middleware — `authenticateJwt`

Source: [`src/middlewares/auth.middleware.ts`](../src/middlewares/auth.middleware.ts)

Applied to all protected routes. Reads and verifies the `Authorization: Bearer` header.

On success: attaches `req.user = { userId, email }`.

On failure: throws `ApiError.unauthorized(...)`, which reaches `globalErrorHandler` and returns `401`.

Usage in routes:

```typescript
import { authenticateJwt } from '../middlewares/auth.middleware';

router.get('/sync/pull', authenticateJwt, asyncHandler(pullState));
```

---

## Cookie Configuration

The refresh token cookie is set with:

```typescript
res.cookie('refreshToken', token, {
  httpOnly: true,                                    // not readable by JS
  secure: process.env.NODE_ENV === 'production',     // HTTPS only in prod
  sameSite: 'strict',                                // blocks CSRF
  maxAge: 7 * 24 * 60 * 60 * 1000,                  // 7 days
});
```

---

## Security Constants

Defined in [`src/constants/security.ts`](../src/constants/security.ts):

```typescript
export const ACCESS_TOKEN_EXPIRES_IN  = env.JWT_ACCESS_EXPIRES_IN;   // '15m'
export const REFRESH_TOKEN_EXPIRES_IN = env.JWT_REFRESH_EXPIRES_IN;  // '7d'
export const REFRESH_COOKIE_MAX_AGE   = 7 * 24 * 60 * 60 * 1000;    // ms
```

---

## Related Docs

- [api-reference.md](api-reference.md) — endpoint shapes
- [servercn-components.md](servercn-components.md) — `jwt-utils`, `password-hashing`, `verify-auth-middleware`
