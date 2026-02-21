# Context — Global State Management

This folder contains the React Context providers used for global state across the application.

## AuthContext.jsx

The sole context provider — manages all authentication and authorization state.

### What It Provides

```jsx
const {
  user,           // { userId, email, firstName, lastName, roles: string[] } or null
  activeRole,     // Currently selected role string (e.g., "Administrator")
  loading,        // true while checking token on app mount
  error,          // Auth error message string or ''
  isAuthenticated, // Boolean derived from user !== null
  isAdminContext,  // Boolean: activeRole is Administrator or Instructor
  login,          // async (email, password) => { success, error }
  register,       // async (formData) => { success, error }
  logout,         // () => void — clears token and state
  switchRole,     // (role) => void — changes activeRole if user has it
} = useAuth();
```

### How It Works

**On App Mount:**
1. Checks `localStorage` for existing JWT token
2. If found, calls `GET /api/auth/me` to validate and get user info
3. Sets `user` state with response data
4. Auto-selects `activeRole` based on priority: Administrator > Instructor > Parent > Student
5. If token is invalid/expired, clears it and sets user to null

**Login Flow:**
1. Calls `POST /api/auth/login` with email and password
2. On success: stores token in `localStorage`, sets user state, auto-selects active role
3. Returns `{ success: true }`
4. On failure: returns `{ success: false, error: "message" }`

**Register Flow:**
1. Calls `POST /api/auth/register` with form data
2. On success: stores token, sets user state (same as login)
3. Returns `{ success: true }`

**Logout:**
1. Removes token from `localStorage`
2. Clears user and activeRole state
3. React Router redirects to "/" via ProtectedRoute

**Role Switching:**
1. User clicks a different role in the sidebar dropdown
2. `switchRole(role)` checks if user has this role
3. Updates `activeRole` state
4. Sidebar navigation items re-render based on new active role

### Role Priority

When a user has multiple roles, the highest-priority role is auto-selected on login:

```
Administrator (highest)
    ↓
Instructor
    ↓
Parent
    ↓
Student (lowest)
```

This means an Admin who also has the Student role will see the Admin view by default, but can switch to Student view manually.

### Token Storage

- Stored in `localStorage` under key `token`
- Added to every API request via Axios request interceptor in `api.js`
- No refresh token mechanism currently — user must re-login when token expires

### Usage Example

```jsx
import { useAuth } from '../context/AuthContext';

function MyComponent() {
  const { user, activeRole, logout } = useAuth();

  return (
    <div>
      <p>Hello, {user?.firstName}</p>
      <p>Current role: {activeRole}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```
