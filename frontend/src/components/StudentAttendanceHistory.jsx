import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Collapse,
  IconButton,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { attendanceAPI } from '../services/api';

const STATUS_COLORS = {
  Assigned: 'default',
  Present: 'success',
  Absent: 'error',
  Late: 'warning',
  Excused: 'info',
};

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export default function StudentAttendanceHistory({ studentId, studentName }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null); // 1-12

  useEffect(() => {
    if (!studentId) return;
    const fetchSummary = async () => {
      try {
        setLoading(true);
        const res = await attendanceAPI.getStudentSummary(studentId);
        setSummary(res.data);
        setError('');
      } catch (err) {
        setError('Failed to load attendance');
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, [studentId]);

  // Build a map of { year: Set<month> } from attendance data
  const availablePeriods = useMemo(() => {
    if (!summary?.recentAttendances?.length) return {};
    const periods = {};
    for (const a of summary.recentAttendances) {
      const d = new Date(a.sessionDate);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      if (!periods[year]) periods[year] = new Set();
      periods[year].add(month);
    }
    return periods;
  }, [summary]);

  // Set default selection to current month (if it has data) or the most recent period
  useEffect(() => {
    if (!summary?.recentAttendances?.length) return;
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    if (availablePeriods[currentYear]?.has(currentMonth)) {
      setSelectedYear(currentYear);
      setSelectedMonth(currentMonth);
    } else {
      // Pick the most recent period
      const years = Object.keys(availablePeriods).map(Number).sort((a, b) => b - a);
      if (years.length > 0) {
        const latestYear = years[0];
        const months = [...availablePeriods[latestYear]].sort((a, b) => b - a);
        setSelectedYear(latestYear);
        setSelectedMonth(months[0]);
      }
    }
  }, [availablePeriods, summary]);

  // Filter attendance records by selected year/month, sorted latest first
  const filteredAttendances = useMemo(() => {
    if (!summary?.recentAttendances?.length || !selectedYear || !selectedMonth) return [];
    return summary.recentAttendances
      .filter((a) => {
        const d = new Date(a.sessionDate);
        return d.getFullYear() === selectedYear && d.getMonth() + 1 === selectedMonth;
      })
      .sort((a, b) => new Date(b.sessionDate) - new Date(a.sessionDate));
  }, [summary, selectedYear, selectedMonth]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
        <CircularProgress size={20} />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>;
  }

  if (!summary || summary.totalSessions === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        No attendance records yet
      </Typography>
    );
  }

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const currentYear = new Date().getFullYear();
  const sortedYears = Object.keys(availablePeriods).map(Number).sort((a, b) => b - a);

  const handleMonthClick = (year, month) => {
    setSelectedYear(year);
    setSelectedMonth(month);
  };

  const handleYearClick = (year) => {
    // When clicking a previous year, select its most recent month
    const months = [...availablePeriods[year]].sort((a, b) => b - a);
    setSelectedYear(year);
    setSelectedMonth(months[0]);
  };

  // Separate current year months and previous years
  const currentYearMonths = availablePeriods[currentYear]
    ? [...availablePeriods[currentYear]].sort((a, b) => b - a)
    : [];
  const previousYears = sortedYears.filter((y) => y !== currentYear);

  return (
    <Box sx={{ mt: 1 }}>
      {/* Summary chips */}
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center', mb: 1 }}>
        <Chip label={`Sessions: ${summary.totalSessions}`} size="small" variant="outlined" />
        {summary.presentCount > 0 && <Chip label={`Present: ${summary.presentCount}`} color="success" size="small" />}
        {summary.absentCount > 0 && <Chip label={`Absent: ${summary.absentCount}`} color="error" size="small" />}
        {summary.lateCount > 0 && <Chip label={`Late: ${summary.lateCount}`} color="warning" size="small" />}
        {summary.excusedCount > 0 && <Chip label={`Excused: ${summary.excusedCount}`} color="info" size="small" />}
        <Chip
          label={`Rate: ${summary.attendanceRate}%`}
          color={summary.attendanceRate >= 80 ? 'success' : summary.attendanceRate >= 60 ? 'warning' : 'error'}
          size="small"
          variant="outlined"
        />
        <IconButton size="small" onClick={() => setExpanded(!expanded)}>
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>

      {/* Expandable history with month/year filters */}
      <Collapse in={expanded}>
        {/* Period filter pills */}
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center', mb: 1.5, mt: 1 }}>
          {/* Current year month pills */}
          {currentYearMonths.map((month) => {
            const isSelected = selectedYear === currentYear && selectedMonth === month;
            const shortYear = String(currentYear).slice(2);
            return (
              <Chip
                key={`${currentYear}-${month}`}
                label={`${MONTH_LABELS[month - 1]} ${shortYear}`}
                size="small"
                variant={isSelected ? 'filled' : 'outlined'}
                color={isSelected ? 'primary' : 'default'}
                onClick={() => handleMonthClick(currentYear, month)}
                sx={{ cursor: 'pointer' }}
              />
            );
          })}

          {/* Separator between current year months and previous years */}
          {currentYearMonths.length > 0 && previousYears.length > 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ mx: 0.5 }}>|</Typography>
          )}

          {/* Previous year pills — clicking shows that year's most recent month */}
          {previousYears.map((year) => {
            const isYearSelected = selectedYear === year;
            return (
              <Chip
                key={year}
                label={String(year)}
                size="small"
                variant={isYearSelected ? 'filled' : 'outlined'}
                color={isYearSelected ? 'secondary' : 'default'}
                onClick={() => handleYearClick(year)}
                sx={{ cursor: 'pointer' }}
              />
            );
          })}
        </Box>

        {/* Show month pills for selected previous year */}
        {selectedYear && selectedYear !== currentYear && availablePeriods[selectedYear] && (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1.5 }}>
            {[...availablePeriods[selectedYear]].sort((a, b) => b - a).map((month) => {
              const isSelected = selectedYear === selectedYear && selectedMonth === month;
              const shortYear = String(selectedYear).slice(2);
              return (
                <Chip
                  key={`${selectedYear}-${month}`}
                  label={`${MONTH_LABELS[month - 1]} ${shortYear}`}
                  size="small"
                  variant={isSelected ? 'filled' : 'outlined'}
                  color={isSelected ? 'secondary' : 'default'}
                  onClick={() => handleMonthClick(selectedYear, month)}
                  sx={{ cursor: 'pointer' }}
                />
              );
            })}
          </Box>
        )}

        {/* Filtered attendance table */}
        {filteredAttendances.length > 0 ? (
          <TableContainer component={Paper} variant="outlined" sx={{ mt: 1 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Class</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Notes</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredAttendances.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>
                      <Typography variant="body2">{formatDate(a.sessionDate)}</Typography>
                      <Typography variant="caption" color="text.secondary">{formatTime(a.sessionDate)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box
                          sx={{
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            bgcolor: a.classTypeColor,
                          }}
                        />
                        <Typography variant="body2">{a.classTypeName}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={a.status}
                        color={STATUS_COLORS[a.status] || 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">{a.notes || ''}</Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No sessions for this period
          </Typography>
        )}
      </Collapse>
    </Box>
  );
}
