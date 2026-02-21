# Pages — Route Components

Each file in this folder corresponds to a route in the application. Pages are the top-level components rendered by React Router.

## Page Overview

| Page | Route | Access | Description |
|------|-------|--------|-------------|
| Landing | `/` | Public | Marketing landing page |
| Login | `/login` | Public | Login form |
| Register | `/register` | Public | Registration form |
| Dashboard | `/dashboard` | All authenticated | Quick action cards by role |
| SessionCalendar | `/calendar` | All authenticated | Calendar view of sessions |
| SessionList | `/sessions` | All authenticated | Table view of sessions |
| StudentList | `/students` | Admin/Instructor | Student management |
| BillingDashboard | `/billing` | Admin/Instructor | Billing overview and management |
| PackageManagement | `/packages` | Admin/Instructor | Package definition CRUD |
| LinkRequests | `/link-requests` | Admin/Instructor | Student link request approval |
| ClassTypeManagement | `/class-types` | Admin only | Class type CRUD |
| UserManagement | `/users` | Admin only | User role management |
| MyStudents | `/my-students` | Student/Parent | View linked students and attendance |
| MyDues | `/my-dues` | Student/Parent | View billing and payment history |

---

## Landing.jsx

**Route:** `/` (public, unauthenticated)

The public-facing marketing page for the studio. Static content with smooth-scroll navigation.

**Sections:**
1. **Hero** — Gradient background with studio name, tagline, and CTA buttons (Explore / Get Started)
2. **About** — Three value cards: Our Passion, Our Motive, Our Community
3. **Art/Painting** — Class descriptions with feature highlights
4. **Contact** — Email, phone, location (Google Maps link), Instagram

**Navigation:** Fixed top bar with smooth-scroll links to sections. Login/Register buttons. If already authenticated, shows "Go to Dashboard" instead.

---

## Login.jsx

**Route:** `/login` (public)

Simple email/password login form.

**Flow:** Enter credentials → calls `login()` from AuthContext → on success, redirects to `/dashboard` → on failure, shows error alert.

**Links to:** Register page for new users.

---

## Register.jsx

**Route:** `/register` (public)

Registration form with fields: First Name, Last Name, Email, Password, Confirm Password, Register As (Student or Parent).

**Flow:** Fill form → calls `register()` from AuthContext → on success, redirects to `/dashboard` → on failure, shows validation errors.

**Validation:** Password match check, required fields, email format.

---

## Dashboard.jsx

**Route:** `/dashboard` (all authenticated users)

Role-aware dashboard showing quick action cards. Each card navigates to a feature page.

**Admin/Instructor cards:**
- Session Calendar, Sessions List, Students, Billing Dashboard, Class Types (admin only)

**Student/Parent cards:**
- Session Calendar, My Students, My Dues

Each card has a colored icon, title, and description. Uses `useNavigate()` for navigation.

---

## SessionCalendar.jsx

**Route:** `/calendar` (all authenticated users)

Interactive calendar powered by `react-big-calendar` with `date-fns` localizer.

**Views:** Month, Week (default), Day

**Features:**
- Events color-coded by class type
- Click empty slot to create session (Admin/Instructor only)
- Click event to view/edit session details
- Date range filtering: fetches sessions for current month +/- 1 month
- Student/Parent view: events colored by attendance status (green = attended, blue = assigned, gray = not assigned)

**Data flow:**
1. On mount and navigation: fetches sessions for visible date range
2. For Student/Parent: also fetches `attendance/my` to build attendance map
3. Events mapped to `{ id, title, start: Date, end: Date, resource: session }`
4. Click handlers open `CreateSessionDialog` or `SessionDetailDialog`

---

## SessionList.jsx

**Route:** `/sessions` (all authenticated users)

Table view of all sessions with filtering and status management.

**Columns:** Date/Time, Class Type (with color dot), Duration, Students (count/max), Status, Instructor, Actions

**Features:**
- Date range filter (From/To)
- Class type filter dropdown
- Status chips: Scheduled (blue), Completed (green), Cancelled (gray with strikethrough)
- "Bulk Complete Past Sessions" button (marks all past Scheduled as Completed)
- Click row to open session detail dialog
- Admin/Instructor: edit, delete, change status actions

---

## StudentList.jsx

**Route:** `/students` (Admin/Instructor only)

Student management table with search and CRUD.

**Columns:** Name, Email, Phone, Age, Age Group, Linked Account, Parent, Sessions (attendance count), Status, Actions

**Features:**
- Search by name or email
- Add Student button opens `StudentDialog`
- Enroll Package button (header + per-row icon) opens `EnrollPackageDialog`
- Edit and Delete actions per row
- Delete blocked if student has attendance records (backend enforces)
- Status chip: Active (green) / Inactive (gray)

---

## BillingDashboard.jsx

**Route:** `/billing` (Admin/Instructor only)

The main billing management page with monthly overview and per-student breakdown.

**Summary cards:**
- Total Outstanding (red if > 0)
- Collected This Month
- Students with Dues

**Month/Year filter:** Navigate between billing periods.

**Student table:**
- Columns: Student Name, Total Dues, Paid, Discounts, Balance, Actions
- Expandable rows: Click "+" to see session-level charge breakdown
  - Per-session: Date, Class Type (color dot), Status, Charge Source, Amount
  - Charge source shows "Package: name ($rate/session)" or "Default Rate"
- Actions: Record Payment, Enroll Package

**Navigation:** Links to Package Management page.

---

## PackageManagement.jsx

**Route:** `/packages` (Admin/Instructor, but only Admin can create/edit/delete)

CRUD table for package definitions (templates, not enrollments).

**Columns:** Class Type (with color dot), Package Name, Sessions, Price, Status, Actions

**Features:**
- Create/Edit dialog with: Class Type dropdown, Name, Session Count, Price
- Active/Inactive toggle via status chip click
- Delete with confirmation
- Back button returns to Billing Dashboard

---

## LinkRequests.jsx

**Route:** `/link-requests` (Admin/Instructor only)

Manages student link requests from Student/Parent users.

**Tabs:** All, Pending, Approved, Rejected

**Per request card:**
- Requester name and email
- Status chip (Pending=yellow, Approved=green, Rejected=red)
- Type chip (Claim or New Student)
- Request details (student name for claims, or full form data for new student requests)
- Timestamps: submitted, reviewed by, reviewed at
- Admin review notes

**Actions (Pending only):**
- Approve button (instantly approves and links)
- Reject button (opens dialog for optional notes)

**Clear Resolved:** Admin-only button to bulk delete all Approved/Rejected requests.

---

## ClassTypeManagement.jsx

**Route:** `/class-types` (Admin only)

CRUD table for class types (Painting, Yoga, Pottery, etc.).

**Columns:** Color (dot), Name, Description, Age Group, Default Session Price, Status, Actions

**Create/Edit dialog:**
- Name, Color (hex input with preview), Description, Target Age Group (dropdown), Default Session Price (currency input)
- Active toggle on edit

**Delete behavior:**
- Hard delete if no sessions reference the class type
- Soft delete (deactivate) if sessions exist

---

## UserManagement.jsx

**Route:** `/users` (Admin only)

User management with role assignment.

**Columns:** Name, Email, Roles (as chips), Status, Joined, Last Login, Actions

**Features:**
- Search by name or email
- Role chips with "x" button to remove (confirmation required)
- "+" button to assign a new role (opens dialog with role dropdown)
- Cannot remove own Admin role (safety check)
- Available roles: Administrator, Instructor, Student, Parent

---

## MyStudents.jsx

**Route:** `/my-students` (Student/Parent only)

Shows the current user's linked students and their attendance.

**Layout:** Card per link request, showing:
- Student name and link type (Self / Parent)
- Request status (Pending, Approved, Rejected)
- Timestamps and admin review notes
- For Approved requests: embedded `StudentAttendanceHistory` component with month/year filter pills

**Actions:**
- "Claim Existing" button: search for a student and submit a claim request
- "Create New" button: fill a form to request a new student profile

**Claim dialog:** Search students by name → select from results → choose relationship (Self/Parent) → submit claim

**Create dialog:** Full student form (name, email, phone, DOB, age group, relationship) → submit request for admin approval

---

## MyDues.jsx

**Route:** `/my-dues` (Student/Parent only)

Billing summary for the current user's children.

**Overview cards:**
- Total Outstanding balance (red if > 0)
- Total Paid

**Per-child cards:**
- Student name with balance chip
- Package progress bars (e.g., "3 of 4 sessions attended" with visual bar)
- Balance summary: Total Dues, Paid, Discounts, Outstanding
- Collapsible Session Charges table: Date, Class (color dot), Source (package or default), Charge amount
- Collapsible Payment History table: Date, Amount, Discount, Notes

**Empty state:** If no billing data, shows message about attending sessions or contacting admin.
