import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Divider,
  Chip,
  Collapse,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  LinearProgress,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { billingAPI } from '../services/api';

export default function MyDues() {
  const [billing, setBilling] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedPayments, setExpandedPayments] = useState({});
  const [expandedCharges, setExpandedCharges] = useState({});

  const fetchBilling = async () => {
    try {
      setLoading(true);
      const response = await billingAPI.getMy();
      setBilling(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load billing information');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBilling();
  }, []);

  const togglePayments = (studentId) => {
    setExpandedPayments((prev) => ({
      ...prev,
      [studentId]: !prev[studentId],
    }));
  };

  const toggleCharges = (studentId) => {
    setExpandedCharges((prev) => ({
      ...prev,
      [studentId]: !prev[studentId],
    }));
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
      <Typography variant="h5" sx={{ mb: 3 }}>My Dues</Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {billing && (
        <>
          {/* Total Outstanding Banner */}
          <Paper
            sx={{
              p: 3,
              mb: 3,
              textAlign: 'center',
              bgcolor: billing.totalOutstanding > 0 ? '#FFF3E0' : '#E8F5E9',
            }}
          >
            <Typography variant="body1" color="text.secondary">
              Total Outstanding Balance
            </Typography>
            <Typography
              variant="h3"
              fontWeight={700}
              color={billing.totalOutstanding > 0 ? 'warning.dark' : 'success.dark'}
            >
              ${billing.totalOutstanding.toFixed(2)}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Total Paid: ${billing.totalPaid.toFixed(2)}
            </Typography>
          </Paper>

          {billing.children.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary">
                No billing information found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Billing information will appear here once attendance is marked.
              </Typography>
            </Paper>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {billing.children.map((child) => (
                <Card key={child.studentId} variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Typography variant="h6" fontWeight={600}>
                        {child.studentName}
                      </Typography>
                      <Chip
                        label={child.outstandingBalance > 0
                          ? `$${child.outstandingBalance.toFixed(2)} due`
                          : 'Paid up'}
                        color={child.outstandingBalance > 0 ? 'warning' : 'success'}
                        size="small"
                      />
                    </Box>

                    {/* Package Progress */}
                    {child.packages.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        {child.packages.map((pkg) => {
                          const progress = pkg.sessionCount > 0
                            ? Math.min((pkg.sessionsAttended / pkg.sessionCount) * 100, 100)
                            : 0;
                          return (
                            <Box key={pkg.id} sx={{ mb: 1.5 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                <Typography variant="body2" fontWeight={500}>
                                  {pkg.classTypeName} - {pkg.packageName} ({pkg.billingPeriod})
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  ${pkg.proratedAmount.toFixed(2)} of ${pkg.packagePrice.toFixed(2)}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <LinearProgress
                                  variant="determinate"
                                  value={progress}
                                  sx={{ flex: 1, height: 8, borderRadius: 4 }}
                                  color={pkg.isOverage ? 'warning' : 'primary'}
                                />
                                <Typography variant="caption" color="text.secondary" sx={{ minWidth: 70, textAlign: 'right' }}>
                                  {pkg.sessionsAttended}/{pkg.sessionCount} attended
                                </Typography>
                              </Box>
                              {pkg.isOverage && (
                                <Typography variant="caption" color="warning.main">
                                  Extra sessions charged at default rate
                                </Typography>
                              )}
                            </Box>
                          );
                        })}
                      </Box>
                    )}

                    {/* Balance Summary */}
                    <Box sx={{ display: 'flex', gap: 3, mb: 1 }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Total Dues</Typography>
                        <Typography variant="body2" fontWeight={500}>${child.totalDues.toFixed(2)}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Paid</Typography>
                        <Typography variant="body2" fontWeight={500}>${child.totalPayments.toFixed(2)}</Typography>
                      </Box>
                      {child.totalDiscounts > 0 && (
                        <Box>
                          <Typography variant="caption" color="text.secondary">Discounts</Typography>
                          <Typography variant="body2" fontWeight={500}>${child.totalDiscounts.toFixed(2)}</Typography>
                        </Box>
                      )}
                    </Box>

                    {/* Session Charges (Collapsible) */}
                    {child.sessionCharges && child.sessionCharges.length > 0 && (
                      <>
                        <Divider sx={{ my: 1 }} />
                        <Box
                          sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                          onClick={() => toggleCharges(child.studentId)}
                        >
                          <Typography variant="subtitle2">
                            Session Charges ({child.sessionCharges.length})
                          </Typography>
                          <IconButton size="small">
                            {expandedCharges[child.studentId] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          </IconButton>
                        </Box>
                        <Collapse in={expandedCharges[child.studentId]}>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell sx={{ pl: 0 }}>Date</TableCell>
                                <TableCell>Class</TableCell>
                                <TableCell>Source</TableCell>
                                <TableCell align="right">Charge</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {child.sessionCharges.map((sc, idx) => (
                                <TableRow key={idx}>
                                  <TableCell sx={{ pl: 0 }}>
                                    {formatDate(sc.sessionDate)}
                                  </TableCell>
                                  <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                      <Box
                                        sx={{
                                          width: 8,
                                          height: 8,
                                          borderRadius: '50%',
                                          bgcolor: sc.classTypeColor,
                                        }}
                                      />
                                      {sc.classTypeName}
                                    </Box>
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="caption" color="text.secondary">
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
                        </Collapse>
                      </>
                    )}

                    {/* Payment History (Collapsible) */}
                    {child.recentPayments.length > 0 && (
                      <>
                        <Divider sx={{ my: 1 }} />
                        <Box
                          sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                          onClick={() => togglePayments(child.studentId)}
                        >
                          <Typography variant="subtitle2">
                            Payment History ({child.recentPayments.length})
                          </Typography>
                          <IconButton size="small">
                            {expandedPayments[child.studentId] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          </IconButton>
                        </Box>
                        <Collapse in={expandedPayments[child.studentId]}>
                          <Table size="small">
                            <TableBody>
                              {child.recentPayments.map((payment) => (
                                <TableRow key={payment.id}>
                                  <TableCell sx={{ pl: 0 }}>
                                    {formatDate(payment.paymentDate)}
                                  </TableCell>
                                  <TableCell align="right">
                                    ${payment.amount.toFixed(2)}
                                    {payment.discount > 0 && (
                                      <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                                        (+${payment.discount.toFixed(2)} disc.)
                                      </Typography>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {payment.notes && (
                                      <Typography variant="caption" color="text.secondary">
                                        {payment.notes}
                                      </Typography>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </Collapse>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </>
      )}
    </Box>
  );
}
