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
} from '@mui/material';
import { studentsAPI } from '../services/api';

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
      }
      setError('');
    }
  }, [open, student]);

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
