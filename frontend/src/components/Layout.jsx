import { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Divider,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
  Chip,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ListAltIcon from '@mui/icons-material/ListAlt';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import PersonIcon from '@mui/icons-material/Person';
import LinkIcon from '@mui/icons-material/Link';
import SchoolIcon from '@mui/icons-material/School';
import CategoryIcon from '@mui/icons-material/Category';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import LogoutIcon from '@mui/icons-material/Logout';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { useAuth } from '../context/AuthContext';

const drawerWidthOpen = 240;
const drawerWidthClosed = 64;

const getNavItems = (activeRole) => {
  const isAdminOrInstructor = activeRole === 'Administrator' || activeRole === 'Instructor';

  const items = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Calendar', icon: <CalendarMonthIcon />, path: '/sessions/calendar' },
  ];

  if (isAdminOrInstructor) {
    items.push({ text: 'Sessions', icon: <ListAltIcon />, path: '/sessions' });
    items.push({ text: 'Students', icon: <PeopleIcon />, path: '/students' });
    items.push({ text: 'Link Requests', icon: <LinkIcon />, path: '/link-requests' });
    items.push({ text: 'Billing', icon: <ReceiptLongIcon />, path: '/billing' });
  }

  if (activeRole === 'Administrator') {
    items.push({ text: 'Class Types', icon: <CategoryIcon />, path: '/class-types' });
    items.push({ text: 'Users', icon: <AdminPanelSettingsIcon />, path: '/users' });
  }

  // Show "My Students" only in Student/Parent context
  if (!isAdminOrInstructor) {
    items.push({ text: 'My Students', icon: <SchoolIcon />, path: '/my-students' });
    items.push({ text: 'My Dues', icon: <ReceiptLongIcon />, path: '/my-dues' });
  }

  return items;
};

const ROLE_COLORS = {
  Administrator: 'error',
  Instructor: 'primary',
  Parent: 'secondary',
  Student: 'success',
};

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const [roleMenuAnchor, setRoleMenuAnchor] = useState(null);
  const { user, activeRole, switchRole, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = getNavItems(activeRole);
  const currentWidth = sidebarOpen ? drawerWidthOpen : drawerWidthClosed;
  const hasMultipleRoles = user?.roles?.length > 1;

  const handleMobileToggle = () => setMobileOpen(!mobileOpen);
  const handleSidebarToggle = () => setSidebarOpen(!sidebarOpen);
  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleLogout = () => {
    handleMenuClose();
    logout();
    navigate('/login');
  };

  const handleRoleSwitch = (role) => {
    switchRole(role);
    setRoleMenuAnchor(null);
    // Navigate to dashboard when switching roles to avoid being on a page the new role can't access
    navigate('/dashboard');
  };

  const drawerContent = (isMobile) => (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar sx={{ justifyContent: sidebarOpen || isMobile ? 'space-between' : 'center', px: sidebarOpen || isMobile ? 2 : 1 }}>
        {(sidebarOpen || isMobile) && (
          <Typography variant="h6" noWrap sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            DiNiYaArts
          </Typography>
        )}
        {!isMobile && (
          <IconButton onClick={handleSidebarToggle} size="small">
            {sidebarOpen ? <ChevronLeftIcon /> : <MenuIcon />}
          </IconButton>
        )}
      </Toolbar>
      <Divider />

      {/* Role switcher in sidebar */}
      {hasMultipleRoles && (sidebarOpen || isMobile) && (
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
            Active Role
          </Typography>
          <Chip
            label={activeRole}
            color={ROLE_COLORS[activeRole] || 'default'}
            size="small"
            icon={<SwapHorizIcon />}
            onClick={(e) => setRoleMenuAnchor(e.currentTarget)}
            sx={{ cursor: 'pointer' }}
          />
          <Menu
            anchorEl={roleMenuAnchor}
            open={Boolean(roleMenuAnchor)}
            onClose={() => setRoleMenuAnchor(null)}
          >
            {user.roles.map((role) => (
              <MenuItem
                key={role}
                selected={role === activeRole}
                onClick={() => handleRoleSwitch(role)}
              >
                <Chip
                  label={role}
                  color={ROLE_COLORS[role] || 'default'}
                  size="small"
                  variant={role === activeRole ? 'filled' : 'outlined'}
                  sx={{ mr: 1 }}
                />
                {role === activeRole && '(active)'}
              </MenuItem>
            ))}
          </Menu>
        </Box>
      )}
      {hasMultipleRoles && !sidebarOpen && !isMobile && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
          <Tooltip title={`Switch role (${activeRole})`} placement="right">
            <IconButton size="small" onClick={(e) => setRoleMenuAnchor(e.currentTarget)}>
              <SwapHorizIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )}

      {hasMultipleRoles && <Divider />}

      <List>
        {navItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ display: 'block' }}>
            <Tooltip title={!sidebarOpen && !isMobile ? item.text : ''} placement="right">
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => {
                  navigate(item.path);
                  if (isMobile) setMobileOpen(false);
                }}
                sx={{
                  minHeight: 48,
                  justifyContent: sidebarOpen || isMobile ? 'initial' : 'center',
                  px: 2.5,
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: sidebarOpen || isMobile ? 2 : 'auto',
                    justifyContent: 'center',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                {(sidebarOpen || isMobile) && <ListItemText primary={item.text} />}
              </ListItemButton>
            </Tooltip>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${currentWidth}px)` },
          ml: { sm: `${currentWidth}px` },
          transition: 'width 0.2s ease, margin-left 0.2s ease',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleMobileToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            DiNiYaArts Studio
          </Typography>

          {activeRole && (
            <Chip
              label={activeRole}
              color={ROLE_COLORS[activeRole] || 'default'}
              size="small"
              variant="outlined"
              sx={{ mr: 2, color: 'white', borderColor: 'rgba(255,255,255,0.5)' }}
            />
          )}

          <IconButton onClick={handleMenuOpen} color="inherit">
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem disabled>
              <PersonIcon sx={{ mr: 1 }} />
              {user?.firstName} {user?.lastName}
            </MenuItem>
            <MenuItem disabled>
              <Typography variant="caption" color="text.secondary">
                {user?.roles?.join(', ')}
              </Typography>
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <LogoutIcon sx={{ mr: 1 }} />
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Sidebar - Mobile (always full width with text) */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleMobileToggle}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidthOpen },
        }}
      >
        {drawerContent(true)}
      </Drawer>

      {/* Sidebar - Desktop (collapsible) */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          width: currentWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: currentWidth,
            transition: 'width 0.2s ease',
            overflowX: 'hidden',
          },
        }}
        open
      >
        {drawerContent(false)}
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { xs: '100%', sm: `calc(100% - ${currentWidth}px)` },
          ml: { sm: 0 },
          mt: 8,
          transition: 'width 0.2s ease',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
