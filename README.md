# DiNiYaArts - Session Management System

A web application to manage art, painting, and yoga sessions with client scheduling and attendance tracking.

## Project Structure

```
DiNiYaArts/
├── frontend/          # React + Vite frontend
├── backend/           # ASP.NET Core Web API
└── README.md
```

## Tech Stack

### Frontend
- React 18 with Vite
- React Router for navigation
- Tailwind CSS for styling
- React Big Calendar for session scheduling
- Axios for API communication

### Backend
- ASP.NET Core 8 Web API
- Entity Framework Core with SQLite
- ASP.NET Core Identity (Email/Password auth)
- JWT token authentication

### Database
- SQLite (development)
- Migrations ready for SQL Server/PostgreSQL

## Features

### Phase 1 (Current)
- [x] Email/Password authentication
- [ ] Session scheduling and calendar view
- [ ] Attendance tracking
- [ ] Class type management (Painting)
- [ ] Student management

### Phase 2 (Future)
- [ ] Google authentication
- [ ] Facebook authentication
- [ ] Apple authentication
- [ ] Additional class types (Yoga, etc.)
- [ ] Payment tracking
- [ ] Reporting and analytics

## Getting Started

### Backend
```bash
cd backend
dotnet restore
dotnet ef database update
dotnet run
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Development Timeline
- Start Date: 2026-02-16
- Status: In Development
