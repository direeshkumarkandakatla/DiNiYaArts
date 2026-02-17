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
  TextField,
  InputAdornment,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import { studentsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import StudentDialog from '../components/StudentDialog';

export default function StudentList() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editStudent, setEditStudent] = useState(null);
  const { user } = useAuth();

  const isAdminOrInstructor = user?.roles?.some(
    (r) => r === 'Administrator' || r === 'Instructor'
  );

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await studentsAPI.getAll({ search: search || undefined });
      setStudents(response.data);
      setError('');
    } catch (err) {
      console.error('Failed to fetch students:', err);
      setError('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchStudents();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this student?')) return;

    try {
      await studentsAPI.delete(id);
      fetchStudents();
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to delete student';
      setError(message);
    }
  };

  const handleOpenCreate = () => {
    setEditStudent(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (student) => {
    setEditStudent(student);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditStudent(null);
  };

  const handleSaved = () => {
    setDialogOpen(false);
    setEditStudent(null);
    fetchStudents();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birth = new Date(dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
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
        <Typography variant="h5">Students</Typography>
        {isAdminOrInstructor && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenCreate}
          >
            Add Student
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
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
              setTimeout(fetchStudents, 0);
            }}
          >
            Clear
          </Button>
        )}
      </Box>

      {students.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            No students found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {isAdminOrInstructor
              ? 'Click "Add Student" to add your first student.'
              : 'No students are registered yet.'}
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Age</TableCell>
                <TableCell>Age Group</TableCell>
                <TableCell>Sessions</TableCell>
                <TableCell>Status</TableCell>
                {isAdminOrInstructor && <TableCell align="right">Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {students.map((student) => {
                const age = calculateAge(student.dateOfBirth);
                return (
                  <TableRow key={student.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {student.firstName} {student.lastName}
                      </Typography>
                    </TableCell>
                    <TableCell>{student.email || '-'}</TableCell>
                    <TableCell>{student.phone || '-'}</TableCell>
                    <TableCell>
                      {age !== null ? (
                        <Typography variant="body2">
                          {age} yrs
                        </Typography>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>{student.ageGroup || '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={student.totalAttendances}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={student.isActive ? 'Active' : 'Inactive'}
                        size="small"
                        color={student.isActive ? 'success' : 'default'}
                      />
                    </TableCell>
                    {isAdminOrInstructor && (
                      <TableCell align="right">
                        <IconButton
                          color="primary"
                          size="small"
                          onClick={() => handleOpenEdit(student)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => handleDelete(student.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <StudentDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        onSaved={handleSaved}
        student={editStudent}
      />
    </Box>
  );
}
