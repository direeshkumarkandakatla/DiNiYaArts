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
  IconButton,
  Chip,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import { sessionsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import CreateSessionDialog from '../components/CreateSessionDialog';
import SessionDetailDialog from '../components/SessionDetailDialog';

export default function SessionList() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editSession, setEditSession] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const { user } = useAuth();

  const isAdminOrInstructor = user?.roles?.some(
    (r) => r === 'Administrator' || r === 'Instructor'
  );

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await sessionsAPI.getAll();
      setSessions(response.data);
      setError('');
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
      setError('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this session?')) return;

    try {
      await sessionsAPI.delete(id);
      fetchSessions();
    } catch (err) {
      setError('Failed to delete session');
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', {
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Sessions</Typography>
        {isAdminOrInstructor && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateOpen(true)}
          >
            New Session
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      )}

      {sessions.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            No sessions yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {isAdminOrInstructor
              ? 'Click "New Session" to create your first session.'
              : 'No sessions are currently scheduled.'}
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Class Type</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Time</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Students</TableCell>
                <TableCell>Instructor</TableCell>
                {isAdminOrInstructor && <TableCell align="right">Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {sessions.map((session) => (
                <TableRow key={session.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: session.classTypeColor,
                        }}
                      />
                      {session.classTypeName}
                    </Box>
                  </TableCell>
                  <TableCell>{formatDate(session.startDateTime)}</TableCell>
                  <TableCell>
                    {formatTime(session.startDateTime)} - {formatTime(session.endDateTime)}
                  </TableCell>
                  <TableCell>{session.durationMinutes} min</TableCell>
                  <TableCell>
                    <Chip
                      label={`${session.currentStudentCount}/${session.maxStudents}`}
                      size="small"
                      color={session.currentStudentCount >= session.maxStudents ? 'error' : 'default'}
                    />
                  </TableCell>
                  <TableCell>{session.createdByName}</TableCell>
                  {isAdminOrInstructor && (
                    <TableCell align="right">
                      <IconButton
                        color="primary"
                        size="small"
                        onClick={() => {
                          setEditSession(session);
                          setDetailOpen(true);
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        size="small"
                        onClick={() => handleDelete(session.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <CreateSessionDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => {
          setCreateOpen(false);
          fetchSessions();
        }}
      />

      <SessionDetailDialog
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false);
          setEditSession(null);
        }}
        session={editSession}
        onUpdated={() => {
          setDetailOpen(false);
          setEditSession(null);
          fetchSessions();
        }}
      />
    </Box>
  );
}
