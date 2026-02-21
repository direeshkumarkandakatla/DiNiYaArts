import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Box,
  ToggleButtonGroup,
  ToggleButton,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Typography,
  Chip,
} from '@mui/material';
import { sessionsAPI, studentsAPI } from '../services/api';
import api from '../services/api';

const DAY_OPTIONS = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
];

const RECURRENCE_OPTIONS = [
  { value: 0, label: 'Every Week' },
  { value: 1, label: 'Every Other Week' },
  { value: 2, label: 'Every 3 Weeks' },
  { value: 3, label: 'Every 4 Weeks' },
];

export default function CreateSessionDialog({ open, onClose, onCreated, initialDate }) {
  const [classTypes, setClassTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('single'); // 'single' or 'recurring'
  const [students, setStudents] = useState([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [formData, setFormData] = useState({
    classTypeId: '',
    startDateTime: '',
    durationMinutes: 60,
    maxStudents: 10,
    notes: '',
  });
  const [bulkData, setBulkData] = useState({
    classTypeId: '',
    startTime: '10:00',
    durationMinutes: 60,
    fromDate: '',
    toDate: '',
    daysOfWeek: [],
    recurrence: 0,
    maxStudents: 10,
    notes: '',
  });

  useEffect(() => {
    if (open) {
      fetchClassTypes();
      fetchStudents();
      if (initialDate) {
        const dateStr = formatDateTimeLocal(initialDate);
        setFormData((prev) => ({ ...prev, startDateTime: dateStr }));

        const dateOnly = formatDateOnly(initialDate);
        setBulkData((prev) => ({ ...prev, fromDate: dateOnly }));
      }
    }
  }, [open, initialDate]);

  const formatDateTimeLocal = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const formatDateOnly = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const fetchClassTypes = async () => {
    try {
      const response = await api.get('/classtypes');
      setClassTypes(response.data);
      if (response.data.length > 0) {
        if (!formData.classTypeId) {
          setFormData((prev) => ({ ...prev, classTypeId: response.data[0].id }));
        }
        if (!bulkData.classTypeId) {
          setBulkData((prev) => ({ ...prev, classTypeId: response.data[0].id }));
        }
      }
    } catch (err) {
      console.error('Failed to fetch class types:', err);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await studentsAPI.getAll({ activeOnly: true });
      setStudents(response.data);
    } catch (err) {
      console.error('Failed to fetch students:', err);
    }
  };

  const handleStudentToggle = (studentId) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    );
  };

  const filteredStudents = students.filter((s) => {
    const name = `${s.firstName} ${s.lastName}`.toLowerCase();
    return name.includes(studentSearch.toLowerCase());
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleBulkChange = (e) => {
    setBulkData({
      ...bulkData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleDayToggle = (dayValue) => {
    setBulkData((prev) => {
      const days = prev.daysOfWeek.includes(dayValue)
        ? prev.daysOfWeek.filter((d) => d !== dayValue)
        : [...prev.daysOfWeek, dayValue].sort();
      return { ...prev, daysOfWeek: days };
    });
    setError('');
  };

  const handleSubmitSingle = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await sessionsAPI.create({
        classTypeId: Number(formData.classTypeId),
        startDateTime: new Date(formData.startDateTime).toISOString(),
        durationMinutes: Number(formData.durationMinutes),
        maxStudents: Number(formData.maxStudents),
        notes: formData.notes || null,
        studentIds: selectedStudentIds.length > 0 ? selectedStudentIds : null,
      });

      resetAndClose();
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to create session';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitBulk = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (bulkData.daysOfWeek.length === 0) {
      setError('Please select at least one day of the week');
      setLoading(false);
      return;
    }

    try {
      await sessionsAPI.createBulk({
        classTypeId: Number(bulkData.classTypeId),
        startTime: bulkData.startTime + ':00', // HH:mm:ss format for TimeSpan
        durationMinutes: Number(bulkData.durationMinutes),
        fromDate: bulkData.fromDate,
        toDate: bulkData.toDate,
        daysOfWeek: bulkData.daysOfWeek,
        recurrence: Number(bulkData.recurrence),
        maxStudents: Number(bulkData.maxStudents),
        notes: bulkData.notes || null,
        studentIds: selectedStudentIds.length > 0 ? selectedStudentIds : null,
        timezoneOffsetMinutes: new Date().getTimezoneOffset(),
      });

      resetAndClose();
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to create sessions';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const resetAndClose = () => {
    setFormData({
      classTypeId: classTypes[0]?.id || '',
      startDateTime: '',
      durationMinutes: 60,
      maxStudents: 10,
      notes: '',
    });
    setBulkData({
      classTypeId: classTypes[0]?.id || '',
      startTime: '10:00',
      durationMinutes: 60,
      fromDate: '',
      toDate: '',
      daysOfWeek: [],
      recurrence: 0,
      maxStudents: 10,
      notes: '',
    });
    setSelectedStudentIds([]);
    setStudentSearch('');
    setError('');
    onCreated();
  };

  const studentPicker = (
    <Box sx={{ mt: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="subtitle2">
          Assign Students
          {selectedStudentIds.length > 0 && (
            <Chip
              label={`${selectedStudentIds.length} selected`}
              size="small"
              color="primary"
              sx={{ ml: 1 }}
            />
          )}
        </Typography>
        <Box>
          <Button
            size="small"
            onClick={() => setSelectedStudentIds(students.map((s) => s.id))}
            disabled={students.length === 0}
          >
            Select All
          </Button>
          <Button
            size="small"
            onClick={() => setSelectedStudentIds([])}
            disabled={selectedStudentIds.length === 0}
          >
            Deselect All
          </Button>
        </Box>
      </Box>
      <TextField
        fullWidth
        size="small"
        placeholder="Search students..."
        value={studentSearch}
        onChange={(e) => setStudentSearch(e.target.value)}
        sx={{ mb: 1 }}
      />
      <Box
        sx={{
          maxHeight: 180,
          overflow: 'auto',
          border: 1,
          borderColor: 'divider',
          borderRadius: 1,
          px: 1,
        }}
      >
        {filteredStudents.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
            {students.length === 0 ? 'No active students found' : 'No matching students'}
          </Typography>
        ) : (
          <FormGroup>
            {filteredStudents.map((student) => (
              <FormControlLabel
                key={student.id}
                control={
                  <Checkbox
                    checked={selectedStudentIds.includes(student.id)}
                    onChange={() => handleStudentToggle(student.id)}
                    size="small"
                  />
                }
                label={`${student.firstName} ${student.lastName}`}
              />
            ))}
          </FormGroup>
        )}
      </Box>
    </Box>
  );

  const classTypeSelect = (value, onChange, name) => (
    <FormControl fullWidth margin="normal" required>
      <InputLabel>Class Type</InputLabel>
      <Select name={name} value={value} onChange={onChange} label="Class Type">
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
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create Session</DialogTitle>
      <Box sx={{ px: 3 }}>
        <ToggleButtonGroup
          value={mode}
          exclusive
          onChange={(e, newMode) => {
            if (newMode) {
              setMode(newMode);
              setError('');
            }
          }}
          size="small"
          fullWidth
        >
          <ToggleButton value="single">Single Session</ToggleButton>
          <ToggleButton value="recurring">Recurring Sessions</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {mode === 'single' ? (
        <Box component="form" onSubmit={handleSubmitSingle}>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {classTypeSelect(formData.classTypeId, handleChange, 'classTypeId')}

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
              helperText="15 min to 8 hours"
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
              label="Notes (optional)"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              margin="normal"
              multiline
              rows={3}
              placeholder="Any special instructions or details for this session"
            />

            {studentPicker}
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? <CircularProgress size={24} /> : 'Create Session'}
            </Button>
          </DialogActions>
        </Box>
      ) : (
        <Box component="form" onSubmit={handleSubmitBulk}>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {classTypeSelect(bulkData.classTypeId, handleBulkChange, 'classTypeId')}

            <TextField
              fullWidth
              label="Start Time"
              name="startTime"
              type="time"
              value={bulkData.startTime}
              onChange={handleBulkChange}
              margin="normal"
              required
              slotProps={{ inputLabel: { shrink: true } }}
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="From Date"
                name="fromDate"
                type="date"
                value={bulkData.fromDate}
                onChange={handleBulkChange}
                margin="normal"
                required
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                fullWidth
                label="To Date"
                name="toDate"
                type="date"
                value={bulkData.toDate}
                onChange={handleBulkChange}
                margin="normal"
                required
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Box>

            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
              Days of the Week *
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {DAY_OPTIONS.map((day) => (
                <Chip
                  key={day.value}
                  label={day.label}
                  onClick={() => handleDayToggle(day.value)}
                  color={bulkData.daysOfWeek.includes(day.value) ? 'primary' : 'default'}
                  variant={bulkData.daysOfWeek.includes(day.value) ? 'filled' : 'outlined'}
                  sx={{ cursor: 'pointer' }}
                />
              ))}
            </Box>

            <FormControl fullWidth margin="normal">
              <InputLabel>Recurrence</InputLabel>
              <Select
                name="recurrence"
                value={bulkData.recurrence}
                onChange={handleBulkChange}
                label="Recurrence"
              >
                {RECURRENCE_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Duration (minutes)"
              name="durationMinutes"
              type="number"
              value={bulkData.durationMinutes}
              onChange={handleBulkChange}
              margin="normal"
              required
              inputProps={{ min: 15, max: 480 }}
              helperText="15 min to 8 hours"
            />

            <TextField
              fullWidth
              label="Max Students"
              name="maxStudents"
              type="number"
              value={bulkData.maxStudents}
              onChange={handleBulkChange}
              margin="normal"
              required
              inputProps={{ min: 1, max: 100 }}
            />

            <TextField
              fullWidth
              label="Notes (optional)"
              name="notes"
              value={bulkData.notes}
              onChange={handleBulkChange}
              margin="normal"
              multiline
              rows={2}
              placeholder="Any special instructions for all sessions"
            />

            {studentPicker}
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? <CircularProgress size={24} /> : 'Create Sessions'}
            </Button>
          </DialogActions>
        </Box>
      )}
    </Dialog>
  );
}
