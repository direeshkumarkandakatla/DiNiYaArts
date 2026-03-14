import { useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams, Link as RouterLink } from 'react-router-dom';
import { Container, Box, Paper, Typography, CircularProgress, Alert, Button } from '@mui/material';
import { useAuth } from '../context/AuthContext';

const ERROR_MESSAGES = {
  external_login_failed: 'Social login failed. Please try again.',
  email_not_provided: 'Your social account did not provide an email address.',
  link_failed: 'Failed to link social account to your existing account.',
  account_creation_failed: 'Failed to create your account. Please try again.',
  account_deactivated: 'Your account has been deactivated. Please contact support.',
};

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loadUser } = useAuth();

  const token = searchParams.get('token');
  const errorCode = searchParams.get('error');
  const error = useMemo(() => {
    if (errorCode) return ERROR_MESSAGES[errorCode] || 'An unexpected error occurred.';
    if (!token) return 'No authentication data received.';
    return null;
  }, [errorCode, token]);

  useEffect(() => {
    if (!token) return;
    localStorage.setItem('token', token);
    loadUser().then(() => {
      navigate('/dashboard', { replace: true });
    });
  }, [token, navigate, loadUser]);

  if (error) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Paper elevation={3} sx={{ p: 4, width: '100%', textAlign: 'center' }}>
            <Typography variant="h5" gutterBottom>
              Authentication Error
            </Typography>
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
            <Button variant="contained" component={RouterLink} to="/login">
              Back to Login
            </Button>
          </Paper>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={48} />
          <Typography sx={{ mt: 2 }}>Signing you in...</Typography>
        </Box>
      </Box>
    </Container>
  );
}
