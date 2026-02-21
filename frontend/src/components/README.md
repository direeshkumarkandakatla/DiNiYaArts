# Components — Reusable UI Components

This folder contains reusable components shared across multiple pages. These are not route-level components — they are dialogs, route guards, and embedded widgets.

## Component Overview

| Component | Type | Used By | Description |
|-----------|------|---------|-------------|
| Layout | Shell | All authenticated pages | Sidebar + topbar wrapper |
| ProtectedRoute | Route guard | App.jsx | Requires authentication |
| RoleRoute | Route guard | App.jsx | Requires specific role(s) |
| CreateSessionDialog | Dialog | SessionCalendar, SessionList | Create single/recurring sessions |
| SessionDetailDialog | Dialog | SessionCalendar, SessionList | View/edit session, mark attendance |
| StudentDialog | Dialog | StudentList | Create/edit student profile |
| EnrollPackageDialog | Dialog | BillingDashboard, StudentList | Enroll student(s) in a package |
| RecordPaymentDialog | Dialog | BillingDashboard | Record payment for a student |
| AttendanceMarker | Widget | SessionDetailDialog | Mark attendance for a session |
| StudentAttendanceHistory | Widget | MyStudents | Student's attendance with filters |

---

## Layout.jsx

**Type:** Shell component wrapping all authenticated pages.

**Structure:**
```
┌──────────────────────────────────────────────┐
│  Top Bar (app name, user info)               │
├────────┬─────────────────────────────────────┤
│        │                                     │
│  Side  │      Page Content                   │
│  bar   │      (children)                     │
│        │                                     │
│  Nav   │                                     │
│  items │                                     │
│        │                                     │
├────────┤                                     │
│ Role   │                                     │
│ switch │                                     │
│ Logout │                                     │
└────────┴─────────────────────────────────────┘
```

**Features:**
- Collapsible sidebar (toggle with hamburger icon)
- Role-aware navigation items:
  - **All roles:** Dashboard, Session Calendar, Sessions
  - **Admin/Instructor:** Students, Billing, Link Requests (with pending count badge)
  - **Admin only:** Users, Class Types
  - **Student/Parent:** My Students, My Dues
- Role switcher dropdown (for multi-role users)
- Logout button
- Pending link request badge (fetched on mount for Admin/Instructor)

**Navigation items** are defined as arrays per role, each with: `{ text, icon, path }`. The active item is highlighted based on current route.

---

## ProtectedRoute.jsx

**Type:** Route guard component.

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| children | ReactNode | Component to render if authenticated |

**Behavior:**
- If `loading` (checking token): shows CircularProgress spinner
- If not authenticated: redirects to `/` (landing page)
- If authenticated: renders children

---

## RoleRoute.jsx

**Type:** Route guard component for role-based access.

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| roles | string[] | Required roles (user must have at least one) |
| children | ReactNode | Component to render if authorized |

**Behavior:**
- If user has any of the specified roles: renders children
- If not: redirects to `/dashboard`

---

## CreateSessionDialog.jsx

**Type:** Dialog component for creating sessions.

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| open | bool | Dialog visibility |
| onClose | function | Called when dialog is dismissed |
| onCreated | function | Called after successful creation (triggers parent refresh) |
| initialDate | Date? | Pre-fill date from calendar slot click |

**Two modes (toggle at top):**

### Single Session Mode
- Class Type dropdown (with color dots)
- Date & Time picker (`datetime-local`)
- Duration (minutes)
- Max Students
- Notes
- Student assignment checklist (search, select all/deselect all)

### Recurring Session Mode
- Class Type dropdown
- Start Time (`time` input)
- Date range (From Date / To Date)
- Day of Week chips (Sun-Sat, multi-select)
- Recurrence pattern (Every Week / Every Other / Every 3 / Every 4)
- Duration, Max Students, Notes
- Student assignment checklist

**Key logic:**
- Single mode sends UTC datetime via `.toISOString()`
- Recurring mode sends timezone offset via `new Date().getTimezoneOffset()` for server-side UTC conversion
- Student assignment creates Attendance records with status "Assigned"

---

## SessionDetailDialog.jsx

**Type:** Dialog for viewing and editing a session.

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| open | bool | Dialog visibility |
| onClose | function | Called when dismissed |
| session | object | Session data to display |
| onUpdated | function | Called after any changes (edit, delete, status change) |

**Features:**
- Read-only view: class type (with color dot), date/time, duration, instructor, status
- Status management: buttons to Complete, Cancel, or Reopen (back to Scheduled)
- Edit mode: modify date/time, duration, max students, notes
- Delete with confirmation
- Embedded `AttendanceMarker` component for marking attendance
- Admin/Instructor only for edit/delete actions
- Instructors can only edit their own sessions

**Status transitions:**
```
Scheduled → Completed (locks session, enables billing)
Scheduled → Cancelled (marks as cancelled, shown with strikethrough)
Completed → Scheduled (reopen for corrections)
Cancelled → Scheduled (reopen)
```

---

## StudentDialog.jsx

**Type:** Dialog for creating/editing student profiles.

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| open | bool | Dialog visibility |
| onClose | function | Called when dismissed |
| onSaved | function | Called after save (triggers parent refresh) |
| student | object? | If provided, dialog is in edit mode |

**Form fields:**
- First Name, Last Name (required)
- Email, Phone (optional)
- Date of Birth (`date` input, optional)
- Age Group dropdown (Toddlers, Preschool, Kids, Preteens, Teens, Adults, Seniors)
- Is Active toggle (edit mode only)

**Behavior:**
- Create mode: POST to `/api/students`
- Edit mode: PUT to `/api/students/{id}` (only sends changed fields)

---

## EnrollPackageDialog.jsx

**Type:** Dialog for enrolling students in packages.

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| open | bool | Dialog visibility |
| onClose | function | Called when dismissed |
| onEnrolled | function | Called after enrollment (triggers parent refresh) |
| preSelectedStudentId | int? | If set, single-student mode |
| billingYear | int? | Pre-filled year |
| billingMonth | int? | Pre-filled month (1-12) |

**Two modes:**
- **Single student** (when `preSelectedStudentId` is set): shows student name, just pick package and month
- **Bulk** (no pre-selection): checkbox list of students with search, select all/deselect all

**Package dropdown:** Grouped by class type. Shows package name, session count, and price.

**Info alert:** After selecting package, shows: "{sessionCount} sessions for ${price} ({classType})"

---

## RecordPaymentDialog.jsx

**Type:** Dialog for recording payments.

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| open | bool | Dialog visibility |
| onClose | function | Called when dismissed |
| onRecorded | function | Called after recording (triggers parent refresh) |
| preSelectedStudentId | int? | Pre-selected student |
| preSelectedBalance | number? | Pre-fill amount with outstanding balance |

**Form fields:**
- Student dropdown (or pre-selected display)
- Amount (pre-filled with balance if provided)
- Discount (optional — reduces balance independently from payment amount)
- Payment Date (defaults to today)
- Notes (optional — "Cash", "Online", reference numbers)

**Total display:** Shows "Total Applied: ${amount + discount}" so admin can see full impact.

---

## AttendanceMarker.jsx

**Type:** Widget embedded in SessionDetailDialog.

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| sessionId | int | Session to mark attendance for |
| canEdit | bool | Whether user can modify attendance |
| onAttendanceChanged | function? | Callback when changes are saved |

**Features:**
- Loads all active students and existing attendance for the session
- Merged view: shows all students, those assigned have their current status
- Status toggle buttons: Assigned, Present, Absent, Late, Excused
- Optional notes per student
- Bulk actions: Assign All, Assign Selected, Mark All Present, Remove Selected
- Checkbox selection for bulk operations
- Search filter for student names
- Unsaved changes tracking with visual indicator
- Status summary badges (Present: 5, Absent: 2, etc.)

**Data flow:**
1. Fetches `/attendance/session/{id}` (existing records)
2. Fetches `/students?activeOnly=true` (all students)
3. Merges into unified rows with status
4. On save: POST `/attendance/session/{id}` with bulk attendance data
5. Triggers `onAttendanceChanged` callback

---

## StudentAttendanceHistory.jsx

**Type:** Widget embedded in MyStudents page (per approved student card).

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| studentId | int | Student to show history for |
| studentName | string | Display name |

**Features:**
- Summary chips: Sessions count, Present, Absent, Late, Excused counts, Attendance Rate
- Expand/collapse toggle
- **Month/Year filter pills:**
  - Current year: shows month pills (e.g., "Feb 26", "Jan 26") — only months with sessions
  - Previous years: shows year pills (e.g., "2025") — click to expand that year's months
  - Default: current month if it has sessions, otherwise most recent period
  - Months/years with no sessions are hidden
- Filtered attendance table: Date (with time), Class Type (color dot), Status chip, Notes
- Sorted newest first within selected month

**Data flow:**
1. Fetches `/attendance/student/{id}/summary` (all attendance data)
2. Builds available periods map client-side: `{ year: Set<month> }`
3. Filters displayed records based on selected year/month
4. All filtering is client-side (no additional API calls)
