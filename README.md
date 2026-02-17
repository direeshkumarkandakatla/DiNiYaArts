# DiNiYa Arts Studio

A web application for managing art, painting, and yoga sessions — built for a small studio to handle session scheduling, student management, attendance tracking, and more.

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

### Implemented
- [x] Public landing page with studio introduction
- [x] Email/password authentication with JWT
- [x] Role-based access control (Administrator, Instructor, Student, Parent)
- [x] Session scheduling with calendar view (month/week/day)
- [x] Single and bulk/recurring session creation
- [x] Session CRUD with edit and delete
- [x] Class type management (Painting, with extensible model)
- [x] Student management with search and age group tracking
- [x] Student link request system (claim existing / create new, with admin approval)
- [x] Collapsible sidebar with role-aware navigation
- [x] Responsive layout (mobile + desktop)
- [x] UTC date handling with local timezone display
- [x] Structured logging with Serilog

### Phase 2 (Planned)
- [ ] Attendance tracking and reporting
- [ ] Photo/video uploads for sessions and students
- [ ] Google, Facebook, Apple authentication
- [ ] Additional class types (Yoga, etc.)
- [ ] CMS for landing page content management
- [ ] Payment tracking
- [ ] Analytics dashboard

## Project Structure

```
DiNiYaArts/
├── backend/
│   └── DiNiYaArts.Api/
│       ├── Controllers/       # API controllers (Auth, Sessions, Students, ClassTypes, LinkRequests)
│       ├── Data/              # DbContext with Fluent API configuration and seed data
│       ├── DTOs/              # Request/response data transfer objects
│       ├── Middleware/        # Request logging and exception handling
│       ├── Migrations/        # EF Core database migrations
│       ├── Models/            # Entity models (User, Session, Student, Attendance, etc.)
│       ├── Program.cs         # App configuration and middleware pipeline
│       └── appsettings.json   # Configuration (JWT, Serilog, connection string)
├── frontend/
│   └── src/
│       ├── components/        # Reusable UI components (Layout, Dialogs, Route guards)
│       ├── context/           # React Context (AuthContext)
│       ├── pages/             # Page components (Landing, Dashboard, Calendar, Students, etc.)
│       ├── services/          # API client with axios interceptors
│       └── App.jsx            # Routes and MUI theme configuration
├── DiNiYaArts.slnx            # Visual Studio solution file
└── README.md
```

## Roles & Access

| Role | Access |
|------|--------|
| **Administrator** | Full access — manage sessions, students, class types, approve link requests |
| **Instructor** | Manage sessions, students, approve link requests |
| **Student** | View sessions, calendar. Claim/create student profile |
| **Parent** | View sessions, calendar. Claim/manage children's profiles |

A user can have multiple roles. Role checks happen on both frontend (route guards) and backend (endpoint authorization).

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | Public | Register new user |
| POST | `/api/auth/login` | Public | Login and get JWT |
| GET | `/api/auth/me` | All | Get current user info |
| GET | `/api/sessions` | All | List sessions (with date/type filters) |
| POST | `/api/sessions` | Admin/Instructor | Create single session |
| POST | `/api/sessions/bulk` | Admin/Instructor | Create recurring sessions |
| PUT | `/api/sessions/:id` | Admin/Instructor | Update session |
| DELETE | `/api/sessions/:id` | Admin/Instructor | Delete session |
| GET | `/api/classtypes` | All | List class types |
| GET | `/api/students` | All | List students (with search) |
| POST | `/api/students` | Admin/Instructor | Create student |
| PUT | `/api/students/:id` | Admin/Instructor | Update student |
| DELETE | `/api/students/:id` | Admin/Instructor | Delete student |
| GET | `/api/studentlinkrequests/my` | All | My link requests |
| POST | `/api/studentlinkrequests/claim` | All | Claim existing student |
| POST | `/api/studentlinkrequests/create-student` | All | Request new student profile |
| GET | `/api/studentlinkrequests/pending` | Admin/Instructor | Pending requests |
| PUT | `/api/studentlinkrequests/:id/approve` | Admin/Instructor | Approve request |
| PUT | `/api/studentlinkrequests/:id/reject` | Admin/Instructor | Reject request |

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
- **Status:** In active development
- **Built with:** [Claude Code](https://claude.ai/claude-code) (CLI pair programming)
