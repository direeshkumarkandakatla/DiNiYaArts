import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { billingAPI, studentsAPI } from '../services/api';

export default function RecordPaymentDialog({ open, onClose, onRecorded, preSelectedStudentId, preSelectedBalance }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    studentId: '',
    amount: '',
    discount: '0',
    paymentDate: '',
    notes: '',
  });

  useEffect(() => {
    if (open) {
      fetchStudents();
      const today = new Date().toISOString().split('T')[0];
      setFormData({
        studentId: preSelectedStudentId || '',
        amount: preSelectedBalance ? Math.max(0, preSelectedBalance).toFixed(2) : '',
        discount: '0',
        paymentDate: today,
        notes: '',
      });
      setError('');
    }
  }, [open, preSelectedStudentId, preSelectedBalance]);

  const fetchStudents = async () => {
    try {
      const response = await studentsAPI.getAll({ activeOnly: true });
      setStudents(response.data);
    } catch (err) {
      console.error('Failed to fetch students:', err);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await billingAPI.recordPayment({
        studentId: Number(formData.studentId),
        amount: Number(formData.amount),
        discount: Number(formData.discount) || 0,
        paymentDate: formData.paymentDate,
        notes: formData.notes || null,
      });
      onRecorded();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  const totalApplied = (Number(formData.amount) || 0) + (Number(formData.discount) || 0);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Record Payment</DialogTitle>
      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {!preSelectedStudentId ? (
            <FormControl fullWidth margin="normal" required>
              <InputLabel>Student</InputLabel>
              <Select
                name="studentId"
                value={formData.studentId}
                onChange={handleChange}
                label="Student"
              >
                {students.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.firstName} {s.lastName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Student: <strong>{students.find((s) => s.id === preSelectedStudentId)?.firstName} {students.find((s) => s.id === preSelectedStudentId)?.lastName}</strong>
            </Typography>
          )}

          <TextField
            fullWidth
            label="Amount ($)"
            name="amount"
            type="number"
            value={formData.amount}
            onChange={handleChange}
            margin="normal"
            required
            inputProps={{ min: 0.01, step: 0.01 }}
          />

          <TextField
            fullWidth
            label="Discount ($)"
            name="discount"
            type="number"
            value={formData.discount}
            onChange={handleChange}
            margin="normal"
            inputProps={{ min: 0, step: 0.01 }}
            helperText="Optional discount to apply (reduces balance independently)"
          />

          {totalApplied > 0 && (
            <Alert severity="info" sx={{ mt: 1 }}>
              Total applied to balance: ${Number(formData.amount || 0).toFixed(2)} payment + ${Number(formData.discount || 0).toFixed(2)} discount = <strong>${totalApplied.toFixed(2)}</strong>
            </Alert>
          )}

          <TextField
            fullWidth
            label="Payment Date"
            name="paymentDate"
            type="date"
            value={formData.paymentDate}
            onChange={handleChange}
            margin="normal"
            required
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <TextField
            fullWidth
            label="Notes (optional)"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            margin="normal"
            multiline
            rows={2}
            placeholder="Payment method, reference number, etc."
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || !formData.studentId || !formData.amount}
          >
            {loading ? <CircularProgress size={24} /> : 'Record Payment'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
