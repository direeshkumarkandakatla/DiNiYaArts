# DiNiYa Arts Studio

A web application for managing art, painting, and yoga sessions — built for a small studio to handle session scheduling, student management, attendance tracking, billing, and more.

## Built With CLI Pair Programming

This project was built entirely through **pair programming with [Claude Code](https://claude.ai/claude-code)** (Anthropic's CLI tool). Every model, controller, page, and feature was designed collaboratively — discussing architecture decisions, reviewing models one by one, iterating on UI/UX, and fixing bugs in real-time.

**Development approach:**
- Models were reviewed and approved individually before creation
- Frontend and backend built iteratively with testing after each feature
- Design decisions (color theme, layout, role system) driven by conversation
- Bug fixes handled through real-time feedback loops

**Timeline:**
- **Day 1 (Feb 16)** — Project setup, data models, backend API (auth, sessions, class types), frontend foundation (React + MUI), session calendar with CRUD, bug fixes (timezone, calendar views, sidebar layout), color theme redesign, Serilog logging, bulk/recurring session creation
- **Day 2 (Feb 17)** — Student management, age group tracking, student link request system with admin approval, collapsible sidebar, role-based route protection, public landing page, GitHub setup
- **Day 3 (Feb 20)** — Attendance tracking with bulk marking, billing module (attendance-driven billing, package enrollment, payment recording), class type management with default pricing, user management page, session status lifecycle (Scheduled/Completed/Cancelled), billing dashboard with expandable session-level breakdown, parent "My Dues" view, month/year filters for attendance history

## Tech Stack

### Frontend
- React 19 with Vite
- Material-UI (MUI) for components
- React Router for navigation
- React Big Calendar with date-fns for session scheduling
- Axios for API communication
- Nunito font for kid-friendly typography

### Backend
- ASP.NET Core 8 Web API
- Entity Framework Core with SQLite
- ASP.NET Core Identity for authentication
- JWT token-based authorization
- Serilog for structured logging (Console + File sinks)
- Custom middleware for request logging and exception handling

## Features

### Core
- [x] Public landing page with studio introduction
- [x] Email/password authentication with JWT
- [x] Role-based access control (Administrator, Instructor, Student, Parent)
- [x] Multi-role support with role switching

### Session Management
- [x] Session scheduling with calendar view (month/week/day)
- [x] Single and bulk/recurring session creation
- [x] Session CRUD with edit and delete
- [x] Session status lifecycle (Scheduled, Completed, Cancelled)
- [x] Bulk-complete past sessions
- [x] UTC date handling with local timezone display

### Student Management
- [x] Student CRUD with search and age group tracking
- [x] Student link request system (claim existing / create new, with admin approval)
- [x] Student-user linking (Self or Parent relationship)
- [x] Admin direct linking of students to users

### Attendance
- [x] Per-session attendance marking (Assigned, Present, Absent, Late, Excused)
- [x] Bulk attendance operations (assign all, mark all present)
- [x] Student attendance history with month/year filter pills
- [x] Attendance rate statistics

### Billing
- [x] Class type management with default session pricing
- [x] Package definitions (e.g., "4-Session Pack" at discounted rate)
- [x] Student package enrollment (single and bulk)
- [x] Attendance-driven billing (every attended session generates a charge)
- [x] Package rate for enrolled sessions, default rate for extras/unenrolled
- [x] Payment and discount recording
- [x] Admin billing dashboard with per-student expandable breakdown
- [x] Parent/Student "My Dues" view with session-level charges

### Admin Tools
- [x] User management (list users, assign/remove roles)
- [x] Class type management with color coding and default pricing
- [x] Package definition management
- [x] Link request approval/rejection with notes
- [x] Clear resolved link requests

### UI/UX
- [x] Collapsible sidebar with role-aware navigation
- [x] Responsive layout (mobile + desktop)
- [x] Structured logging with Serilog
- [x] Color-coded calendar events by class type

### Planned
- [ ] Google, Facebook, Apple authentication
- [ ] Photo/video uploads for sessions and students
- [ ] CMS for landing page content management
- [ ] Analytics dashboard
- [ ] Azure deployment

## Project Structure

```
DiNiYaArts/
├── backend/
│   └── DiNiYaArts.Api/
│       ├── Controllers/       # 9 API controllers (see backend/README.md)
│       ├── Data/              # DbContext with Fluent API and seed data
│       ├── DTOs/              # Request/response data transfer objects
│       ├── Middleware/        # Request logging and exception handling
│       ├── Migrations/        # EF Core database migrations
│       ├── Models/            # 9 entity models + enums
│       ├── Program.cs         # App configuration and middleware pipeline
│       └── appsettings.json   # Configuration (JWT, Serilog, connection string)
├── frontend/
│   └── src/
│       ├── components/        # 8 reusable UI components
│       ├── context/           # AuthContext for global auth state
│       ├── pages/             # 13 page components
│       ├── services/          # API client with axios interceptors
│       └── App.jsx            # Routes and MUI theme configuration
├── DiNiYaArts.slnx            # Visual Studio solution file
└── README.md
```

Each folder contains its own `README.md` with detailed documentation. See:
- [`backend/README.md`](backend/README.md) — Backend architecture, API overview, data flow
- [`backend/DiNiYaArts.Api/Controllers/README.md`](backend/DiNiYaArts.Api/Controllers/README.md) — All API endpoints
- [`backend/DiNiYaArts.Api/Models/README.md`](backend/DiNiYaArts.Api/Models/README.md) — Data models and relationships
- [`backend/DiNiYaArts.Api/DTOs/README.md`](backend/DiNiYaArts.Api/DTOs/README.md) — DTO reference
- [`backend/DiNiYaArts.Api/Data/README.md`](backend/DiNiYaArts.Api/Data/README.md) — Database context and migrations
- [`backend/DiNiYaArts.Api/Middleware/README.md`](backend/DiNiYaArts.Api/Middleware/README.md) — Custom middleware
- [`frontend/README.md`](frontend/README.md) — Frontend architecture, component hierarchy
- [`frontend/src/pages/README.md`](frontend/src/pages/README.md) — All page components
- [`frontend/src/components/README.md`](frontend/src/components/README.md) — Reusable components
- [`frontend/src/services/README.md`](frontend/src/services/README.md) — API service layer
- [`frontend/src/context/README.md`](frontend/src/context/README.md) — Auth context

## Roles & Access

| Role | Access |
|------|--------|
| **Administrator** | Full access — manage sessions, students, class types, packages, billing, users, approve link requests |
| **Instructor** | Manage sessions, students, attendance, billing. Approve link requests. Can only edit/delete own sessions |
| **Student** | View sessions/calendar. Claim/create student profile. View own attendance and billing ("My Dues") |
| **Parent** | View sessions/calendar. Claim/manage children's profiles. View children's attendance and billing ("My Dues") |

A user can have multiple roles. Role checks happen on both frontend (route guards) and backend (endpoint authorization). Users can switch between their active role via the sidebar.

## Getting Started

### Prerequisites
- .NET 8 SDK
- Node.js 18+

### Backend
```bash
cd backend/DiNiYaArts.Api
dotnet restore
dotnet ef database update
dotnet run
```
The API runs on `https://localhost:7199` by default.

A default admin account is created on first run:
- Email: `admin@diniyaarts.com`
- Password: `Admin@123`
(Configurable in `appsettings.json` under `DefaultAdmin`)

### Frontend
```bash
cd frontend
npm install
npm run dev
```
The app runs on `http://localhost:5173` by default.

### Environment
Frontend API URL is configured in `frontend/.env.development`:
```
VITE_API_URL=https://localhost:7199/api
```

## Development Timeline
- **Start Date:** February 16, 2026
- **Status:** In active development (preparing for Azure deployment)
- **Built with:** [Claude Code](https://claude.ai/claude-code) (CLI pair programming)
