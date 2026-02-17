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
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButtonGroup,
  ToggleButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  InputAdornment,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { linkRequestsAPI } from '../services/api';

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

const STATUS_COLORS = {
  Pending: 'warning',
  Approved: 'success',
  Rejected: 'error',
};

export default function MyStudents() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState('claim'); // 'claim' or 'create'
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Claim form state
  const [searchName, setSearchName] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [claimLinkType, setClaimLinkType] = useState('Self');

  // Create form state
  const [createForm, setCreateForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    ageGroup: '',
    linkType: 'Self',
  });

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await linkRequestsAPI.getMyRequests();
      setRequests(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load your requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleSearch = async () => {
    if (searchName.length < 2) return;
    setSearching(true);
    try {
      const response = await linkRequestsAPI.searchStudents(searchName);
      setSearchResults(response.data);
    } catch (err) {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleClaim = async () => {
    if (!selectedStudent) return;
    setSubmitLoading(true);
    setSubmitError('');
    try {
      await linkRequestsAPI.claim({
        studentId: selectedStudent.id,
        linkType: claimLinkType,
      });
      closeDialog();
      fetchRequests();
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Failed to submit claim');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setSubmitError('');
    try {
      await linkRequestsAPI.createStudent({
        firstName: createForm.firstName,
        lastName: createForm.lastName,
        email: createForm.email || null,
        phone: createForm.phone || null,
        dateOfBirth: createForm.dateOfBirth || null,
        ageGroup: createForm.ageGroup || null,
        linkType: createForm.linkType,
      });
      closeDialog();
      fetchRequests();
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Failed to submit request');
    } finally {
      setSubmitLoading(false);
    }
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setSubmitError('');
    setSearchName('');
    setSearchResults([]);
    setSelectedStudent(null);
    setClaimLinkType('Self');
    setCreateForm({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      ageGroup: '',
      linkType: 'Self',
    });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">My Students</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<SearchIcon />}
            onClick={() => {
              setDialogMode('claim');
              setDialogOpen(true);
            }}
          >
            Claim Existing
          </Button>
          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={() => {
              setDialogMode('create');
              setDialogOpen(true);
            }}
          >
            Create New
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {requests.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            No student profiles linked yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Use "Claim Existing" to link to a student already in the system, or "Create New" to request a new student profile.
          </Typography>
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {requests.map((req) => (
            <Card key={req.id} variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {req.studentName || `${req.newFirstName} ${req.newLastName}`}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {req.studentId ? 'Claim request' : 'New student request'} as{' '}
                      <strong>{req.linkType}</strong>
                    </Typography>
                  </Box>
                  <Chip
                    label={req.status}
                    color={STATUS_COLORS[req.status] || 'default'}
                    size="small"
                  />
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Submitted: {formatDate(req.createdAt)}
                  {req.reviewedAt && ` | Reviewed: ${formatDate(req.reviewedAt)} by ${req.reviewedByName}`}
                </Typography>
                {req.reviewNotes && (
                  <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                    Note: {req.reviewNotes}
                  </Typography>
                )}
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* Claim / Create Dialog */}
      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogMode === 'claim' ? 'Claim Existing Student' : 'Create New Student Profile'}
        </DialogTitle>

        {dialogMode === 'claim' ? (
          <Box>
            <DialogContent>
              {submitError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {submitError}
                </Alert>
              )}

              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Search for a student by name to link them to your account. An admin will review and approve your request.
              </Typography>

              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search student by name..."
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
                <Button variant="outlined" onClick={handleSearch} disabled={searching || searchName.length < 2}>
                  {searching ? <CircularProgress size={20} /> : 'Search'}
                </Button>
              </Box>

              {searchResults.length > 0 && (
                <Paper variant="outlined" sx={{ mb: 2 }}>
                  <List dense>
                    {searchResults.map((s) => (
                      <ListItem key={s.id} disablePadding>
                        <ListItemButton
                          selected={selectedStudent?.id === s.id}
                          onClick={() => setSelectedStudent(s)}
                        >
                          <ListItemText
                            primary={`${s.firstName} ${s.lastName}`}
                            secondary={s.ageGroup || 'Age group not set'}
                          />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              )}

              {selectedStudent && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Selected: {selectedStudent.firstName} {selectedStudent.lastName}
                  </Typography>
                  <FormControl fullWidth size="small">
                    <InputLabel>I am this student's...</InputLabel>
                    <Select
                      value={claimLinkType}
                      onChange={(e) => setClaimLinkType(e.target.value)}
                      label="I am this student's..."
                    >
                      <MenuItem value="Self">Self (I am this student)</MenuItem>
                      <MenuItem value="Parent">Parent / Guardian</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              )}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button onClick={closeDialog}>Cancel</Button>
              <Button
                variant="contained"
                onClick={handleClaim}
                disabled={!selectedStudent || submitLoading}
              >
                {submitLoading ? <CircularProgress size={24} /> : 'Submit Claim'}
              </Button>
            </DialogActions>
          </Box>
        ) : (
          <Box component="form" onSubmit={handleCreateStudent}>
            <DialogContent>
              {submitError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {submitError}
                </Alert>
              )}

              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Create a new student profile. An admin will review and approve your request.
              </Typography>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={createForm.firstName}
                  onChange={(e) => setCreateForm((p) => ({ ...p, firstName: e.target.value }))}
                  margin="normal"
                  required
                />
                <TextField
                  fullWidth
                  label="Last Name"
                  value={createForm.lastName}
                  onChange={(e) => setCreateForm((p) => ({ ...p, lastName: e.target.value }))}
                  margin="normal"
                  required
                />
              </Box>

              <TextField
                fullWidth
                label="Email (optional)"
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))}
                margin="normal"
              />

              <TextField
                fullWidth
                label="Phone (optional)"
                type="tel"
                value={createForm.phone}
                onChange={(e) => setCreateForm((p) => ({ ...p, phone: e.target.value }))}
                margin="normal"
              />

              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  label="Date of Birth (optional)"
                  type="date"
                  value={createForm.dateOfBirth}
                  onChange={(e) => setCreateForm((p) => ({ ...p, dateOfBirth: e.target.value }))}
                  margin="normal"
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                <FormControl fullWidth margin="normal">
                  <InputLabel>Age Group</InputLabel>
                  <Select
                    value={createForm.ageGroup}
                    onChange={(e) => setCreateForm((p) => ({ ...p, ageGroup: e.target.value }))}
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

              <FormControl fullWidth margin="normal">
                <InputLabel>Relationship</InputLabel>
                <Select
                  value={createForm.linkType}
                  onChange={(e) => setCreateForm((p) => ({ ...p, linkType: e.target.value }))}
                  label="Relationship"
                >
                  <MenuItem value="Self">Self (I am this student)</MenuItem>
                  <MenuItem value="Parent">Parent / Guardian</MenuItem>
                </Select>
              </FormControl>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button onClick={closeDialog}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={submitLoading}>
                {submitLoading ? <CircularProgress size={24} /> : 'Submit Request'}
              </Button>
            </DialogActions>
          </Box>
        )}
      </Dialog>
    </Box>
  );
}
