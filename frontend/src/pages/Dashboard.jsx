import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActionArea,
} from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ListAltIcon from '@mui/icons-material/ListAlt';
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import CategoryIcon from '@mui/icons-material/Category';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user, activeRole } = useAuth();
  const navigate = useNavigate();

  const isAdminOrInstructor = activeRole === 'Administrator' || activeRole === 'Instructor';

  const adminInstructorActions = [
    {
      title: 'Session Calendar',
      description: 'View and manage sessions on the calendar',
      icon: <CalendarMonthIcon sx={{ fontSize: 48 }} />,
      path: '/sessions/calendar',
      color: '#4DB6AC',
    },
    {
      title: 'Sessions List',
      description: 'View all sessions in a table format',
      icon: <ListAltIcon sx={{ fontSize: 48 }} />,
      path: '/sessions',
      color: '#81D4FA',
    },
    {
      title: 'Students',
      description: 'Manage students and profiles',
      icon: <PeopleIcon sx={{ fontSize: 48 }} />,
      path: '/students',
      color: '#B39DDB',
    },
    {
      title: 'Billing',
      description: 'Track packages, payments, and dues',
      icon: <ReceiptLongIcon sx={{ fontSize: 48 }} />,
      path: '/billing',
      color: '#FFB74D',
    },
    ...(activeRole === 'Administrator' ? [{
      title: 'Class Types',
      description: 'Manage class types and pricing',
      icon: <CategoryIcon sx={{ fontSize: 48 }} />,
      path: '/class-types',
      color: '#E57373',
    }] : []),
  ];

  const studentParentActions = [
    {
      title: 'Session Calendar',
      description: 'View upcoming sessions and schedules',
      icon: <CalendarMonthIcon sx={{ fontSize: 48 }} />,
      path: '/sessions/calendar',
      color: '#4DB6AC',
    },
    {
      title: 'My Students',
      description: 'Manage your student profiles',
      icon: <SchoolIcon sx={{ fontSize: 48 }} />,
      path: '/my-students',
      color: '#B39DDB',
    },
    {
      title: 'My Dues',
      description: 'View your billing and payment history',
      icon: <ReceiptLongIcon sx={{ fontSize: 48 }} />,
      path: '/my-dues',
      color: '#FFB74D',
    },
  ];

  const quickActions = isAdminOrInstructor ? adminInstructorActions : studentParentActions;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Welcome, {user?.firstName} {user?.lastName}!
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        {user?.roles?.length > 0 ? user.roles.join(', ') : 'New Member'} | {user?.email}
      </Typography>

      <Typography variant="h6" gutterBottom>
        Quick Actions
      </Typography>

      <Grid container spacing={3}>
        {quickActions.map((action) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={action.title}>
            <Card elevation={2}>
              <CardActionArea
                onClick={() => navigate(action.path)}
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
