import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Typography,
  Autocomplete,
  Chip,
  Divider,
} from '@mui/material';
import LinkIcon from '@mui/icons-material/Link';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import { studentsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const AGE_GROUPS = [
  { value: '', label: 'Not specified' },
  { value: 'Toddlers', label: 'Toddlers (1-3 yrs)' },
  { value: 'Preschool', label: 'Preschool (4-5 yrs)' },
  { value: 'Kids', label: 'Kids (6-9 yrs)' },
  { value: 'Preteens', label: 'Preteens (10-12 yrs)' },
  { value: 'Teens', label: 'Teens (13-17 yrs)' },
  { value: 'Adults', label: 'Adults (18+)' },
  { value: 'Seniors', label: 'Seniors (65+)' },
];

export default function StudentDialog({ open, onClose, onSaved, student }) {
  const isEdit = Boolean(student);
  const { user } = useAuth();
  const isAdmin = user?.roles?.includes('Administrator');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    ageGroup: '',
    isActive: true,
  });

  // User linking state (Admin only)
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedParent, setSelectedParent] = useState(null);
  const [parentSearchQuery, setParentSearchQuery] = useState('');
  const [parentSearchResults, setParentSearchResults] = useState([]);
  const [parentSearchLoading, setParentSearchLoading] = useState(false);

  useEffect(() => {
    if (open) {
      if (student) {
        setFormData({
          firstName: student.firstName || '',
          lastName: student.lastName || '',
          email: student.email || '',
          phone: student.phone || '',
          dateOfBirth: student.dateOfBirth
            ? new Date(student.dateOfBirth).toISOString().split('T')[0]
            : '',
          ageGroup: student.ageGroup || '',
          isActive: student.isActive ?? true,
        });
        setSelectedUser(
          student.userId
            ? { id: student.userId, label: student.linkedUserName?.trim() || 'Linked User' }
            : null
        );
        setSelectedParent(
          student.parentUserId
            ? { id: student.parentUserId, label: student.parentName?.trim() || 'Linked Parent' }
            : null
        );
      } else {
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          dateOfBirth: '',
          ageGroup: '',
          isActive: true,
        });
        setSelectedUser(null);
        setSelectedParent(null);
      }
      setError('');
      setUserSearchQuery('');
      setUserSearchResults([]);
      setParentSearchQuery('');
      setParentSearchResults([]);
    }
  }, [open, student]);

  // Search users for linking
  const searchUsers = async (query, setResults, setSearchLoading) => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }
    setSearchLoading(true);
    try {
      const response = await studentsAPI.searchUsers(query);
      setResults(
        response.data.map((u) => ({
          id: u.id,
          label: `${u.firstName || ''} ${u.lastName || ''} (${u.email})`.trim(),
          firstName: u.firstName,
          lastName: u.lastName,
          email: u.email,
        }))
      );
    } catch (err) {
      console.error('User search failed:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => searchUsers(userSearchQuery, setUserSearchResults, setUserSearchLoading), 300);
    return () => clearTimeout(timer);
  }, [userSearchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => searchUsers(parentSearchQuery, setParentSearchResults, setParentSearchLoading), 300);
    return () => clearTimeout(timer);
  }, [parentSearchQuery]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const payload = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email || null,
      phone: formData.phone || null,
      dateOfBirth: formData.dateOfBirth || null,
      ageGroup: formData.ageGroup || null,
    };

    try {
      if (isEdit) {
        await studentsAPI.update(student.id, {
          ...payload,
          isActive: formData.isActive,
        });

        // Admin: handle user linking changes
        if (isAdmin) {
          const userChanged = (selectedUser?.id || null) !== (student.userId || null);
          const parentChanged = (selectedParent?.id || null) !== (student.parentUserId || null);

          if (userChanged) {
            await studentsAPI.linkToUser(student.id, {
              userId: selectedUser?.id || null,
              linkType: 'Self',
            });
          }
          if (parentChanged) {
            await studentsAPI.linkToUser(student.id, {
              userId: selectedParent?.id || null,
              linkType: 'Parent',
            });
          }
        }
      } else {
        await studentsAPI.create(payload);
      }
      onSaved();
    } catch (err) {
      const message = err.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} student`;
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? 'Edit Student' : 'Add Student'}</DialogTitle>
      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              fullWidth
              label="First Name"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Last Name"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              margin="normal"
              required
            />
          </Box>

          <TextField
            fullWidth
            label="Email (optional)"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            margin="normal"
          />

          <TextField
            fullWidth
            label="Phone (optional)"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            margin="normal"
          />

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              fullWidth
              label="Date of Birth (optional)"
              name="dateOfBirth"
              type="date"
              value={formData.dateOfBirth}
              onChange={handleChange}
              margin="normal"
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Age Group</InputLabel>
              <Select
                name="ageGroup"
                value={formData.ageGroup}
                onChange={handleChange}
                label="Age Group"
              >
                {AGE_GROUPS.map((ag) => (
                  <MenuItem key={ag.value} value={ag.value}>
                    {ag.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {isEdit && (
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, isActive: e.target.checked }))
                  }
                />
              }
              label="Active"
              sx={{ mt: 1 }}
            />
          )}

          {/* Admin-only: Direct user linking */}
          {isAdmin && isEdit && (
            <>
              <Divider sx={{ mt: 2, mb: 1 }} />
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Account Linking (Admin)
              </Typography>

              <Autocomplete
                options={userSearchResults}
                getOptionLabel={(option) => option.label || ''}
                value={selectedUser}
                onChange={(_, newValue) => setSelectedUser(newValue)}
                onInputChange={(_, value) => setUserSearchQuery(value)}
                loading={userSearchLoading}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Linked User Account"
                    placeholder="Search by name or email..."
                    margin="normal"
                    size="small"
                    slotProps={{
                      input: {
                        ...params.InputProps,
                        startAdornment: (
                          <>
                            <LinkIcon sx={{ mr: 1, color: 'action.active' }} />
                            {params.InputProps.startAdornment}
                          </>
                        ),
                      },
                    }}
                  />
                )}
                noOptionsText={userSearchQuery.length < 2 ? 'Type to search...' : 'No users found'}
              />

              <Autocomplete
                options={parentSearchResults}
                getOptionLabel={(option) => option.label || ''}
                value={selectedParent}
                onChange={(_, newValue) => setSelectedParent(newValue)}
                onInputChange={(_, value) => setParentSearchQuery(value)}
                loading={parentSearchLoading}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Parent Account"
                    placeholder="Search by name or email..."
                    margin="normal"
                    size="small"
                    slotProps={{
                      input: {
                        ...params.InputProps,
                        startAdornment: (
                          <>
                            <LinkIcon sx={{ mr: 1, color: 'action.active' }} />
                            {params.InputProps.startAdornment}
                          </>
                        ),
                      },
                    }}
                  />
                )}
                noOptionsText={parentSearchQuery.length < 2 ? 'Type to search...' : 'No users found'}
              />
            </>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : isEdit ? 'Save Changes' : 'Add Student'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
