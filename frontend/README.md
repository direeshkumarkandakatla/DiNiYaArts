# Frontend — React SPA

React 19 single-page application built with Vite, Material-UI, and React Big Calendar. Communicates with the backend API via Axios.

## Architecture Overview

```
src/
├── App.jsx              # Routes, MUI theme, role-based route guards
├── main.jsx             # React entry point, wraps app in AuthProvider
├── context/
│   └── AuthContext.jsx   # Global auth state (user, token, role switching)
├── services/
│   └── api.js            # Axios instance, API endpoint definitions
├── components/           # 8 reusable UI components (dialogs, route guards, etc.)
├── pages/                # 13 page components (one per route)
├── index.css             # Global styles
└── App.css               # App-specific styles
```

## How the App Loads

```
main.jsx
  └── AuthProvider (wraps entire app)
        │  On mount: checks localStorage for JWT token
        │  If token found: calls GET /api/auth/me to validate
        │  Sets user state: { userId, email, firstName, lastName, roles }
        │  Sets activeRole based on priority: Admin > Instructor > Parent > Student
        │
        └── App.jsx (BrowserRouter + MUI ThemeProvider)
              │
              ├── "/" → Landing (public)
              ├── "/login" → Login (public)
              ├── "/register" → Register (public)
              │
              └── ProtectedRoute (requires authentication)
                    └── Layout (sidebar + topbar)
                          │
                          ├── "/dashboard" → Dashboard
                          ├── "/calendar" → SessionCalendar
                          ├── "/sessions" → SessionList
                          │
                          ├── RoleRoute(Admin/Instructor)
                          │     ├── "/students" → StudentList
                          │     ├── "/billing" → BillingDashboard
                          │     ├── "/link-requests" → LinkRequests
                          │     └── "/packages" → PackageManagement
                          │
                          ├── RoleRoute(Admin)
                          │     ├── "/users" → UserManagement
                          │     └── "/class-types" → ClassTypeManagement
                          │
                          └── RoleRoute(Student/Parent)
                                ├── "/my-students" → MyStudents
                                └── "/my-dues" → MyDues
```

## Key Patterns

### Authentication Flow
1. User logs in via Login page → `authAPI.login(email, password)`
2. JWT token stored in `localStorage`
3. `AuthContext` holds user info, provides `login()`, `logout()`, `switchRole()`
4. `ProtectedRoute` redirects unauthenticated users to "/"
5. `RoleRoute` redirects unauthorized users to "/dashboard"
6. Axios request interceptor auto-adds `Authorization: Bearer <token>` to every API call

### Role-Based UI
- Sidebar navigation items differ by role (configured in `Layout.jsx`)
- Dashboard cards differ by role
- Admin/Instructor see management tools; Student/Parent see personal views
- Users with multiple roles can switch via sidebar dropdown

### Dialog Pattern
Most CRUD operations use a shared pattern:
1. Parent page manages dialog open/close state
2. Dialog component receives `open`, `onClose`, `onSaved` props
3. Dialog fetches its own data (class types, students, etc.) on open
4. On save: calls API, then invokes `onSaved()` callback
5. Parent page re-fetches list data in the callback

### Error Handling
- API errors are caught and displayed as MUI `Alert` components
- Most pages have an `error` state that shows a dismissible alert
- Network errors or 401s are handled by the Axios interceptor

## MUI Theme

Custom theme configured in `App.jsx`:
- **Primary color**: `#6D4C41` (warm brown — art studio feel)
- **Secondary color**: `#F06292` (pink accent)
- **Font family**: Nunito (rounded, kid-friendly)
- **Default variant**: Outlined text fields

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `https://localhost:7000/api` | Backend API base URL |

Configured in `.env.development`:
```
VITE_API_URL=https://localhost:7199/api
```

## Running the Frontend

```bash
cd frontend
npm install
npm run dev      # Start dev server on http://localhost:5173
npm run build    # Production build to dist/
npm run preview  # Preview production build locally
```

## Folder Documentation

- [`src/pages/README.md`](src/pages/README.md) — All 13 page components
- [`src/components/README.md`](src/components/README.md) — All 8 reusable components
- [`src/services/README.md`](src/services/README.md) — API service layer
- [`src/context/README.md`](src/context/README.md) — Auth context
