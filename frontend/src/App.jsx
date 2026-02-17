import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import RoleRoute from './components/RoleRoute';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import SessionCalendar from './pages/SessionCalendar';
import SessionList from './pages/SessionList';
import StudentList from './pages/StudentList';
import MyStudents from './pages/MyStudents';
import LinkRequests from './pages/LinkRequests';

// Create MUI theme - Calm, kid-friendly, yoga-inspired palette
const theme = createTheme({
  palette: {
    primary: {
      light: '#80CBC4',
      main: '#4DB6AC',  // Soft teal - calm, yoga-friendly
      dark: '#00897B',
    },
    secondary: {
      light: '#CE93D8',
      main: '#B39DDB',  // Soft lavender - creative, kid-friendly
      dark: '#9575CD',
    },
    background: {
      default: '#F5F9FC', // Very light blue-grey
      paper: '#FFFFFF',
    },
  },
  typography: {
    fontFamily: '"Nunito", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  shape: {
    borderRadius: 12, // Softer rounded corners
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none', // No UPPERCASE on buttons
          borderRadius: 8,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected routes with layout */}
            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/sessions/calendar" element={<SessionCalendar />} />
              <Route path="/sessions" element={<SessionList />} />
              <Route path="/students" element={<RoleRoute roles={['Administrator', 'Instructor']}><StudentList /></RoleRoute>} />
              <Route path="/my-students" element={<MyStudents />} />
              <Route path="/link-requests" element={<RoleRoute roles={['Administrator', 'Instructor']}><LinkRequests /></RoleRoute>} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
