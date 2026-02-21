import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import { usersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ALL_ROLES = ['Administrator', 'Instructor', 'Student', 'Parent'];

const ROLE_COLORS = {
  Administrator: 'error',
  Instructor: 'primary',
  Student: 'success',
  Parent: 'secondary',
};

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [roleDialog, setRoleDialog] = useState({ open: false, user: null });
  const [selectedRole, setSelectedRole] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const { user: currentUser } = useAuth();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await usersAPI.getAll(search || undefined);
      setUsers(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleAddRole = async () => {
    if (!selectedRole || !roleDialog.user) return;

    setActionLoading(true);
    setError('');
    try {
      await usersAPI.assignRole(roleDialog.user.id, { role: selectedRole });
      setSuccess(`${selectedRole} role assigned to ${roleDialog.user.firstName} ${roleDialog.user.lastName}`);
      setRoleDialog({ open: false, user: null });
      setSelectedRole('');
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign role');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveRole = async (userId, role, userName) => {
    if (!window.confirm(`Remove ${role} role from ${userName}?`)) return;

    setActionLoading(true);
    setError('');
    setSuccess('');
    try {
      await usersAPI.removeRole(userId, role);
      setSuccess(`${role} role removed from ${userName}`);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove role');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        User Management
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSearch} sx={{ mb: 2 }}>
        <TextField
          size="small"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            },
          }}
          sx={{ width: 320 }}
        />
        <Button type="submit" variant="outlined" sx={{ ml: 1 }}>
          Search
        </Button>
        {search && (
          <Button
            sx={{ ml: 1 }}
            onClick={() => {
              setSearch('');
              setTimeout(fetchUsers, 0);
            }}
          >
            Clear
          </Button>
        )}
      </Box>

      {users.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            No users found
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Roles</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Joined</TableCell>
                <TableCell>Last Login</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((u) => {
                const availableRoles = ALL_ROLES.filter((r) => !u.roles.includes(r));
                const isSelf = u.id === currentUser?.userId;

                return (
                  <TableRow key={u.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {u.firstName} {u.lastName}
                        {isSelf && (
                          <Chip label="You" size="small" sx={{ ml: 1 }} variant="outlined" />
                        )}
                      </Typography>
                    </TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {u.roles.length > 0 ? (
                          u.roles.map((role) => (
                            <Chip
                              key={role}
                              label={role}
                              size="small"
                              color={ROLE_COLORS[role] || 'default'}
                              onDelete={
                                // Can't remove own Admin role
                                isSelf && role === 'Administrator'
                                  ? undefined
                                  : () => handleRemoveRole(u.id, role, `${u.firstName} ${u.lastName}`)
                              }
                              deleteIcon={
                                <Tooltip title={`Remove ${role}`}>
                                  <RemoveCircleIcon />
                                </Tooltip>
                              }
                            />
                          ))
                        ) : (
                          <Typography variant="body2" color="text.secondary" fontStyle="italic">
                            No roles
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={u.isActive ? 'Active' : 'Inactive'}
                        size="small"
                        color={u.isActive ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell>{formatDate(u.createdAt)}</TableCell>
                    <TableCell>{formatDate(u.lastLoginAt)}</TableCell>
                    <TableCell align="right">
                      {availableRoles.length > 0 && (
                        <Tooltip title="Add role">
                          <IconButton
                            color="primary"
                            size="small"
                            onClick={() => {
                              setRoleDialog({ open: true, user: u });
                              setSelectedRole('');
                            }}
                          >
                            <AddCircleIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Add Role Dialog */}
      <Dialog
        open={roleDialog.open}
        onClose={() => setRoleDialog({ open: false, user: null })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          Add Role to {roleDialog.user?.firstName} {roleDialog.user?.lastName}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Current roles: {roleDialog.user?.roles?.join(', ') || 'None'}
          </Typography>
          <FormControl fullWidth margin="normal">
            <InputLabel>Role</InputLabel>
            <Select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              label="Role"
            >
              {roleDialog.user &&
                ALL_ROLES.filter((r) => !roleDialog.user.roles.includes(r)).map((role) => (
                  <MenuItem key={role} value={role}>
                    <Chip label={role} size="small" color={ROLE_COLORS[role]} sx={{ mr: 1 }} />
                    {role}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setRoleDialog({ open: false, user: null })}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAddRole}
            disabled={!selectedRole || actionLoading}
          >
            {actionLoading ? <CircularProgress size={24} /> : 'Assign Role'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
