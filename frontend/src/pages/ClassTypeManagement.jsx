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
  FormControlLabel,
  Switch,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import { classTypesAPI } from '../services/api';

const AGE_GROUPS = [
  'Toddlers',
  'Preschool',
  'Kids',
  'Preteens',
  'Teens',
  'Adults',
  'Seniors',
  'AllAges',
];

const INITIAL_FORM = {
  name: '',
  color: '#3B82F6',
  description: '',
  targetAgeGroup: 'AllAges',
  defaultSessionPrice: '',
  isActive: true,
};

export default function ClassTypeManagement() {
  const [classTypes, setClassTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);

  const fetchClassTypes = async () => {
    try {
      setLoading(true);
      const response = await classTypesAPI.getAll({ includeInactive: true });
      setClassTypes(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load class types');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassTypes();
  }, []);

  const handleOpenCreate = () => {
    setEditId(null);
    setFormData(INITIAL_FORM);
    setDialogOpen(true);
  };

  const handleOpenEdit = (ct) => {
    setEditId(ct.id);
    setFormData({
      name: ct.name,
      color: ct.color,
      description: ct.description || '',
      targetAgeGroup: ct.targetAgeGroup,
      defaultSessionPrice: ct.defaultSessionPrice.toString(),
      isActive: ct.isActive,
    });
    setDialogOpen(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        name: formData.name,
        color: formData.color,
        description: formData.description || null,
        targetAgeGroup: formData.targetAgeGroup,
        defaultSessionPrice: Number(formData.defaultSessionPrice) || 0,
      };

      if (editId) {
        await classTypesAPI.update(editId, { ...payload, isActive: formData.isActive });
      } else {
        await classTypesAPI.create(payload);
      }
      setDialogOpen(false);
      fetchClassTypes();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save class type');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this class type? If it has sessions, it will be deactivated instead.')) return;
    try {
      await classTypesAPI.delete(id);
      fetchClassTypes();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete class type');
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
        <Typography variant="h5">Class Types</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
          Add Class Type
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {classTypes.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            No class types found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Click "Add Class Type" to create your first one.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Color</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Target Age</TableCell>
                <TableCell align="right">Default Price</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {classTypes.map((ct) => (
                <TableRow key={ct.id} hover sx={{ opacity: ct.isActive ? 1 : 0.5 }}>
                  <TableCell>
                    <Box
                      sx={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        bgcolor: ct.color,
                        border: '2px solid',
                        borderColor: 'divider',
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>{ct.name}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {ct.description || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>{ct.targetAgeGroup}</TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight={500}>
                      ${ct.defaultSessionPrice.toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={ct.isActive ? 'Active' : 'Inactive'}
                      size="small"
                      color={ct.isActive ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton color="primary" size="small" onClick={() => handleOpenEdit(ct)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton color="error" size="small" onClick={() => handleDelete(ct.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editId ? 'Edit Class Type' : 'Create Class Type'}</DialogTitle>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              fullWidth
              label="Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              margin="normal"
              required
            />
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 2 }}>
              <TextField
                label="Color"
                name="color"
                type="color"
                value={formData.color}
                onChange={handleChange}
                sx={{ width: 100 }}
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  bgcolor: formData.color,
                  border: '2px solid',
                  borderColor: 'divider',
                }}
              />
              <Typography variant="body2" color="text.secondary">{formData.color}</Typography>
            </Box>
            <TextField
              fullWidth
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              margin="normal"
              multiline
              rows={2}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Target Age Group</InputLabel>
              <Select
                name="targetAgeGroup"
                value={formData.targetAgeGroup}
                onChange={handleChange}
                label="Target Age Group"
              >
                {AGE_GROUPS.map((ag) => (
                  <MenuItem key={ag} value={ag}>{ag}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Default Session Price ($)"
              name="defaultSessionPrice"
              type="number"
              value={formData.defaultSessionPrice}
              onChange={handleChange}
              margin="normal"
              required
              inputProps={{ min: 0, step: 0.01 }}
              helperText="Price charged per session when student has no package"
            />
            {editId && (
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.checked }))}
                  />
                }
                label="Active"
                sx={{ mt: 1 }}
              />
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={saving || !formData.name}>
              {saving ? <CircularProgress size={24} /> : editId ? 'Save' : 'Create'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}
