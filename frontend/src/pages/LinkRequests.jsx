import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Card,
  CardContent,
  CardActions,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { linkRequestsAPI } from '../services/api';

export default function LinkRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null); // request id being processed
  const [rejectDialog, setRejectDialog] = useState({ open: false, requestId: null });
  const [rejectNotes, setRejectNotes] = useState('');

  const fetchPending = async () => {
    try {
      setLoading(true);
      const response = await linkRequestsAPI.getPending();
      setRequests(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load pending requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleApprove = async (id) => {
    setActionLoading(id);
    try {
      await linkRequestsAPI.approve(id);
      fetchPending();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve request');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    const id = rejectDialog.requestId;
    setActionLoading(id);
    try {
      await linkRequestsAPI.reject(id, { notes: rejectNotes || null });
      setRejectDialog({ open: false, requestId: null });
      setRejectNotes('');
      fetchPending();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject request');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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
        Pending Link Requests
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {requests.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            No pending requests
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            When students or parents request to link their accounts, they will appear here for your approval.
          </Typography>
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {requests.map((req) => (
            <Card key={req.id} variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {req.requestedByName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {req.requestedByEmail}
                    </Typography>
                  </Box>
                  <Chip
                    label={req.studentId ? 'Claim' : 'New Student'}
                    size="small"
                    color={req.studentId ? 'info' : 'secondary'}
                    variant="outlined"
                  />
                </Box>

                <Box sx={{ mt: 1.5, p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
                  {req.studentId ? (
                    <>
                      <Typography variant="body2">
                        Wants to claim <strong>{req.studentName}</strong> as <strong>{req.linkType}</strong>
                      </Typography>
                    </>
                  ) : (
                    <>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        Wants to create a new student profile as <strong>{req.linkType}</strong>:
                      </Typography>
                      <Typography variant="body2">
                        Name: <strong>{req.newFirstName} {req.newLastName}</strong>
                      </Typography>
                      {req.newEmail && (
                        <Typography variant="body2">Email: {req.newEmail}</Typography>
                      )}
                      {req.newPhone && (
                        <Typography variant="body2">Phone: {req.newPhone}</Typography>
                      )}
                      {req.newAgeGroup && (
                        <Typography variant="body2">Age Group: {req.newAgeGroup}</Typography>
                      )}
                      {req.newDateOfBirth && (
                        <Typography variant="body2">
                          DOB: {new Date(req.newDateOfBirth).toLocaleDateString()}
                        </Typography>
                      )}
                    </>
                  )}
                </Box>

                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Submitted: {formatDate(req.createdAt)}
                </Typography>
              </CardContent>
              <CardActions sx={{ px: 2, pb: 2 }}>
                <Button
                  variant="contained"
                  color="success"
                  size="small"
                  startIcon={<CheckCircleIcon />}
                  onClick={() => handleApprove(req.id)}
                  disabled={actionLoading === req.id}
                >
                  {actionLoading === req.id ? <CircularProgress size={20} /> : 'Approve'}
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  startIcon={<CancelIcon />}
                  onClick={() => setRejectDialog({ open: true, requestId: req.id })}
                  disabled={actionLoading === req.id}
                >
                  Reject
                </Button>
              </CardActions>
            </Card>
          ))}
        </Box>
      )}

      {/* Reject Confirmation Dialog */}
      <Dialog
        open={rejectDialog.open}
        onClose={() => setRejectDialog({ open: false, requestId: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Reject Request</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Optionally add a note explaining why this request is being rejected.
          </Typography>
          <TextField
            fullWidth
            label="Notes (optional)"
            value={rejectNotes}
            onChange={(e) => setRejectNotes(e.target.value)}
            multiline
            rows={2}
            placeholder="e.g., Student name doesn't match our records"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setRejectDialog({ open: false, requestId: null })}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleReject}
            disabled={actionLoading === rejectDialog.requestId}
          >
            {actionLoading === rejectDialog.requestId ? <CircularProgress size={24} /> : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
