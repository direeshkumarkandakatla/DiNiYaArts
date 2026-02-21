# Models — Entity Models & Enums

This folder contains all Entity Framework Core entity models and their associated enums. These models define the database schema and relationships.

## Entity Relationship Overview

```
ApplicationUser (ASP.NET Identity)
    │
    ├── 1:M ──► Session (CreatedBy)         "Instructor creates sessions"
    ├── 1:1 ──► Student (UserId)            "User IS this student"
    ├── 1:M ──► Student (ParentUserId)      "User manages these children"
    ├── 1:M ──► StudentLinkRequest          "User requested these links"
    ├── 1:M ──► Payment (RecordedBy)        "Admin recorded these payments"
    └── 1:M ──► StudentPackage (CreatedBy)  "Admin enrolled these packages"

ClassType
    │
    ├── 1:M ──► Session                     "Painting sessions, Yoga sessions"
    └── 1:M ──► PackageDefinition           "Painting 4-Pack, Yoga Monthly"

Session
    │
    └── 1:M ──► Attendance                  "Students assigned/attended"

Student
    │
    ├── 1:M ──► Attendance                  "Student's attendance records"
    ├── 1:M ──► StudentPackage              "Student's enrolled packages"
    ├── 1:M ──► Payment                     "Payments made for student"
    └── 1:M ──► StudentLinkRequest          "Link claims for this student"

PackageDefinition
    │
    └── 1:M ──► StudentPackage              "Enrollments of this package"
```

## Models

### ApplicationUser.cs
Extends ASP.NET Core Identity's `IdentityUser`. Adds custom fields for the studio context.

| Property | Type | Description |
|----------|------|-------------|
| FirstName | string? | User's first name |
| LastName | string? | User's last name |
| ProfileImageUrl | string? | Avatar URL (future use) |
| CreatedAt | DateTime | Account creation timestamp |
| LastLoginAt | DateTime? | Last successful login |
| IsActive | bool | Can be deactivated by admin |

**Navigation Properties:**
- `CreatedSessions` — Sessions this user created (as instructor)
- `StudentProfile` — The student record linked to this user (if any)
- `ManagedStudents` — Students this user manages as parent

---

### ClassType.cs
Defines a type of class offered by the studio (e.g., Painting, Yoga, Pottery).

| Property | Type | Description |
|----------|------|-------------|
| Id | int | Primary key |
| Name | string | "Painting", "Yoga", etc. |
| Color | string | Hex color for calendar display (default: "#3B82F6") |
| Description | string? | Optional description |
| TargetAgeGroup | AgeGroup enum | Which age group this class targets |
| DefaultSessionPrice | decimal | Price per session for students without a package |
| IsActive | bool | Soft-delete flag |
| CreatedAt | DateTime | Creation timestamp |

**Navigation Properties:**
- `Sessions` — All sessions of this class type

---

### Session.cs
A single scheduled class session (e.g., "Painting class on Feb 20 at 3:30 PM").

| Property | Type | Description |
|----------|------|-------------|
| Id | int | Primary key |
| ClassTypeId | int | FK to ClassType |
| StartDateTime | DateTime | When the session starts (stored as UTC) |
| DurationMinutes | int | How long the session lasts |
| MaxStudents | int | Capacity limit (default: 10) |
| Notes | string? | Instructor notes |
| Status | SessionStatus enum | Scheduled, Completed, or Cancelled |
| CreatedByUserId | string | FK to ApplicationUser (the instructor) |
| CreatedAt | DateTime | Creation timestamp |
| EndDateTime | DateTime | **Computed** — `StartDateTime + DurationMinutes` |

**Navigation Properties:**
- `ClassType` — The class type for this session
- `CreatedBy` — The instructor who created it
- `Attendances` — Student attendance records for this session

**Index:** `StartDateTime` (for date range queries on calendar)

---

### Student.cs
A student enrolled in the studio. May or may not be linked to a user account.

| Property | Type | Description |
|----------|------|-------------|
| Id | int | Primary key |
| FirstName | string | Student's first name |
| LastName | string | Student's last name |
| Email | string? | Contact email (unique if provided) |
| Phone | string? | Contact phone |
| DateOfBirth | DateTime? | For age calculation |
| UserId | string? | FK to ApplicationUser — the student's own account |
| ParentUserId | string? | FK to ApplicationUser — parent who manages this student |
| AgeGroup | AgeGroup? | Manual age group override |
| IsActive | bool | Active/inactive toggle |
| CreatedAt | DateTime | Creation timestamp |

**Navigation Properties:**
- `User` — The user account linked as "self"
- `Parent` — The user account linked as "parent"
- `Attendances` — All attendance records
- `Packages` — All package enrollments (StudentPackage)
- `Payments` — All payment records

**Important:** A student can exist without any user account (created by admin). The `UserId` and `ParentUserId` are set when a user claims the student via the link request system.

---

### Attendance.cs
Tracks whether a student was present at a session.

| Property | Type | Description |
|----------|------|-------------|
| Id | int | Primary key |
| SessionId | int | FK to Session |
| StudentId | int | FK to Student |
| Status | AttendanceStatus enum | Assigned, Present, Absent, Late, Excused |
| Notes | string? | Optional notes (e.g., "arrived 10 min late") |
| MarkedAt | DateTime | When the status was last updated |

**Unique Constraint:** `(SessionId, StudentId)` — one attendance record per student per session.

**Cascade Delete:** Deleting a Session or Student cascades to their attendance records.

---

### PackageDefinition.cs
A package template that students can be enrolled in (e.g., "Painting 4-Session Pack — $80").

| Property | Type | Description |
|----------|------|-------------|
| Id | int | Primary key |
| ClassTypeId | int | FK to ClassType |
| Name | string | "4-Session Pack", "Monthly Unlimited" |
| SessionCount | int | Number of sessions covered |
| Price | decimal | Package price |
| IsActive | bool | Soft-delete flag |
| CreatedAt | DateTime | Creation timestamp |

**Navigation Properties:**
- `ClassType` — Which class type this package is for

---

### StudentPackage.cs
An enrollment record — "Student X is enrolled in Package Y for Feb 2026".

| Property | Type | Description |
|----------|------|-------------|
| Id | int | Primary key |
| StudentId | int | FK to Student |
| PackageDefinitionId | int | FK to PackageDefinition |
| BillingYear | int | Year of enrollment (e.g., 2026) |
| BillingMonth | int | Month of enrollment (1-12) |
| PackagePrice | decimal | Price snapshot at time of enrollment |
| SessionCount | int | Session count snapshot at time of enrollment |
| Notes | string? | Optional notes |
| CreatedAt | DateTime | Enrollment timestamp |
| CreatedByUserId | string | FK to ApplicationUser (who enrolled them) |

**Unique Constraint:** `(StudentId, PackageDefinitionId, BillingYear, BillingMonth)` — one enrollment per student per package per month.

**Why snapshot Price and SessionCount?** If the package definition price changes later, existing enrollments keep the price they were enrolled at.

---

### Payment.cs
Records a payment made for a student.

| Property | Type | Description |
|----------|------|-------------|
| Id | int | Primary key |
| StudentId | int | FK to Student |
| Amount | decimal | Payment amount |
| Discount | decimal | Discount applied (reduces balance separately) |
| PaymentDate | DateTime | When the payment was made |
| Notes | string? | "Cash", "Online transfer", reference numbers |
| CreatedAt | DateTime | Record creation timestamp |
| RecordedByUserId | string | FK to ApplicationUser (admin who recorded it) |

---

### StudentLinkRequest.cs
Tracks requests from users to link their account to a student profile.

| Property | Type | Description |
|----------|------|-------------|
| Id | int | Primary key |
| RequestedByUserId | string | FK to ApplicationUser — who made the request |
| StudentId | int? | FK to Student — set when claiming existing, null when creating new |
| LinkType | StudentLinkType enum | Self or Parent |
| Status | LinkRequestStatus enum | Pending, Approved, Rejected |
| NewFirstName, NewLastName, etc. | string? | Fields for "create new student" requests |
| CreatedAt | DateTime | Request timestamp |
| ReviewedByUserId | string? | FK to ApplicationUser — admin who reviewed |
| ReviewedAt | DateTime? | When it was reviewed |
| ReviewNotes | string? | Admin's notes (especially for rejections) |

**On Delete:** If the linked Student is deleted, `StudentId` is set to null (SetNull behavior).

---

## Enums

### AgeGroup
```
Toddlers    (1-3 years)
Preschool   (4-5 years)
Kids        (6-9 years)
Preteens    (10-12 years)
Teens       (13-17 years)
Adults      (18+ years)
Seniors     (65+ years)
AllAges
```

### SessionStatus
```
Scheduled   — Future session, can be edited
Completed   — Past session, locked for billing
Cancelled   — Cancelled, shown with strikethrough on calendar
```

### AttendanceStatus
```
Assigned    — Student is assigned to session but hasn't attended yet
Present     — Student attended (generates billing charge)
Absent      — Student was absent
Late        — Student was late but attended (generates billing charge)
Excused     — Student was excused
```

### StudentLinkType
```
Self        — "I am this student"
Parent      — "I am this student's parent/guardian"
```

### LinkRequestStatus
```
Pending     — Awaiting admin review
Approved    — Admin approved, student is now linked
Rejected    — Admin rejected with optional notes
```

### RecurrencePattern (in CreateBulkSessionDto)
```
EveryWeek         — Weekly sessions
EveryOtherWeek    — Bi-weekly
EveryThreeWeeks   — Every 3 weeks
EveryFourWeeks    — Every 4 weeks (monthly)
```
