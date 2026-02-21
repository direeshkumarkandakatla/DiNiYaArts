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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import { packageDefinitionsAPI } from '../services/api';
import api from '../services/api';

export default function PackageManagement() {
  const [packages, setPackages] = useState([]);
  const [classTypes, setClassTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editPkg, setEditPkg] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    classTypeId: '',
    name: '',
    sessionCount: 4,
    price: '',
  });
  const navigate = useNavigate();

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const response = await packageDefinitionsAPI.getAll();
      setPackages(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load packages');
    } finally {
      setLoading(false);
    }
  };

  const fetchClassTypes = async () => {
    try {
      const response = await api.get('/classtypes');
      setClassTypes(response.data);
    } catch (err) {
      console.error('Failed to fetch class types:', err);
    }
  };

  useEffect(() => {
    fetchPackages();
    fetchClassTypes();
  }, []);

  const handleOpenCreate = () => {
    setEditPkg(null);
    setFormData({
      classTypeId: classTypes[0]?.id || '',
      name: '',
      sessionCount: 4,
      price: '',
    });
    setDialogOpen(true);
  };

  const handleOpenEdit = (pkg) => {
    setEditPkg(pkg);
    setFormData({
      classTypeId: pkg.classTypeId,
      name: pkg.name,
      sessionCount: pkg.sessionCount,
      price: pkg.price,
    });
    setDialogOpen(true);
  };

  const handleClose = () => {
    setDialogOpen(false);
    setEditPkg(null);
    setError('');
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      if (editPkg) {
        await packageDefinitionsAPI.update(editPkg.id, {
          name: formData.name,
          sessionCount: Number(formData.sessionCount),
          price: Number(formData.price),
        });
      } else {
        await packageDefinitionsAPI.create({
          classTypeId: Number(formData.classTypeId),
          name: formData.name,
          sessionCount: Number(formData.sessionCount),
          price: Number(formData.price),
        });
      }
      handleClose();
      fetchPackages();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save package');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this package definition?')) return;
    try {
      await packageDefinitionsAPI.delete(id);
      fetchPackages();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete package');
    }
  };

  const handleToggleActive = async (pkg) => {
    try {
      await packageDefinitionsAPI.update(pkg.id, { isActive: !pkg.isActive });
      fetchPackages();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update package');
    }
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={() => navigate('/billing')}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5">Package Definitions</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
          Add Package
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {packages.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            No package definitions yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Click "Add Package" to create your first package definition.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Class Type</TableCell>
                <TableCell>Package Name</TableCell>
                <TableCell align="center">Sessions</TableCell>
                <TableCell align="right">Price</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {packages.map((pkg) => (
                <TableRow key={pkg.id} hover>
                  <TableCell>{pkg.classTypeName}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {pkg.name}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">{pkg.sessionCount}</TableCell>
                  <TableCell align="right">${pkg.price.toFixed(2)}</TableCell>
                  <TableCell align="center">
                    <Chip
                      label={pkg.isActive ? 'Active' : 'Inactive'}
                      size="small"
                      color={pkg.isActive ? 'success' : 'default'}
                      onClick={() => handleToggleActive(pkg)}
                      sx={{ cursor: 'pointer' }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton color="primary" size="small" onClick={() => handleOpenEdit(pkg)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton color="error" size="small" onClick={() => handleDelete(pkg.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={dialogOpen} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editPkg ? 'Edit Package' : 'Add Package'}</DialogTitle>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {!editPkg && (
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
                        {ct.name}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <TextField
              fullWidth
              label="Package Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              margin="normal"
              required
              placeholder="e.g., 4-Session Pack"
            />

            <TextField
              fullWidth
              label="Session Count"
              name="sessionCount"
              type="number"
              value={formData.sessionCount}
              onChange={handleChange}
              margin="normal"
              required
              inputProps={{ min: 1, max: 100 }}
            />

            <TextField
              fullWidth
              label="Price ($)"
              name="price"
              type="number"
              value={formData.price}
              onChange={handleChange}
              margin="normal"
              required
              inputProps={{ min: 0.01, step: 0.01 }}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={saving}>
              {saving ? <CircularProgress size={24} /> : editPkg ? 'Save Changes' : 'Create Package'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}
