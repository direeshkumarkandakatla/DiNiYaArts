import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Checkbox,
  Chip,
  TextField,
  ToggleButtonGroup,
  ToggleButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  InputAdornment,
  Tooltip,
  IconButton,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import { attendanceAPI, studentsAPI } from '../services/api';

const STATUS_OPTIONS = ['Assigned', 'Present', 'Absent', 'Late', 'Excused'];

const STATUS_COLORS = {
  Assigned: 'default',
  Present: 'success',
  Absent: 'error',
  Late: 'warning',
  Excused: 'info',
};

export default function AttendanceMarker({ sessionId, canEdit, onAttendanceChanged }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [searchFilter, setSearchFilter] = useState('');

  // Merged list: all students with their attendance status (or null if not assigned)
  const [studentRows, setStudentRows] = useState([]);
  // Track which rows are selected (for bulk assign/remove)
  const [selected, setSelected] = useState(new Set());
  // Track changes for save
  const [changes, setChanges] = useState(new Map());

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const [attendanceRes, studentsRes] = await Promise.all([
        attendanceAPI.getForSession(sessionId),
        canEdit ? studentsAPI.getAll({ activeOnly: true }) : Promise.resolve({ data: [] }),
      ]);

      const attendanceData = attendanceRes.data;
      const allStudents = studentsRes.data || [];

      // Build a map of studentId -> attendance record
      const attendanceMap = new Map();
      (attendanceData.attendances || []).forEach((a) => {
        attendanceMap.set(a.studentId, a);
      });

      // Merge: all students + attendance status
      const rows = [];
      if (canEdit) {
        allStudents.forEach((s) => {
          const att = attendanceMap.get(s.id);
          rows.push({
            studentId: s.id,
            studentName: `${s.firstName} ${s.lastName}`,
            attendanceId: att?.id || null,
            status: att?.status || null,
            notes: att?.notes || '',
            originalStatus: att?.status || null,
            originalNotes: att?.notes || '',
          });
        });
      } else {
        // Read-only: just show assigned students
        (attendanceData.attendances || []).forEach((a) => {
          rows.push({
            studentId: a.studentId,
            studentName: a.studentName,
            attendanceId: a.id,
            status: a.status,
            notes: a.notes || '',
            originalStatus: a.status,
            originalNotes: a.notes || '',
          });
        });
      }

      rows.sort((a, b) => a.studentName.localeCompare(b.studentName));
      setStudentRows(rows);
      setChanges(new Map());
      setSelected(new Set());
    } catch (err) {
      setError('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  }, [sessionId, canEdit]);

  useEffect(() => {
    if (sessionId) loadData();
  }, [sessionId, loadData]);

  const getRow = (studentId) => {
    return studentRows.find((r) => r.studentId === studentId);
  };

  const getCurrentStatus = (studentId) => {
    if (changes.has(studentId)) return changes.get(studentId).status;
    return getRow(studentId)?.status;
  };

  const getCurrentNotes = (studentId) => {
    if (changes.has(studentId)) return changes.get(studentId).notes;
    return getRow(studentId)?.notes || '';
  };

  const handleStatusChange = (studentId, newStatus) => {
    if (!newStatus) return;
    const row = getRow(studentId);
    const currentNotes = getCurrentNotes(studentId);
    setChanges((prev) => {
      const next = new Map(prev);
      // If reverting to original, remove from changes
      if (newStatus === row.originalStatus && currentNotes === (row.originalNotes || '')) {
        next.delete(studentId);
      } else {
        next.set(studentId, { status: newStatus, notes: currentNotes });
      }
      return next;
    });
    setSuccessMsg('');
  };

  const handleNotesChange = (studentId, notes) => {
    const row = getRow(studentId);
    const currentStatus = getCurrentStatus(studentId);
    setChanges((prev) => {
      const next = new Map(prev);
      if (currentStatus === row.originalStatus && notes === (row.originalNotes || '')) {
        next.delete(studentId);
      } else {
        next.set(studentId, { status: currentStatus, notes });
      }
      return next;
    });
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      const filtered = getFilteredRows();
      setSelected(new Set(filtered.map((r) => r.studentId)));
    } else {
      setSelected(new Set());
    }
  };

  const handleSelectOne = (studentId, checked) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(studentId);
      else next.delete(studentId);
      return next;
    });
  };

  const handleAssignSelected = () => {
    setChanges((prev) => {
      const next = new Map(prev);
      selected.forEach((studentId) => {
        const row = getRow(studentId);
        if (!row.status && !next.has(studentId)) {
          next.set(studentId, { status: 'Assigned', notes: '' });
        }
      });
      return next;
    });
    setSuccessMsg('');
  };

  const handleAssignAll = () => {
    setChanges((prev) => {
      const next = new Map(prev);
      studentRows.forEach((row) => {
        if (!row.status && !next.has(row.studentId)) {
          next.set(row.studentId, { status: 'Assigned', notes: '' });
        }
      });
      return next;
    });
    setSuccessMsg('');
  };

  const handleMarkAllPresent = () => {
    setChanges((prev) => {
      const next = new Map(prev);
      studentRows.forEach((row) => {
        const currentStatus = next.has(row.studentId) ? next.get(row.studentId).status : row.status;
        if (currentStatus === 'Assigned') {
          const currentNotes = next.has(row.studentId) ? next.get(row.studentId).notes : (row.notes || '');
          next.set(row.studentId, { status: 'Present', notes: currentNotes });
        }
      });
      return next;
    });
    setSuccessMsg('');
  };

  const handleRemoveSelected = async () => {
    // Delete attendance records for selected students who are assigned
    const toDelete = [];
    selected.forEach((studentId) => {
      const row = getRow(studentId);
      if (row?.attendanceId) toDelete.push(row.attendanceId);
    });

    if (toDelete.length === 0) return;

    try {
      setSaving(true);
      await Promise.all(toDelete.map((id) => attendanceAPI.delete(id)));
      await loadData();
      onAttendanceChanged?.();
      setSuccessMsg(`Removed ${toDelete.length} student(s)`);
    } catch (err) {
      setError('Failed to remove attendance records');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (changes.size === 0) return;

    setSaving(true);
    setError('');
    setSuccessMsg('');

    try {
      const attendances = [];
      changes.forEach((change, studentId) => {
        if (change.status) {
          attendances.push({
            studentId,
            status: change.status,
            notes: change.notes || null,
          });
        }
      });

      if (attendances.length > 0) {
        await attendanceAPI.markForSession(sessionId, { attendances });
      }

      await loadData();
      onAttendanceChanged?.();
      setSuccessMsg(`Saved ${attendances.length} record(s)`);
    } catch (err) {
      setError('Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const getFilteredRows = () => {
    if (!searchFilter) return studentRows;
    const q = searchFilter.toLowerCase();
    return studentRows.filter((r) => r.studentName.toLowerCase().includes(q));
  };

  // Counts (including pending changes)
  const getCounts = () => {
    const counts = { Assigned: 0, Present: 0, Absent: 0, Late: 0, Excused: 0, Unassigned: 0 };
    studentRows.forEach((row) => {
      const status = changes.has(row.studentId) ? changes.get(row.studentId).status : row.status;
      if (status) counts[status] = (counts[status] || 0) + 1;
      else counts.Unassigned++;
    });
    return counts;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  const filteredRows = getFilteredRows();
  const counts = getCounts();
  const hasChanges = changes.size > 0;
  const assignedCount = studentRows.filter((r) => {
    const s = changes.has(r.studentId) ? changes.get(r.studentId).status : r.status;
    return s === 'Assigned';
  }).length;
  const unassignedCount = studentRows.filter((r) => {
    const s = changes.has(r.studentId) ? changes.get(r.studentId).status : r.status;
    return !s;
  }).length;

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {successMsg && <Alert severity="success" sx={{ mb: 2 }}>{successMsg}</Alert>}

      {/* Summary chips */}
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
        {counts.Assigned > 0 && <Chip label={`Assigned: ${counts.Assigned}`} size="small" />}
        {counts.Present > 0 && <Chip label={`Present: ${counts.Present}`} color="success" size="small" />}
        {counts.Absent > 0 && <Chip label={`Absent: ${counts.Absent}`} color="error" size="small" />}
        {counts.Late > 0 && <Chip label={`Late: ${counts.Late}`} color="warning" size="small" />}
        {counts.Excused > 0 && <Chip label={`Excused: ${counts.Excused}`} color="info" size="small" />}
        {counts.Unassigned > 0 && canEdit && (
          <Chip label={`Unassigned: ${counts.Unassigned}`} variant="outlined" size="small" />
        )}
      </Box>

      {/* Actions bar */}
      {canEdit && (
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2, alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Filter students..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
            sx={{ minWidth: 200 }}
          />
          <Box sx={{ flexGrow: 1 }} />
          {unassignedCount > 0 && (
            <>
              <Button size="small" variant="outlined" onClick={handleAssignSelected} disabled={selected.size === 0}>
                Assign Selected
              </Button>
              <Button size="small" variant="outlined" onClick={handleAssignAll}>
                Assign All
              </Button>
            </>
          )}
          {assignedCount > 0 && (
            <Button size="small" variant="outlined" color="success" onClick={handleMarkAllPresent}>
              Mark All Present
            </Button>
          )}
          {selected.size > 0 && (
            <Button size="small" variant="outlined" color="error" onClick={handleRemoveSelected} disabled={saving}>
              Remove Selected
            </Button>
          )}
          <Button
            size="small"
            variant="contained"
            startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
            onClick={handleSave}
            disabled={!hasChanges || saving}
          >
            Save
          </Button>
        </Box>
      )}

      {/* Student table */}
      {filteredRows.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
          {studentRows.length === 0 ? 'No students in the system' : 'No matching students'}
        </Typography>
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 400 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                {canEdit && (
                  <TableCell padding="checkbox">
                    <Checkbox
                      size="small"
                      checked={selected.size > 0 && selected.size === filteredRows.length}
                      indeterminate={selected.size > 0 && selected.size < filteredRows.length}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                  </TableCell>
                )}
                <TableCell>Student</TableCell>
                <TableCell>Status</TableCell>
                {canEdit && <TableCell>Notes</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRows.map((row) => {
                const currentStatus = getCurrentStatus(row.studentId);
                const currentNotes = getCurrentNotes(row.studentId);
                const isChanged = changes.has(row.studentId);

                return (
                  <TableRow
                    key={row.studentId}
                    sx={{
                      bgcolor: isChanged ? 'action.hover' : undefined,
                      opacity: !currentStatus && !canEdit ? 0.5 : 1,
                    }}
                  >
                    {canEdit && (
                      <TableCell padding="checkbox">
                        <Checkbox
                          size="small"
                          checked={selected.has(row.studentId)}
                          onChange={(e) => handleSelectOne(row.studentId, e.target.checked)}
                        />
                      </TableCell>
                    )}
                    <TableCell>
                      <Typography variant="body2">{row.studentName}</Typography>
                    </TableCell>
                    <TableCell>
                      {canEdit && currentStatus ? (
                        <ToggleButtonGroup
                          size="small"
                          exclusive
                          value={currentStatus}
                          onChange={(e, val) => handleStatusChange(row.studentId, val)}
                        >
                          {STATUS_OPTIONS.map((opt) => (
                            <ToggleButton
                              key={opt}
                              value={opt}
                              sx={{
                                px: 1,
                                py: 0.25,
                                fontSize: '0.7rem',
                                textTransform: 'none',
                                '&.Mui-selected': {
                                  bgcolor: STATUS_COLORS[opt] === 'default' ? 'grey.500' : `${STATUS_COLORS[opt]}.main`,
                                  color: 'white',
                                  '&:hover': {
                                    bgcolor: STATUS_COLORS[opt] === 'default' ? 'grey.600' : `${STATUS_COLORS[opt]}.dark`,
                                  },
                                },
                              }}
                            >
                              {opt.charAt(0)}
                            </ToggleButton>
                          ))}
                        </ToggleButtonGroup>
                      ) : currentStatus ? (
                        <Chip
                          label={currentStatus}
                          color={STATUS_COLORS[currentStatus] || 'default'}
                          size="small"
                        />
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          Not assigned
                        </Typography>
                      )}
                    </TableCell>
                    {canEdit && (
                      <TableCell>
                        {currentStatus && (
                          <TextField
                            size="small"
                            variant="standard"
                            placeholder="Notes..."
                            value={currentNotes}
                            onChange={(e) => handleNotesChange(row.studentId, e.target.value)}
                            sx={{ minWidth: 100 }}
                          />
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
