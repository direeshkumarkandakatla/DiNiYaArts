# Backend — DiNiYaArts.Api

ASP.NET Core 8 Web API that powers the DiNiYa Arts Studio application. Handles authentication, session scheduling, student management, attendance tracking, and billing.

## Architecture Overview

```
DiNiYaArts.Api/
├── Controllers/         # API endpoints (9 controllers, ~50 endpoints)
├── Data/                # EF Core DbContext, seed data, Fluent API config
├── DTOs/                # Request/response objects (keeps API contract separate from models)
├── Middleware/           # Custom middleware (request logging, exception handling)
├── Migrations/          # EF Core database migrations (auto-generated)
├── Models/              # Entity models (9 models) and enums
├── Properties/          # Launch settings
├── Program.cs           # Application entry point, DI container, middleware pipeline
├── appsettings.json     # Configuration (JWT, Serilog, DB connection)
└── appsettings.Development.json
```

## How a Request Flows Through the System

```
HTTP Request
    │
    ▼
ExceptionHandlingMiddleware      ← Catches unhandled exceptions, returns JSON error
    │
    ▼
RequestLoggingMiddleware         ← Logs request start/end with timing
    │
    ▼
Serilog Request Logging          ← Adds HTTP request summary to structured logs
    │
    ▼
CORS (AllowFrontend policy)      ← Allows requests from http://localhost:5173
    │
    ▼
JWT Authentication               ← Validates Bearer token from Authorization header
    │
    ▼
Authorization                    ← Checks [Authorize] and [Authorize(Roles = "...")] attributes
    │
    ▼
Controller Action                ← Business logic, DB queries via EF Core
    │
    ▼
ApplicationDbContext (EF Core)   ← SQLite database via Entity Framework
    │
    ▼
JSON Response                    ← System.Text.Json serializes DTOs to JSON
```

## Authentication & Authorization

### JWT Token Flow
1. User calls `POST /api/auth/login` with email and password
2. Backend validates credentials via ASP.NET Core Identity
3. Backend generates a JWT token containing:
   - `sub`: User ID
   - `email`: User email
   - `given_name` / `family_name`: User name
   - `role`: User roles (can have multiple)
4. Token is returned to frontend and stored in `localStorage`
5. All subsequent requests include `Authorization: Bearer <token>` header
6. JWT middleware validates token signature, expiry, issuer, and audience

### Role-Based Authorization
- Endpoints use `[Authorize]` for "any authenticated user"
- Endpoints use `[Authorize(Roles = "Administrator,Instructor")]` for role restrictions
- Some endpoints have additional ownership checks (e.g., Instructors can only edit their own sessions)

### Roles
| Role | Description |
|------|-------------|
| Administrator | Full system access |
| Instructor | Session/student/attendance management (own sessions only for edit/delete) |
| Student | View-only access, can link to student profile |
| Parent | View-only access, can manage children's profiles |

## Database

### Provider
- **SQLite** for development (file: `diniyaarts.db`)
- Connection string in `appsettings.json`

### Key Design Decisions
- **DateTime storage**: Single sessions store UTC (frontend converts via `.toISOString()`). Bulk sessions send timezone offset for UTC conversion. SQLite preserves `DateTimeKind.Utc` via the "K" format specifier.
- **Decimal handling**: SQLite cannot aggregate `decimal` with `SumAsync()`. All sum operations materialize data to a list first, then sum client-side with LINQ to Objects.
- **Soft deletes**: ClassTypes and PackageDefinitions use `IsActive` flag instead of hard delete when they have associated records.
- **Cascade deletes**: Attendance records cascade when Session or Student is deleted. Other relationships use Restrict or SetNull.

### Migrations
```bash
# Create a new migration
dotnet ef migrations add MigrationName

# Apply migrations
dotnet ef database update

# Undo last migration
dotnet ef migrations remove
```

## Billing Logic (Key Business Rules)

The billing system is **attendance-driven** — every attended session (Present or Late) generates a charge.

### Calculation per student per month:
```
For each classType the student attended:
  billableCount = count(attendance where status=Present|Late, session.classTypeId=classType)

  if student has a package for this classType + month:
    coveredSessions = min(billableCount, package.SessionCount)
    packageRate = package.PackagePrice / package.SessionCount
    packageCharge = coveredSessions * packageRate
    extraSessions = max(0, billableCount - package.SessionCount)
    extraCharge = extraSessions * classType.DefaultSessionPrice
    total = packageCharge + extraCharge
  else:
    total = billableCount * classType.DefaultSessionPrice

OutstandingBalance = totalDues - totalPayments - totalDiscounts
```

### Key Points:
- No student slips through billing — if they attend, they get charged
- Package = discounted rate. No package = default class type rate
- Extra sessions beyond package count are charged at default rate
- Payments and discounts reduce the outstanding balance

## Configuration (appsettings.json)

| Section | Purpose |
|---------|---------|
| `ConnectionStrings.DefaultConnection` | SQLite database path |
| `JwtSettings.Secret` | JWT signing key (must be 32+ chars) |
| `JwtSettings.Issuer` / `Audience` | JWT token validation |
| `JwtSettings.ExpirationInHours` | Token lifetime |
| `DefaultAdmin` | Auto-created admin account on first startup |
| `Serilog` | Logging configuration (console + file sinks) |

## Logging

Uses **Serilog** with structured logging:
- **Console sink**: For development
- **File sink**: Rolling daily files in `logs/` directory
- **Request logging middleware**: Logs every request with unique ID, duration, status code
- **Exception middleware**: Logs full exception details including inner exceptions

## Running the Backend

```bash
cd backend/DiNiYaArts.Api
dotnet restore
dotnet ef database update    # Apply migrations
dotnet run                   # Start on https://localhost:7199
```

Swagger UI is available at `https://localhost:7199/swagger` in development mode.

## Folder Documentation

Each subfolder has its own detailed README:
- [`Controllers/README.md`](DiNiYaArts.Api/Controllers/README.md) — All 50+ API endpoints with auth requirements
- [`Models/README.md`](DiNiYaArts.Api/Models/README.md) — Entity models, relationships, ER diagram
- [`DTOs/README.md`](DiNiYaArts.Api/DTOs/README.md) — All request/response DTOs
- [`Data/README.md`](DiNiYaArts.Api/Data/README.md) — DbContext configuration, seed data, constraints
- [`Middleware/README.md`](DiNiYaArts.Api/Middleware/README.md) — Custom middleware pipeline
