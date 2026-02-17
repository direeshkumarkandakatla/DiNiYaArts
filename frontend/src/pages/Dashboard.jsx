import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActionArea,
} from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ListAltIcon from '@mui/icons-material/ListAlt';
import PeopleIcon from '@mui/icons-material/People';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const quickActions = [
    {
      title: 'Session Calendar',
      description: 'View and manage sessions on the calendar',
      icon: <CalendarMonthIcon sx={{ fontSize: 48 }} />,
      path: '/sessions/calendar',
      color: '#4DB6AC', // Soft teal
    },
    {
      title: 'Sessions List',
      description: 'View all sessions in a table format',
      icon: <ListAltIcon sx={{ fontSize: 48 }} />,
      path: '/sessions',
      color: '#81D4FA', // Sky blue
    },
    {
      title: 'Students',
      description: 'Manage students and attendance',
      icon: <PeopleIcon sx={{ fontSize: 48 }} />,
      path: '/students',
      color: '#B39DDB', // Soft lavender
    },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Welcome, {user?.firstName} {user?.lastName}!
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        {user?.roles?.join(', ')} | {user?.email}
      </Typography>

      <Typography variant="h6" gutterBottom>
        Quick Actions
      </Typography>

      <Grid container spacing={3}>
        {quickActions.map((action) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={action.title}>
            <Card
              elevation={2}
              sx={{
                opacity: action.disabled ? 0.5 : 1,
                '&:hover': action.disabled ? {} : { elevation: 4 },
              }}
            >
              <CardActionArea
                onClick={() => !action.disabled && navigate(action.path)}
                disabled={action.disabled}
                sx={{ p: 2 }}
              >
                <CardContent sx={{ textAlign: 'center' }}>
                  <Box sx={{ color: action.color, mb: 1 }}>
                    {action.icon}
                  </Box>
                  <Typography variant="h6" gutterBottom>
                    {action.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {action.description}
                    {action.disabled && ' (Coming Soon)'}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
