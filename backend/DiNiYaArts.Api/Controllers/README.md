# Controllers — API Endpoints

This folder contains 9 API controllers exposing ~50 endpoints. All controllers use `[ApiController]` and return JSON responses.

## Authentication & Authorization Pattern

- All controllers (except Auth's login/register) require authentication via `[Authorize]`
- Role-based restrictions use `[Authorize(Roles = "Administrator,Instructor")]`
- Some endpoints have additional ownership checks within the action method

## Controller Overview

| Controller | Route Base | Purpose |
|------------|-----------|---------|
| AuthController | `/api/auth` | Registration, login, current user |
| SessionsController | `/api/sessions` | Session CRUD, bulk creation, status management |
| StudentsController | `/api/students` | Student CRUD, user linking, search |
| AttendanceController | `/api/attendance` | Mark/view attendance per session or student |
| BillingController | `/api/billing` | Packages, payments, balance calculations |
| ClassTypesController | `/api/classtypes` | Class type CRUD with pricing |
| PackageDefinitionsController | `/api/packagedefinitions` | Package template CRUD |
| StudentLinkRequestsController | `/api/studentlinkrequests` | Link request workflow |
| UsersController | `/api/users` | User management and role assignment |

---

## AuthController.cs

Handles user registration, login, and JWT token generation. The only controller with public (unauthenticated) endpoints.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | Public | Register new user. Assigns default role based on `registerAs` field (Student/Parent). Returns JWT token. |
| POST | `/api/auth/login` | Public | Validate credentials, update LastLoginAt, return JWT token with user info and roles. |
| GET | `/api/auth/me` | All | Return current user's profile (id, email, name, roles). Used by frontend to validate token on app load. |

**Key Logic:**
- Registration creates user via ASP.NET Identity, assigns role, generates JWT
- Login checks `IsActive` flag — deactivated users cannot log in
- JWT includes claims: `sub`, `email`, `given_name`, `family_name`, `role` (multiple)
- Token expiry configurable via `JwtSettings:ExpirationInHours`

---

## SessionsController.cs

Manages class sessions — the core scheduling feature. Supports single and bulk/recurring creation.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/sessions` | All | List sessions. Supports `?from=&to=&classTypeId=` filters for calendar date range queries. |
| GET | `/api/sessions/{id}` | All | Get single session with class type, creator, and attendance count. |
| POST | `/api/sessions` | Admin/Instructor | Create single session. Optionally assign students. Frontend sends UTC datetime. |
| POST | `/api/sessions/bulk` | Admin/Instructor | Create recurring sessions. Accepts date range, days of week, recurrence pattern, timezone offset. Generates multiple sessions. |
| PUT | `/api/sessions/{id}` | Admin/Instructor | Update session (only if status=Scheduled). Instructors can only update their own. |
| DELETE | `/api/sessions/{id}` | Admin/Instructor | Delete session (not if Completed). Instructors can only delete their own. |
| PATCH | `/api/sessions/{id}/status` | Admin/Instructor | Change status (Scheduled/Completed/Cancelled). Instructors can only change their own. |
| POST | `/api/sessions/bulk-complete` | Admin/Instructor | Mark all past Scheduled sessions as Completed in one action. |

**Key Logic:**
- Bulk creation generates dates by iterating from `FromDate` to `ToDate`, checking `DaysOfWeek`, and applying recurrence interval
- Timezone offset from frontend converts local start time to UTC for consistent storage
- Status lifecycle: `Scheduled → Completed` or `Scheduled → Cancelled`. Completed sessions cannot be deleted. Cancelled sessions can be reopened (back to Scheduled).
- Ownership check: Instructors can only modify sessions they created. Admins can modify any.

**Bulk Session Date Generation:**
```
for each date from FromDate to ToDate:
  if date.DayOfWeek in DaysOfWeek:
    create session at date + startTime (converted to UTC)
  if completed a full week and recurrence > 1:
    skip (recurrence - 1) weeks
```

---

## StudentsController.cs

CRUD for student profiles. Includes search, user linking, and package enrollment data.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/students` | All | List students with search. Includes attendance count, linked user, parent, enrolled packages. |
| GET | `/api/students/{id}` | All | Get single student with full details. |
| POST | `/api/students` | Admin/Instructor | Create student. Parses AgeGroup enum from string. |
| PUT | `/api/students/{id}` | Admin/Instructor | Update student fields (partial update — only non-null fields are applied). |
| PUT | `/api/students/{id}/link` | Admin only | Directly link a student to a user account (as Self or Parent). No approval needed. |
| DELETE | `/api/students/{id}` | Admin/Instructor | Delete student. **Blocked** if student has attendance records (must deactivate instead). |
| GET | `/api/students/search-users` | Admin only | Search users by name/email for the linking feature. Returns top 10 matches. |

**Key Logic:**
- `MapToDto()` builds the response including: attendance count, linked user name, parent name, enrolled packages (sorted by most recent billing period)
- Delete protection: Students with attendance records cannot be deleted to preserve billing history. Use `IsActive = false` instead.
- Package data: Includes `EnrolledPackages` list showing class type, package name, and billing period (e.g., "Painting: 4-Session Pack (Feb 2026)")

---

## AttendanceController.cs

Manages attendance marking — the bridge between sessions and billing.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/attendance/session/{sessionId}` | All | Get attendance summary for a session (counts by status + individual records). |
| POST | `/api/attendance/session/{sessionId}` | Admin/Instructor | Bulk mark attendance. Creates new records or updates existing ones. |
| PUT | `/api/attendance/{id}` | Admin/Instructor | Update single attendance record (status and notes). |
| DELETE | `/api/attendance/{id}` | Admin/Instructor | Remove attendance record (unassign student from session). |
| GET | `/api/attendance/student/{studentId}` | Authorized* | Get student's full attendance history. |
| GET | `/api/attendance/student/{studentId}/summary` | Authorized* | Get student's attendance statistics (counts, rate, recent records). |
| GET | `/api/attendance/my` | All | Get attendance summaries for current user's linked students. Used by My Students page. |

*Access-controlled: Admins/Instructors can view any student. Students/Parents can only view their own linked students.

**Key Logic:**
- `BuildStudentSummary()` calculates: total sessions, present/absent/late/excused counts, attendance rate ((Present + Late) / total marked * 100)
- Attendance records sorted by session date descending (newest first)
- `CanAccessStudent()` helper checks if the current user is Admin/Instructor OR linked to the student

---

## BillingController.cs

The most complex controller — handles packages, payments, and the attendance-driven billing calculation.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/billing/packages` | Admin/Instructor | List student package enrollments. Filters: `year`, `month`, `studentId`. |
| POST | `/api/billing/packages` | Admin/Instructor | Enroll a student in a package for a specific billing month. Snapshots price/session count. |
| POST | `/api/billing/packages/bulk` | Admin/Instructor | Bulk enroll multiple students in the same package. |
| DELETE | `/api/billing/packages/{id}` | Admin only | Delete a package enrollment. |
| GET | `/api/billing/payments` | Admin/Instructor | List payments. Filters: `studentId`, `from`, `to`. |
| POST | `/api/billing/payments` | Admin/Instructor | Record a payment (amount + optional discount). |
| DELETE | `/api/billing/payments/{id}` | Admin only | Delete a payment record. |
| GET | `/api/billing/summary` | Admin/Instructor | Monthly billing summary. Shows total outstanding, collected, per-student balances with session charges. |
| GET | `/api/billing/student/{studentId}` | Authorized* | Get a single student's balance. Access-controlled. |
| GET | `/api/billing/my` | Parent/Student | Get billing summary for current user's children. All-time balance calculation. |

**Key Logic — `BuildSessionCharges()`:**
This is the core billing calculation. For a given student and month:
1. Find all billable attendance (Present or Late) in the month
2. Group by ClassTypeId
3. For each class type:
   - If student has a package: charge package rate for first N sessions, default rate for extras
   - If no package: charge default rate for all sessions
4. Return list of `SessionChargeDto` with per-session breakdown

**Key Logic — `ComputeAllTimeDues()`:**
Used by `/my` endpoint for running balance. Iterates all months where the student has attendance (from earliest attendance to now), calling `BuildSessionCharges()` for each month.

**SQLite Workaround:**
SQLite cannot aggregate `decimal` with `SumAsync()`. All sum operations use:
```csharp
var values = await query.Select(x => x.Amount).ToListAsync();
var total = values.Sum();
```

---

## ClassTypesController.cs

CRUD for class types (Painting, Yoga, etc.) with default pricing.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/classtypes` | All | List class types. `?includeInactive=true` to show disabled ones. |
| GET | `/api/classtypes/{id}` | All | Get single class type. |
| POST | `/api/classtypes` | Admin only | Create class type with name, color, description, age group, default price. |
| PUT | `/api/classtypes/{id}` | Admin only | Update class type fields (partial update). |
| DELETE | `/api/classtypes/{id}` | Admin only | Delete class type. **Soft-delete** (sets `IsActive = false`) if sessions exist. **Hard-delete** if no sessions. |

---

## PackageDefinitionsController.cs

CRUD for package templates (e.g., "4-Session Painting Pack — $80").

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/packagedefinitions` | Admin/Instructor | List packages. Filters: `classTypeId`, `activeOnly`. |
| POST | `/api/packagedefinitions` | Admin only | Create package with class type, name, session count, price. |
| PUT | `/api/packagedefinitions/{id}` | Admin only | Update package details. |
| DELETE | `/api/packagedefinitions/{id}` | Admin only | Delete package. **Soft-delete** if enrollments exist. **Hard-delete** if none. |

---

## StudentLinkRequestsController.cs

Manages the workflow for users to link their accounts to student profiles.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/studentlinkrequests/search-students` | All | Search students by name for claiming. Returns id, name, age group. Min 2 chars. |
| POST | `/api/studentlinkrequests/claim` | All | Submit request to claim an existing student (as Self or Parent). |
| POST | `/api/studentlinkrequests/create-student` | All | Submit request to create a new student profile and link to it. |
| GET | `/api/studentlinkrequests/my` | All | Get current user's link requests with status. |
| GET | `/api/studentlinkrequests/all` | Admin/Instructor | Get all requests. Optional `?status=Pending` filter. |
| GET | `/api/studentlinkrequests/pending` | Admin/Instructor | Shortcut for pending requests only. |
| GET | `/api/studentlinkrequests/pending-count` | Admin/Instructor | Get count of pending requests (for badge/notification). |
| PUT | `/api/studentlinkrequests/{id}/approve` | Admin/Instructor | Approve request. If claiming: sets Student.UserId or ParentUserId. If creating: creates new Student and links. |
| PUT | `/api/studentlinkrequests/{id}/reject` | Admin/Instructor | Reject request with optional notes. |
| DELETE | `/api/studentlinkrequests/clear-resolved` | Admin only | Bulk delete all Approved and Rejected requests. |

**Approval Logic:**
- **Claim existing student:** Sets `student.UserId` (Self) or `student.ParentUserId` (Parent) to the requesting user
- **Create new student:** Creates a new Student entity from the request fields, then links it to the requesting user

---

## UsersController.cs

Admin-only user management.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/users` | Admin only | List all users with roles. Optional `?search=` for name/email filter. |
| GET | `/api/users/{id}` | Admin only | Get single user with roles. |
| PUT | `/api/users/{id}/roles` | Admin only | Assign a role to a user. Validates role exists. |
| DELETE | `/api/users/{id}/roles/{role}` | Admin only | Remove a role from a user. Prevents removing own Admin role. |
