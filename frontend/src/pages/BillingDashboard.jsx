import { useState, useEffect, Fragment } from 'react';
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
  Button,
  CircularProgress,
  Alert,
  Chip,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Collapse,
  Tabs,
  Tab,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PaymentIcon from '@mui/icons-material/Payment';
import SettingsIcon from '@mui/icons-material/Settings';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { useNavigate } from 'react-router-dom';
import { billingAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import EnrollPackageDialog from '../components/EnrollPackageDialog';
import RecordPaymentDialog from '../components/RecordPaymentDialog';

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

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

export default function BillingDashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
  const [enrollStudentId, setEnrollStudentId] = useState(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentStudentId, setPaymentStudentId] = useState(null);
  const [paymentBalance, setPaymentBalance] = useState(null);
  const [expandedRows, setExpandedRows] = useState({});
  const [detailTab, setDetailTab] = useState({});
  const navigate = useNavigate();
  const { activeRole } = useAuth();
  const isAdmin = activeRole === 'Administrator';

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const response = await billingAPI.getSummary({ year, month });
      setSummary(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load billing summary');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [year, month]);

  const toggleRow = (studentId) => {
    setExpandedRows((prev) => ({ ...prev, [studentId]: !prev[studentId] }));
  };

  const handleRecordPayment = (studentId, balance) => {
    setPaymentStudentId(studentId);
    setPaymentBalance(balance);
    setPaymentDialogOpen(true);
  };

  const handleEnrollStudent = (studentId) => {
    setEnrollStudentId(studentId || null);
    setEnrollDialogOpen(true);
  };

  const handleDeletePackage = async (packageId) => {
    if (!window.confirm('Remove this enrollment?')) return;
    try {
      await billingAPI.deletePackage(packageId);
      fetchSummary();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete enrollment');
    }
  };

  if (loading && !summary) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Billing Dashboard</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<GroupAddIcon />}
            onClick={() => handleEnrollStudent(null)}
          >
            Enroll Package
          </Button>
          {isAdmin && (
            <Button
              variant="outlined"
              startIcon={<SettingsIcon />}
              onClick={() => navigate('/billing/packages')}
            >
              Manage Packages
            </Button>
          )}
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      {summary && (
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <Card sx={{ flex: '1 1 200px', bgcolor: summary.totalOutstanding > 0 ? '#FFF3E0' : '#E8F5E9' }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">Total Outstanding</Typography>
              <Typography variant="h4" fontWeight={700} color={summary.totalOutstanding > 0 ? 'warning.dark' : 'success.dark'}>
                ${summary.totalOutstanding.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ flex: '1 1 200px', bgcolor: '#F3E5F5' }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">Billed This Month</Typography>
              <Typography variant="h4" fontWeight={700} color="secondary.dark">
                ${summary.billedThisMonth.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ flex: '1 1 200px', bgcolor: '#E3F2FD' }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">Collected This Month</Typography>
              <Typography variant="h4" fontWeight={700} color="info.dark">
                ${summary.collectedThisMonth.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ flex: '1 1 200px' }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">Students with Dues</Typography>
              <Typography variant="h4" fontWeight={700}>
                {summary.studentsWithDues}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Filter Bar */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Month</InputLabel>
          <Select value={month} onChange={(e) => setMonth(e.target.value)} label="Month">
            {MONTHS.map((m) => (
              <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 100 }}>
          <InputLabel>Year</InputLabel>
          <Select value={year} onChange={(e) => setYear(e.target.value)} label="Year">
            {[2024, 2025, 2026, 2027].map((y) => (
              <MenuItem key={y} value={y}>{y}</MenuItem>
            ))}
          </Select>
        </FormControl>
        {loading && <CircularProgress size={20} />}
      </Box>

      {/* Student Balances Table with Expandable Rows */}
      {summary && summary.studentBalances.length > 0 ? (
        <TableContainer component={Paper} sx={{ mb: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 48 }} />
                <TableCell>Student</TableCell>
                <TableCell>Packages</TableCell>
                <TableCell align="center">Sessions</TableCell>
                <TableCell align="right">Month Dues</TableCell>
                <TableCell align="right">Month Paid</TableCell>
                <TableCell align="right">Total Balance</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {summary.studentBalances.map((sb) => (
                <Fragment key={sb.studentId}>
                  <TableRow hover sx={{ '& > *': { borderBottom: expandedRows[sb.studentId] ? 'unset' : undefined } }}>
                    <TableCell>
                      <IconButton size="small" onClick={() => toggleRow(sb.studentId)}>
                        {expandedRows[sb.studentId] ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                      </IconButton>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {sb.studentName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {sb.packages.map((pkg) => (
                          <Chip
                            key={pkg.id}
                            label={`${pkg.classTypeName}: ${pkg.packageName}`}
                            size="small"
                            variant="outlined"
                            onDelete={isAdmin ? () => handleDeletePackage(pkg.id) : undefined}
                          />
                        ))}
                        {sb.packages.length === 0 && (
                          <Typography variant="body2" color="text.secondary">No package</Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2">
                        {sb.sessionCharges?.length || 0}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">${sb.monthlyDues.toFixed(2)}</TableCell>
                    <TableCell align="right">
                      {sb.monthlyPayments > 0 ? `$${sb.monthlyPayments.toFixed(2)}` : '-'}
                    </TableCell>
                    <TableCell align="right">
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        color={sb.outstandingBalance > 0 ? 'error.main' : sb.outstandingBalance < 0 ? 'info.main' : 'success.main'}
                      >
                        ${sb.outstandingBalance.toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Record Payment">
                        <IconButton
                          color="primary"
                          size="small"
                          onClick={() => handleRecordPayment(sb.studentId, sb.outstandingBalance)}
                        >
                          <PaymentIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Enroll in Package">
                        <IconButton
                          color="secondary"
                          size="small"
                          onClick={() => handleEnrollStudent(sb.studentId)}
                        >
                          <AddIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>

                  {/* Expandable Details with Tabs */}
                  <TableRow>
                    <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={8}>
                      <Collapse in={expandedRows[sb.studentId]} timeout="auto" unmountOnExit>
                        <Box sx={{ py: 2, px: 1 }}>
                          <Tabs
                            value={detailTab[sb.studentId] || 0}
                            onChange={(_, v) => setDetailTab((prev) => ({ ...prev, [sb.studentId]: v }))}
                            sx={{ mb: 2, minHeight: 36, '& .MuiTab-root': { minHeight: 36, py: 0.5, textTransform: 'none' } }}
                          >
                            <Tab label={`Session Charges (${sb.sessionCharges?.length || 0})`} />
                            <Tab label={`Payment History (${sb.recentPayments?.length || 0})`} />
                          </Tabs>

                          {/* Session Charges Tab */}
                          {(detailTab[sb.studentId] || 0) === 0 && (
                            sb.sessionCharges && sb.sessionCharges.length > 0 ? (
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell>Date</TableCell>
                                    <TableCell>Class Type</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Source</TableCell>
                                    <TableCell align="right">Charge</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {sb.sessionCharges.map((sc, idx) => (
                                    <TableRow key={idx}>
                                      <TableCell>{formatDate(sc.sessionDate)}</TableCell>
                                      <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                          <Box
                                            sx={{
                                              width: 10,
                                              height: 10,
                                              borderRadius: '50%',
                                              bgcolor: sc.classTypeColor,
                                            }}
                                          />
                                          {sc.classTypeName}
                                        </Box>
                                      </TableCell>
                                      <TableCell>
                                        <Chip
                                          label={sc.attendanceStatus}
                                          size="small"
                                          color={sc.attendanceStatus === 'Present' ? 'success' : 'warning'}
                                          variant="outlined"
                                        />
                                      </TableCell>
                                      <TableCell>
                                        <Typography variant="body2" color="text.secondary">
                                          {sc.chargeSource}
                                        </Typography>
                                      </TableCell>
                                      <TableCell align="right">
                                        <Typography variant="body2" fontWeight={500}>
                                          ${sc.chargeAmount.toFixed(2)}
                                        </Typography>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                No session charges this month
                              </Typography>
                            )
                          )}

                          {/* Payment History Tab */}
                          {detailTab[sb.studentId] === 1 && (
                            sb.recentPayments && sb.recentPayments.length > 0 ? (
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell>Date</TableCell>
                                    <TableCell align="right">Amount</TableCell>
                                    <TableCell align="right">Discount</TableCell>
                                    <TableCell>Notes</TableCell>
                                    <TableCell>Recorded By</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {sb.recentPayments.map((p) => (
                                    <TableRow key={p.id}>
                                      <TableCell>{formatDate(p.paymentDate)}</TableCell>
                                      <TableCell align="right">
                                        <Typography variant="body2" fontWeight={500} color="success.main">
                                          ${p.amount.toFixed(2)}
                                        </Typography>
                                      </TableCell>
                                      <TableCell align="right">
                                        {p.discount > 0 ? `$${p.discount.toFixed(2)}` : '-'}
                                      </TableCell>
                                      <TableCell>
                                        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                          {p.notes || '-'}
                                        </Typography>
                                      </TableCell>
                                      <TableCell>
                                        <Typography variant="body2" color="text.secondary">
                                          {p.recordedByName}
                                        </Typography>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                No payments recorded
                              </Typography>
                            )
                          )}
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        !loading && (
          <Paper sx={{ p: 4, textAlign: 'center', mb: 3 }}>
            <Typography variant="h6" color="text.secondary">
              No billing data for this period
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Students will appear here once they have attendance marked for the month.
            </Typography>
          </Paper>
        )
      )}

      <EnrollPackageDialog
        open={enrollDialogOpen}
        onClose={() => setEnrollDialogOpen(false)}
        onEnrolled={() => {
          setEnrollDialogOpen(false);
          fetchSummary();
        }}
        preSelectedStudentId={enrollStudentId}
        billingYear={year}
        billingMonth={month}
      />

      <RecordPaymentDialog
        open={paymentDialogOpen}
        onClose={() => setPaymentDialogOpen(false)}
        onRecorded={() => {
          setPaymentDialogOpen(false);
          fetchSummary();
        }}
        preSelectedStudentId={paymentStudentId}
        preSelectedBalance={paymentBalance}
      />
    </Box>
  );
}
