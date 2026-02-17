import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Divider,
  Alert,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PeopleIcon from '@mui/icons-material/People';
import PersonIcon from '@mui/icons-material/Person';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { sessionsAPI } from '../services/api';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function SessionDetailDialog({ open, onClose, session, onUpdated }) {
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [classTypes, setClassTypes] = useState([]);
  const [formData, setFormData] = useState({});
  const { user } = useAuth();

  useEffect(() => {
    if (open && session) {
      setEditing(false);
      setError('');
      setFormData({
        classTypeId: session.classTypeId,
        startDateTime: formatDateTimeLocal(session.startDateTime),
        durationMinutes: session.durationMinutes,
        maxStudents: session.maxStudents,
        notes: session.notes || '',
      });
    }
  }, [open, session]);

  if (!session) return null;

  const isAdminOrInstructor = user?.roles?.some(
    (r) => r === 'Administrator' || r === 'Instructor'
  );

  const formatDateTimeLocal = (dateStr) => {
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleStartEdit = async () => {
    setEditing(true);
    try {
      const response = await api.get('/classtypes');
      setClassTypes(response.data);
    } catch (err) {
      console.error('Failed to fetch class types:', err);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');

    try {
      await sessionsAPI.update(session.id, {
        classTypeId: Number(formData.classTypeId),
        startDateTime: new Date(formData.startDateTime).toISOString(),
        durationMinutes: Number(formData.durationMinutes),
        maxStudents: Number(formData.maxStudents),
        notes: formData.notes || null,
      });
      onUpdated();
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to update session';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this session?')) return;

    setDeleting(true);
    setError('');

    try {
      await sessionsAPI.delete(session.id);
      onUpdated();
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to delete session';
      setError(message);
    } finally {
      setDeleting(false);
    }
  };

  const isFull = session.currentStudentCount >= session.maxStudents;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              backgroundColor: session.classTypeColor,
            }}
          />
          {editing ? 'Edit Session' : session.classTypeName}
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        )}

        {editing ? (
          /* Edit Mode */
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
            <FormControl fullWidth margin="normal" required>
              <InputLabel>Class Type</InputLabel>
              <Select
                name="classTypeId"
                value={formData.classTypeId}
                onChange={handleChange}
                label="Class Type"
              >
                {classTypes.map((ct) => (
                  <MenuItem key={ct.id} value={ct.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 16,
                          height: 16,
                          borderRadius: '50%',
                          backgroundColor: ct.color,
                        }}
                      />
                      {ct.name} ({ct.targetAgeGroup})
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Start Date & Time"
              name="startDateTime"
              type="datetime-local"
              value={formData.startDateTime}
              onChange={handleChange}
              margin="normal"
              required
              slotProps={{ inputLabel: { shrink: true } }}
            />

            <TextField
              fullWidth
              label="Duration (minutes)"
              name="durationMinutes"
              type="number"
              value={formData.durationMinutes}
              onChange={handleChange}
              margin="normal"
              required
              inputProps={{ min: 15, max: 480 }}
            />

            <TextField
              fullWidth
              label="Max Students"
              name="maxStudents"
              type="number"
              value={formData.maxStudents}
              onChange={handleChange}
              margin="normal"
              required
              inputProps={{ min: 1, max: 100 }}
            />

            <TextField
              fullWidth
              label="Notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              margin="normal"
              multiline
              rows={3}
            />
          </Box>
        ) : (
          /* View Mode */
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AccessTimeIcon color="action" />
              <Box>
                <Typography variant="body1">
                  {formatDate(session.startDateTime)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatTime(session.startDateTime)} - {formatTime(session.endDateTime)}
                  ({session.durationMinutes} min)
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PeopleIcon color="action" />
              <Typography variant="body1">
                {session.currentStudentCount} / {session.maxStudents} students
              </Typography>
              {isFull && <Chip label="Full" color="error" size="small" />}
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PersonIcon color="action" />
              <Typography variant="body1">
                Instructor: {session.createdByName}
              </Typography>
            </Box>

            {session.notes && (
              <>
                <Divider />
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Notes
                  </Typography>
                  <Typography variant="body2">{session.notes}</Typography>
                </Box>
              </>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        {isAdminOrInstructor && !editing && (
          <Button
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleDelete}
            disabled={deleting}
          >
            Delete
          </Button>
        )}
        <Box sx={{ flexGrow: 1 }} />
        {editing ? (
          <>
            <Button onClick={() => setEditing(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? <CircularProgress size={24} /> : 'Save'}
            </Button>
          </>
        ) : (
          <>
            {isAdminOrInstructor && (
              <Button
                startIcon={<EditIcon />}
                onClick={handleStartEdit}
              >
                Edit
              </Button>
            )}
            <Button onClick={onClose}>Close</Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
