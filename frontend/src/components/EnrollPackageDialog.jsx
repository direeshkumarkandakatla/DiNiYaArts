import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Box,
  Typography,
  Checkbox,
  FormGroup,
  FormControlLabel,
  TextField,
} from '@mui/material';
import { packageDefinitionsAPI, billingAPI, studentsAPI } from '../services/api';

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

export default function EnrollPackageDialog({ open, onClose, onEnrolled, preSelectedStudentId, billingYear, billingMonth }) {
  const [packages, setPackages] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [year, setYear] = useState(billingYear || new Date().getFullYear());
  const [month, setMonth] = useState(billingMonth || new Date().getMonth() + 1);
  const [studentSearch, setStudentSearch] = useState('');
  const [isBulk, setIsBulk] = useState(!preSelectedStudentId);

  useEffect(() => {
    if (open) {
      fetchData();
      if (preSelectedStudentId) {
        setSelectedStudentIds([preSelectedStudentId]);
        setIsBulk(false);
      } else {
        setSelectedStudentIds([]);
        setIsBulk(true);
      }
      if (billingYear) setYear(billingYear);
      if (billingMonth) setMonth(billingMonth);
    }
  }, [open, preSelectedStudentId, billingYear, billingMonth]);

  const fetchData = async () => {
    try {
      const [pkgRes, studentRes] = await Promise.all([
        packageDefinitionsAPI.getAll({ activeOnly: true }),
        studentsAPI.getAll({ activeOnly: true }),
      ]);
      setPackages(pkgRes.data);
      setStudents(studentRes.data);
      if (pkgRes.data.length > 0 && !selectedPackageId) {
        setSelectedPackageId(pkgRes.data[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedStudentIds.length === 0 || !selectedPackageId) return;

    setLoading(true);
    setError('');

    try {
      if (selectedStudentIds.length === 1 && !isBulk) {
        await billingAPI.enrollPackage({
          studentId: selectedStudentIds[0],
          packageDefinitionId: Number(selectedPackageId),
          billingYear: Number(year),
          billingMonth: Number(month),
        });
      } else {
        await billingAPI.bulkEnrollPackage({
          studentIds: selectedStudentIds,
          packageDefinitionId: Number(selectedPackageId),
          billingYear: Number(year),
          billingMonth: Number(month),
        });
      }
      setSelectedStudentIds([]);
      setSelectedPackageId('');
      setStudentSearch('');
      setError('');
      onEnrolled();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to enroll');
    } finally {
      setLoading(false);
    }
  };

  // Group packages by class type
  const groupedPackages = packages.reduce((acc, pkg) => {
    if (!acc[pkg.classTypeName]) acc[pkg.classTypeName] = [];
    acc[pkg.classTypeName].push(pkg);
    return acc;
  }, {});

  const selectedPkg = packages.find((p) => p.id === selectedPackageId);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Enroll in Package</DialogTitle>
      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <FormControl fullWidth margin="normal" required>
            <InputLabel>Package</InputLabel>
            <Select
              value={selectedPackageId}
              onChange={(e) => setSelectedPackageId(e.target.value)}
              label="Package"
            >
              {Object.entries(groupedPackages).map(([classType, pkgs]) => [
                <MenuItem key={`header-${classType}`} disabled sx={{ fontWeight: 'bold', opacity: 1 }}>
                  {classType}
                </MenuItem>,
                ...pkgs.map((pkg) => (
                  <MenuItem key={pkg.id} value={pkg.id} sx={{ pl: 4 }}>
                    {pkg.name} ({pkg.sessionCount} sessions) - ${pkg.price.toFixed(2)}
                  </MenuItem>
                )),
              ])}
            </Select>
          </FormControl>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl fullWidth margin="normal" required>
              <InputLabel>Month</InputLabel>
              <Select value={month} onChange={(e) => setMonth(e.target.value)} label="Month">
                {MONTHS.map((m) => (
                  <MenuItem key={m.value} value={m.value}>
                    {m.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Year"
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              margin="normal"
              required
              inputProps={{ min: 2000, max: 2100 }}
            />
          </Box>

          {selectedPkg && (
            <Alert severity="info" sx={{ mt: 1 }}>
              {selectedPkg.classTypeName} - {selectedPkg.name}: {selectedPkg.sessionCount} sessions at ${selectedPkg.price.toFixed(2)}
            </Alert>
          )}

          {isBulk && (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="subtitle2">
                  Select Students ({selectedStudentIds.length} selected)
                </Typography>
                <Box>
                  <Button size="small" onClick={() => setSelectedStudentIds(students.map((s) => s.id))}>
                    Select All
                  </Button>
                  <Button size="small" onClick={() => setSelectedStudentIds([])}>
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
                  maxHeight: 200,
                  overflow: 'auto',
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  px: 1,
                }}
              >
                {filteredStudents.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                    No students found
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
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || selectedStudentIds.length === 0 || !selectedPackageId}
          >
            {loading ? <CircularProgress size={24} /> : `Enroll ${selectedStudentIds.length} Student${selectedStudentIds.length !== 1 ? 's' : ''}`}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
