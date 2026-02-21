# DTOs — Data Transfer Objects

DTOs define the shape of data sent to and received from the API. They keep the API contract separate from the database models, preventing over-posting attacks and controlling exactly what data is exposed.

## Naming Convention

| Suffix | Purpose | Example |
|--------|---------|---------|
| `ResponseDto` | Data returned from API | `SessionResponseDto` |
| `CreateXxxDto` | Data required to create a resource | `CreateSessionDto` |
| `UpdateXxxDto` | Data for updating (nullable fields = partial update) | `UpdateSessionDto` |
| (no suffix) | Action-specific DTOs | `LoginDto`, `MarkAttendanceDto` |

## Auth DTOs

### AuthResponseDto.cs
| DTO | Fields | Used By |
|-----|--------|---------|
| `AuthResponseDto` | Token, UserId, Email, FirstName, LastName, Roles | POST /auth/login, POST /auth/register |

### LoginDto.cs
| DTO | Fields | Used By |
|-----|--------|---------|
| `LoginDto` | Email, Password | POST /auth/login |

### RegisterDto.cs
| DTO | Fields | Used By |
|-----|--------|---------|
| `RegisterDto` | Email, Password, FirstName, LastName, RegisterAs (Student/Parent) | POST /auth/register |

## Session DTOs

### CreateSessionDto.cs
| DTO | Fields | Used By |
|-----|--------|---------|
| `CreateSessionDto` | ClassTypeId, StartDateTime, DurationMinutes (15-480), MaxStudents (1-100), Notes?, StudentIds? | POST /sessions |

### CreateBulkSessionDto.cs
| DTO | Fields | Used By |
|-----|--------|---------|
| `CreateBulkSessionDto` | ClassTypeId, StartTime (TimeSpan), DurationMinutes, FromDate, ToDate, DaysOfWeek[], Recurrence, MaxStudents, Notes?, StudentIds?, TimezoneOffsetMinutes | POST /sessions/bulk |
| `RecurrencePattern` (enum) | EveryWeek, EveryOtherWeek, EveryThreeWeeks, EveryFourWeeks | Used in CreateBulkSessionDto |

### UpdateSessionDto.cs
| DTO | Fields | Used By |
|-----|--------|---------|
| `UpdateSessionDto` | ClassTypeId?, StartDateTime?, DurationMinutes?, MaxStudents?, Notes? | PUT /sessions/{id} |
| `UpdateSessionStatusDto` | Status (string) | PATCH /sessions/{id}/status |

### SessionResponseDto.cs
| DTO | Fields | Used By |
|-----|--------|---------|
| `SessionResponseDto` | Id, ClassTypeId, ClassTypeName, ClassTypeColor, StartDateTime, EndDateTime, DurationMinutes, MaxStudents, CurrentStudentCount, Notes, Status, CreatedByUserId, CreatedByName, CreatedAt | GET /sessions, GET /sessions/{id} |

## Student DTOs

### CreateStudentDto.cs
| DTO | Fields | Used By |
|-----|--------|---------|
| `CreateStudentDto` | FirstName, LastName, Email?, Phone?, DateOfBirth?, AgeGroup? | POST /students |

### UpdateStudentDto.cs
| DTO | Fields | Used By |
|-----|--------|---------|
| `UpdateStudentDto` | FirstName?, LastName?, Email?, Phone?, DateOfBirth?, AgeGroup?, IsActive? | PUT /students/{id} |

### LinkStudentDto.cs
| DTO | Fields | Used By |
|-----|--------|---------|
| `LinkStudentDto` | UserId, LinkType ("self" or "parent") | PUT /students/{id}/link |

### StudentResponseDto.cs
| DTO | Fields | Used By |
|-----|--------|---------|
| `StudentResponseDto` | Id, FirstName, LastName, Email, Phone, DateOfBirth, AgeGroup, IsActive, TotalAttendances, UserId, LinkedUserName, ParentUserId, ParentName, CreatedAt, EnrolledPackages[] | GET /students |
| `EnrolledPackageDto` | Id, PackageName, ClassTypeName, BillingPeriod (e.g., "Feb 2026") | Nested in StudentResponseDto |

## Attendance DTOs (AttendanceDtos.cs)

| DTO | Fields | Used By |
|-----|--------|---------|
| `AttendanceResponseDto` | Id, StudentId, StudentName, Status, Notes, MarkedAt | GET /attendance/session/{id} (nested) |
| `StudentAttendanceResponseDto` | Id, SessionId, SessionDate, ClassTypeName, ClassTypeColor, Status, Notes, MarkedAt | GET /attendance/student/{id}/summary (nested) |
| `MarkAttendanceDto` | StudentId, Status, Notes? | Used in BulkMarkAttendanceDto |
| `BulkMarkAttendanceDto` | Attendances[] (list of MarkAttendanceDto) | POST /attendance/session/{id} |
| `SessionAttendanceSummaryDto` | SessionId, AssignedCount, PresentCount, AbsentCount, LateCount, ExcusedCount, Attendances[] | GET /attendance/session/{id} |
| `StudentAttendanceSummaryDto` | StudentId, StudentName, TotalSessions, PresentCount, AbsentCount, LateCount, ExcusedCount, AttendanceRate, RecentAttendances[] | GET /attendance/student/{id}/summary, GET /attendance/my |

## Billing DTOs (BillingDtos.cs)

### Package Definition DTOs
| DTO | Fields | Used By |
|-----|--------|---------|
| `PackageDefinitionResponseDto` | Id, ClassTypeId, ClassTypeName, Name, SessionCount, Price, IsActive, CreatedAt | GET /packagedefinitions |
| `CreatePackageDefinitionDto` | ClassTypeId, Name, SessionCount, Price | POST /packagedefinitions |
| `UpdatePackageDefinitionDto` | Name?, SessionCount?, Price?, IsActive? | PUT /packagedefinitions/{id} |

### Student Package DTOs
| DTO | Fields | Used By |
|-----|--------|---------|
| `StudentPackageResponseDto` | Id, StudentId, StudentName, PackageDefinitionId, PackageName, ClassTypeName, BillingYear, BillingMonth, BillingPeriod, PackagePrice, SessionCount, SessionsAttended, ProratedAmount, IsOverage, CreatedAt | GET /billing/packages |
| `EnrollStudentPackageDto` | StudentId, PackageDefinitionId, BillingYear, BillingMonth | POST /billing/packages |
| `BulkEnrollStudentPackageDto` | StudentIds[], PackageDefinitionId, BillingYear, BillingMonth | POST /billing/packages/bulk |

### Payment DTOs
| DTO | Fields | Used By |
|-----|--------|---------|
| `PaymentResponseDto` | Id, StudentId, StudentName, Amount, Discount, PaymentDate, Notes, CreatedAt, RecordedByName | GET /billing/payments |
| `RecordPaymentDto` | StudentId, Amount, Discount, PaymentDate, Notes? | POST /billing/payments |

### Billing Calculation DTOs
| DTO | Fields | Used By |
|-----|--------|---------|
| `SessionChargeDto` | SessionId, SessionDate, ClassTypeName, ClassTypeColor, ChargeAmount, ChargeSource, AttendanceStatus | Nested in StudentBalanceDto — per-session billing breakdown |
| `StudentBalanceDto` | StudentId, StudentName, TotalDues, TotalPayments, TotalDiscounts, OutstandingBalance, Packages[], SessionCharges[], RecentPayments[] | GET /billing/summary (nested), GET /billing/student/{id} |
| `BillingSummaryDto` | TotalOutstanding, CollectedThisMonth, StudentsWithDues, StudentBalances[] | GET /billing/summary |
| `ParentBillingSummaryDto` | TotalOutstanding, TotalPaid, Children[] (StudentBalanceDto) | GET /billing/my |

**ChargeSource examples:**
- `"Package: 4-Session Pack ($20.00/session)"` — covered by package at package rate
- `"Default Rate"` — no package, charged at class type's default session price

## Student Link Request DTOs (StudentLinkRequestDtos.cs)

| DTO | Fields | Used By |
|-----|--------|---------|
| `ClaimStudentDto` | StudentId, LinkType (Self/Parent) | POST /studentlinkrequests/claim |
| `CreateStudentRequestDto` | FirstName, LastName, Email?, Phone?, DateOfBirth?, AgeGroup?, LinkType | POST /studentlinkrequests/create-student |
| `ReviewLinkRequestDto` | Notes? | PUT /studentlinkrequests/{id}/reject |
| `StudentLinkRequestResponseDto` | Id, RequestedByUserId, RequestedByName, RequestedByEmail, StudentId, StudentName, LinkType, Status, NewFirstName, NewLastName, NewEmail, NewPhone, NewDateOfBirth, NewAgeGroup, CreatedAt, ReviewedByName, ReviewedAt, ReviewNotes | GET /studentlinkrequests/* |

## ClassType DTOs (ClassTypeResponseDto.cs)

| DTO | Fields | Used By |
|-----|--------|---------|
| `ClassTypeResponseDto` | Id, Name, Color, Description, TargetAgeGroup, DefaultSessionPrice, IsActive, CreatedAt | GET /classtypes |
| `CreateClassTypeDto` | Name, Color?, Description?, TargetAgeGroup?, DefaultSessionPrice | POST /classtypes |
| `UpdateClassTypeDto` | Name?, Color?, Description?, TargetAgeGroup?, DefaultSessionPrice?, IsActive? | PUT /classtypes/{id} |
