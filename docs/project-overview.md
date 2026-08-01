# Project Overview

## What is CodeSpace API?

`code-space-api` is the backend web service for **CodeSpace**, an Electron-based multi-terminal desktop workspace manager. It handles user authentication, account management, session management, email verification, and password reset flows.

## Tech Stack

| Component          | Technology              | Version                 | Purpose                                      |
| :----------------- | :---------------------- | :---------------------- | :------------------------------------------- |
| **Runtime**        | Node.js                 | v20.x LTS               | Server execution environment                 |
| **Language**       | TypeScript              | v5.x                    | Static typing and interfaces                 |
| **Framework**      | NestJS                  | v10.x                   | Modular RESTful API framework                |
| **Database**       | MySQL                   | v8.0                    | Relational database storage                  |
| **ORM**            | Prisma                  | v6.x                    | Type-safe database queries & migrations      |
| **Authentication** | Argon2id + JWT          | `argon2`, `@nestjs/jwt` | Password hashing & dual-token access control |
| **Validation**     | class-validator         | v0.14.x                 | Request DTO validation via decorators        |
| **Email**          | Nodemailer              | v6.x                    | SMTP transactional email delivery            |
| **API Docs**       | Swagger / OpenAPI       | `@nestjs/swagger`       | Interactive API documentation at `/api/docs` |
| **Logging**        | nestjs-pino             | v4.x                    | Structured JSON HTTP request logging         |
| **Security**       | Helmet, CORS, Throttler | via NestJS plugins      | HTTP security headers & IP rate limiting     |

## Source Map

```
src/
├── app.module.ts               # Root module wiring all feature modules
├── main.ts                     # NestJS bootstrap & global middleware setup
├── assets/
│   └── images/
│       └── logo.png            # Brand logo embedded in email templates (CID inline)
├── common/                     # Cross-cutting concerns (shared across all modules)
│   ├── decorators/
│   │   ├── response-message.decorator.ts   # @ResponseMessage() decorator
│   │   └── swagger-response.decorator.ts   # ApiSingleResponse, ApiListResponse, etc.
│   ├── dtos/
│   │   ├── api-response.dto.ts             # Standardized response envelope DTOs
│   │   └── pagination-query.dto.ts         # Shared pagination query params
│   ├── filters/
│   │   └── http-exception.filter.ts        # Global HTTP exception → error envelope
│   └── interceptors/
│       └── response.interceptor.ts         # Global success → response envelope
├── constants/                  # Shared application constants
│   ├── error-code.ts           # ERROR_CODES dictionary
│   ├── pagination.ts           # Pagination defaults
│   ├── response.ts             # Response status / meta defaults
│   └── time.ts                 # Time constants (TTLs, throttle limits)
└── modules/                    # Feature modules (each owns controller + service + tests)
    ├── account/                # User profile & password management
    │   ├── account.controller.ts
    │   ├── account.service.ts
    │   ├── account.module.ts
    │   ├── dto/
    │   │   ├── update-profile.dto.ts
    │   │   └── change-password.dto.ts
    │   └── tests/
    │       ├── account.controller.spec.ts
    │       └── account.service.spec.ts
    ├── auth/                   # Authentication & token management
    │   ├── auth.controller.ts
    │   ├── auth.service.ts
    │   ├── auth.module.ts
    │   ├── dto/
    │   │   ├── login.dto.ts
    │   │   ├── register.dto.ts
    │   │   ├── verify-email.dto.ts
    │   │   ├── forgot-password.dto.ts
    │   │   ├── reset-password.dto.ts
    │   │   ├── delete-account.dto.ts
    │   │   └── auth-response.dto.ts
    │   ├── guards/
    │   │   └── jwt-auth.guard.ts
    │   ├── strategies/
    │   │   └── jwt.strategy.ts
    │   └── tests/
    │       ├── auth.controller.spec.ts
    │       └── auth.service.spec.ts
    ├── health/                 # System health check endpoint
    │   ├── health.controller.ts
    │   ├── health.module.ts
    │   ├── health.controller.spec.ts
    │   └── dtos/
    │       └── health-response.dto.ts
    ├── mail/                   # Transactional email delivery
    │   ├── mail.service.ts
    │   ├── mail.module.ts
    │   ├── templates/
    │   │   ├── email-layout.ts             # Shared dark-mode HTML layout
    │   │   ├── verification.template.ts    # Email verification OTP template
    │   │   ├── password-reset.template.ts  # Password reset OTP template
    │   │   ├── welcome.template.ts         # Onboarding welcome template
    │   │   └── index.ts                    # Template exports barrel
    │   └── tests/
    │       └── mail.service.spec.ts
    ├── prisma/                 # Database client module
    │   ├── prisma.service.ts
    │   └── prisma.module.ts
    └── session/                # Device session listing & revocation
        ├── session.controller.ts
        ├── session.service.ts
        ├── session.module.ts
        └── tests/
            ├── session.controller.spec.ts
            └── session.service.spec.ts
```

## Key Workflows

1. **User Authentication**: Password validation using Argon2id; returns 15-minute JWT Access Tokens and 7-day HTTP-only Refresh Tokens. Token rotated on every refresh.
2. **Email Verification**: OTP code dispatched asynchronously in the background after registration; verified at `/auth/verify-email`.
3. **Password Reset**: OTP code sent to registered email via `/auth/forgot-password`; new password set at `/auth/reset-password`.
4. **Account Management**: Authenticated users can update profile, change password (revokes all sessions), delete account.
5. **Session Management**: Users can list all active device sessions and revoke individual sessions (IDOR-safe via JWT `userId` scoping).

## Core Constraints

- **Scope Isolation**: All data queries must strictly isolate data by `userId`.
- **JSON Serialization**: MySQL `BigInt` columns must be serialized to string in JSON output to prevent JavaScript number precision loss.
- **Transactional Consistency**: Password change and account deletion operations execute within Prisma `$transaction()` blocks.
- **Background Email Dispatch**: Emails are fired asynchronously (`void promise.catch(...)`) to keep HTTP response latency under 20ms.
- **Password Strength**: All password fields enforce min 6 characters with at least one uppercase letter, one lowercase letter, and one digit.
