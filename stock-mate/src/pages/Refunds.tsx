import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider,
  CircularProgress,
} from '@mui/material';
import dayjs, { Dayjs } from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import CustomTable from '../components/CustomTable';
import CustomSearchFilter from '../components/CustomSearchFilter';
import type { SearchOption, Column } from '../utils/types';
import { refundService } from '../services/refundService';
import type { Refund } from '../services/refundService';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

interface DateRange {
  start: Dayjs | null;
  end: Dayjs | null;
}

interface RefundAmountRange {
  min: number | null;
  max: number | null;
}

const Refunds = () => {
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [filteredRefunds, setFilteredRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState<Refund | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loadingRefund, setLoadingRefund] = useState(false);
  const [searchKey, setSearchKey] = useState<string>('id');
  const [searchValue, setSearchValue] = useState<
    string | Dayjs | null | DateRange | RefundAmountRange
  >('');
  const [dateFilter, setDateFilter] = useState<string>('all'); // 'all', 'today', 'thisMonth', 'previousMonth'

  // Search options
  const searchOptions: SearchOption[] = useMemo(
    () => [
      { label: 'By Invoice ID', value: 'invoiceId', type: 'text' },
      { label: 'By Refund ID', value: 'id', type: 'text' },
      { label: 'By Customer', value: 'customer', type: 'text' },
      { label: 'By Refund Amount', value: 'refundAmount', type: 'balanceRange' },
      { label: 'By Invoice Total', value: 'invoiceTotal', type: 'balanceRange' },
      { label: 'By Date', value: 'date', type: 'dateRange' },
    ],
    [],
  );

  // Fetch all refunds
  const fetchRefunds = async () => {
    try {
      setLoading(true);
      const data = await refundService.findAll();
      setRefunds(data);
      setFilteredRefunds(data);
    } catch (err) {
      console.error('Error fetching refunds:', err);
      alert('Failed to fetch refunds');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRefunds();
  }, []);

  // Filter refunds based on search
  useEffect(() => {
    let filtered = [...refunds];

    // Apply date filter first (predefined date filters)
    if (dateFilter !== 'all') {
      const today = dayjs();
      filtered = filtered.filter((refund) => {
        if (!refund.createdAt) return false;
        const refundDate = dayjs(refund.createdAt);

        switch (dateFilter) {
          case 'today':
            return refundDate.isSame(today, 'day');
          case 'thisMonth':
            return refundDate.isSame(today, 'month') && refundDate.isSame(today, 'year');
          case 'previousMonth': {
            const previousMonth = today.subtract(1, 'month');
            return (
              refundDate.isSame(previousMonth, 'month') && refundDate.isSame(previousMonth, 'year')
            );
          }
          default:
            return true;
        }
      });
    }

    // Get the selected search option to check its type
    const selectedOption = searchOptions.find((opt) => opt.value === searchKey);
    const isDateRange = selectedOption?.type === 'dateRange';
    const isRefundAmountRange =
      selectedOption?.type === 'balanceRange' && searchKey === 'refundAmount';
    const isInvoiceTotalRange =
      selectedOption?.type === 'balanceRange' && searchKey === 'invoiceTotal';

    if (isDateRange) {
      // Handle date range search
      const dateRange = searchValue as DateRange;
      if (
        dateRange &&
        typeof dateRange === 'object' &&
        'start' in dateRange &&
        'end' in dateRange &&
        (dateRange.start || dateRange.end)
      ) {
        filtered = filtered.filter((refund) => {
          if (!refund.createdAt) return false;
          const refundDate = dayjs(refund.createdAt);
          const startDate = dateRange.start;
          const endDate = dateRange.end || dayjs(); // Default to today if end date not selected

          if (startDate && endDate) {
            return (
              refundDate.isSameOrAfter(startDate, 'day') &&
              refundDate.isSameOrBefore(endDate, 'day')
            );
          } else if (startDate) {
            return refundDate.isSameOrAfter(startDate, 'day');
          } else if (endDate) {
            return refundDate.isSameOrBefore(endDate, 'day');
          }
          return true;
        });
      }
    } else if (isRefundAmountRange) {
      // Handle refund amount range search
      const amountRange = searchValue as RefundAmountRange;
      if (
        amountRange &&
        typeof amountRange === 'object' &&
        'min' in amountRange &&
        'max' in amountRange &&
        (amountRange.min !== null || amountRange.max !== null)
      ) {
        filtered = filtered.filter((refund) => {
          const refundAmount = Number(refund.totalRefundAmount || 0);
          const minAmount = amountRange.min;
          const maxAmount = amountRange.max;

          // If both min and max are selected
          if (minAmount !== null && maxAmount !== null) {
            return refundAmount >= minAmount && refundAmount <= maxAmount;
          }
          // If only min amount is selected
          else if (minAmount !== null) {
            return refundAmount >= minAmount;
          }
          // If only max amount is selected
          else if (maxAmount !== null) {
            return refundAmount <= maxAmount;
          }
          return true;
        });
      }
    } else if (isInvoiceTotalRange) {
      // Handle invoice total range search
      const amountRange = searchValue as RefundAmountRange;
      if (
        amountRange &&
        typeof amountRange === 'object' &&
        'min' in amountRange &&
        'max' in amountRange &&
        (amountRange.min !== null || amountRange.max !== null)
      ) {
        filtered = filtered.filter((refund) => {
          const invoiceTotal =
            typeof refund.invoice === 'object' && refund.invoice && 'total' in refund.invoice
              ? Number((refund.invoice as { total?: number }).total || 0)
              : 0;
          const minAmount = amountRange.min;
          const maxAmount = amountRange.max;

          // If both min and max are selected
          if (minAmount !== null && maxAmount !== null) {
            return invoiceTotal >= minAmount && invoiceTotal <= maxAmount;
          }
          // If only min amount is selected
          else if (minAmount !== null) {
            return invoiceTotal >= minAmount;
          }
          // If only max amount is selected
          else if (maxAmount !== null) {
            return invoiceTotal <= maxAmount;
          }
          return true;
        });
      }
    } else {
      // Handle text search
      if (typeof searchValue === 'string' && searchValue.trim()) {
        filtered = filtered.filter((refund) => {
          if (searchKey === 'customer') {
            const customerName =
              typeof refund.customer === 'object'
                ? refund.customer?.name
                : String(refund.customer || '');
            return customerName.toLowerCase().includes(searchValue.toLowerCase());
          }
          if (searchKey === 'invoiceId') {
            const invoiceId = typeof refund.invoice === 'object' ? refund.invoice?.id : null;
            return invoiceId ? String(invoiceId).includes(searchValue) : false;
          }
          const fieldValue = String(refund[searchKey as keyof Refund] || '').toLowerCase();
          return fieldValue.includes(searchValue.toLowerCase());
        });
      }
    }

    setFilteredRefunds(filtered);
  }, [searchValue, searchKey, refunds, searchOptions, dateFilter]);

  // Handle row click - fetch full refund details and show modal
  const handleRowClick = async (refund: Refund) => {
    try {
      setLoadingRefund(true);
      setModalOpen(true);
      const fullRefund = await refundService.findOne(refund.id);
      setSelectedRefund(fullRefund);
    } catch (err) {
      console.error('Error fetching refund details:', err);
      alert('Failed to fetch refund details');
      setModalOpen(false);
    } finally {
      setLoadingRefund(false);
    }
  };

  // Table columns
  const columns: Column<Refund>[] = [
    { key: 'id', label: 'Refund ID' },
    {
      key: 'invoice',
      label: 'Invoice ID',
      render: (row: Refund) => (typeof row.invoice === 'object' ? row.invoice.id : '-'),
    },
    {
      key: 'customer',
      label: 'Customer',
      render: (row: Refund) =>
        typeof row.customer === 'object' ? row.customer?.name : row.customer || '-',
    },
    {
      key: 'invoiceTotal',
      label: 'Invoice Total',
      render: (row: Refund) => {
        const invoiceTotal =
          typeof row.invoice === 'object' && row.invoice && 'total' in row.invoice
            ? Number((row.invoice as { total?: number }).total || 0)
            : 0;
        return `${invoiceTotal.toFixed(2)}`;
      },
    },
    {
      key: 'totalRefundAmount',
      label: 'Refund Amount',
      render: (row: Refund) => `${Number(row.totalRefundAmount || 0).toFixed(2)}`,
    },
    {
      key: 'createdAt',
      label: 'Date',
      render: (row: Refund) => (row.createdAt ? dayjs(row.createdAt).format('DD-MM-YYYY') : '-'),
    },
  ];

  return (
    <Box sx={{ p: 3, width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
      <Typography
        variant="h5"
        sx={{
          mb: 3,
          fontWeight: 'bold',
          color: '#1976d2',
        }}
      >
        Refund Records
      </Typography>

      <Box
        sx={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
        }}
      >
        {/* Date Filter Bar */}
        <Paper
          elevation={1}
          sx={{
            p: 0.25,
            mb: 2,
            borderRadius: 1.5,
            backgroundColor: '#f8f9fa',
            width: '100%',
            display: 'flex',
            border: '1px solid #e9ecef',
            overflow: 'hidden',
          }}
        >
          <Button
            onClick={() => setDateFilter('all')}
            sx={{
              flex: 1,
              py: 0.75,
              px: 2,
              minHeight: 36,
              borderRadius: 0,
              backgroundColor: dateFilter === 'all' ? '#1976d2' : 'transparent',
              color: dateFilter === 'all' ? '#fff' : '#495057',
              fontWeight: dateFilter === 'all' ? 700 : 600,
              fontSize: '0.875rem',
              textTransform: 'none',
              borderRight: '1px solid #dee2e6',
              transition: 'all 0.2s ease-in-out',
              boxShadow: dateFilter === 'all' ? 'inset 0 2px 4px rgba(0,0,0,0.1)' : 'none',
              '&:hover': {
                backgroundColor: dateFilter === 'all' ? '#1565c0' : '#e9ecef',
              },
              '&:first-of-type': {
                borderTopLeftRadius: 6,
                borderBottomLeftRadius: 6,
              },
            }}
          >
            All
          </Button>
          <Button
            onClick={() => setDateFilter('today')}
            sx={{
              flex: 1,
              py: 0.75,
              px: 2,
              minHeight: 36,
              borderRadius: 0,
              backgroundColor: dateFilter === 'today' ? '#1976d2' : 'transparent',
              color: dateFilter === 'today' ? '#fff' : '#495057',
              fontWeight: dateFilter === 'today' ? 700 : 600,
              fontSize: '0.875rem',
              textTransform: 'none',
              borderRight: '1px solid #dee2e6',
              transition: 'all 0.2s ease-in-out',
              boxShadow: dateFilter === 'today' ? 'inset 0 2px 4px rgba(0,0,0,0.1)' : 'none',
              '&:hover': {
                backgroundColor: dateFilter === 'today' ? '#1565c0' : '#e9ecef',
              },
            }}
          >
            Today
          </Button>
          <Button
            onClick={() => setDateFilter('thisMonth')}
            sx={{
              flex: 1,
              py: 0.75,
              px: 2,
              minHeight: 36,
              borderRadius: 0,
              backgroundColor: dateFilter === 'thisMonth' ? '#1976d2' : 'transparent',
              color: dateFilter === 'thisMonth' ? '#fff' : '#495057',
              fontWeight: dateFilter === 'thisMonth' ? 700 : 600,
              fontSize: '0.875rem',
              textTransform: 'none',
              borderRight: '1px solid #dee2e6',
              transition: 'all 0.2s ease-in-out',
              boxShadow: dateFilter === 'thisMonth' ? 'inset 0 2px 4px rgba(0,0,0,0.1)' : 'none',
              '&:hover': {
                backgroundColor: dateFilter === 'thisMonth' ? '#1565c0' : '#e9ecef',
              },
            }}
          >
            This Month
          </Button>
          <Button
            onClick={() => setDateFilter('previousMonth')}
            sx={{
              flex: 1,
              py: 0.75,
              px: 2,
              minHeight: 36,
              borderRadius: 0,
              backgroundColor: dateFilter === 'previousMonth' ? '#1976d2' : 'transparent',
              color: dateFilter === 'previousMonth' ? '#fff' : '#495057',
              fontWeight: dateFilter === 'previousMonth' ? 700 : 600,
              fontSize: '0.875rem',
              textTransform: 'none',
              transition: 'all 0.2s ease-in-out',
              boxShadow:
                dateFilter === 'previousMonth' ? 'inset 0 2px 4px rgba(0,0,0,0.1)' : 'none',
              '&:hover': {
                backgroundColor: dateFilter === 'previousMonth' ? '#1565c0' : '#e9ecef',
              },
              '&:last-of-type': {
                borderTopRightRadius: 6,
                borderBottomRightRadius: 6,
              },
            }}
          >
            Previous Month
          </Button>
        </Paper>

        {/* Search Filter */}
        <CustomSearchFilter
          searchKey={searchKey}
          searchValue={searchValue}
          options={searchOptions}
          onKeyChange={setSearchKey}
          onValueChange={setSearchValue}
        />

        {/* Table */}
        <CustomTable
          columns={columns as unknown as Column[]}
          rows={filteredRefunds as unknown as Record<string, unknown>[]}
          onRowClick={(row) => {
            const refund = filteredRefunds.find((r) => r.id === (row as unknown as Refund).id);
            if (refund) handleRowClick(refund);
          }}
          loading={loading}
        />
      </Box>

      {/* View Refund Modal */}
      <Dialog
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedRefund(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
            Refund Details
          </Typography>
        </DialogTitle>
        <DialogContent>
          {loadingRefund ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : selectedRefund ? (
            <Box sx={{ mt: 2 }}>
              {/* Basic Information */}
              <Box>
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 'bold', mb: 1, color: '#1976d2' }}
                >
                  Basic Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                  <Box sx={{ flex: '1 1 calc(33.33% - 16px)', minWidth: '150px' }}>
                    <Typography variant="caption" color="text.secondary">
                      Refund ID
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      #{selectedRefund.id}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: '1 1 calc(33.33% - 16px)', minWidth: '150px' }}>
                    <Typography variant="caption" color="text.secondary">
                      Invoice Number
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      {typeof selectedRefund.invoice === 'object'
                        ? selectedRefund.invoice?.invoiceNumber
                        : '-'}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: '1 1 calc(33.33% - 16px)', minWidth: '150px' }}>
                    <Typography variant="caption" color="text.secondary">
                      Date
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      {selectedRefund.createdAt
                        ? dayjs(selectedRefund.createdAt).format('DD-MM-YYYY HH:mm')
                        : '-'}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Customer Information */}
              <Box sx={{ mt: 3 }}>
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 'bold', mb: 1, color: '#1976d2' }}
                >
                  Customer Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                  {selectedRefund.customer && typeof selectedRefund.customer === 'object' && (
                    <>
                      <Box sx={{ flex: '1 1 calc(33.33% - 16px)', minWidth: '150px' }}>
                        <Typography variant="caption" color="text.secondary">
                          Name
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {selectedRefund.customer.name}
                        </Typography>
                      </Box>
                      <Box sx={{ flex: '1 1 calc(33.33% - 16px)', minWidth: '150px' }}>
                        <Typography variant="caption" color="text.secondary">
                          Phone
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {selectedRefund.customer.phone}
                        </Typography>
                      </Box>
                      {selectedRefund.customer.email && (
                        <Box sx={{ flex: '1 1 calc(33.33% - 16px)', minWidth: '150px' }}>
                          <Typography variant="caption" color="text.secondary">
                            Email
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {selectedRefund.customer.email}
                          </Typography>
                        </Box>
                      )}
                    </>
                  )}
                </Box>
              </Box>

              {/* Warehouse Information */}
              {selectedRefund.warehouse && typeof selectedRefund.warehouse === 'object' && (
                <Box sx={{ mt: 3 }}>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 'bold', mb: 1, color: '#1976d2' }}
                  >
                    Warehouse Information
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                    <Box sx={{ flex: '1 1 calc(33.33% - 16px)', minWidth: '150px' }}>
                      <Typography variant="caption" color="text.secondary">
                        Name
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {selectedRefund.warehouse.name}
                      </Typography>
                    </Box>
                    <Box sx={{ flex: '1 1 calc(33.33% - 16px)', minWidth: '150px' }}>
                      <Typography variant="caption" color="text.secondary">
                        Location
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {selectedRefund.warehouse.location}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              )}

              {/* Financial Information */}
              <Box sx={{ mt: 3 }}>
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 'bold', mb: 1, color: '#1976d2' }}
                >
                  Financial Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                  <Box sx={{ flex: '1 1 calc(33.33% - 16px)', minWidth: '150px' }}>
                    <Typography variant="caption" color="text.secondary">
                      Total Refund Amount
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#d32f2f' }}>
                      {Number(selectedRefund.totalRefundAmount || 0).toFixed(2)}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Refund Items */}
              {selectedRefund.items && selectedRefund.items.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 'bold', mb: 1, color: '#1976d2' }}
                  >
                    Refund Items
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Paper variant="outlined" sx={{ p: 2, backgroundColor: '#fafafa' }}>
                    <Box sx={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
                            <th
                              style={{
                                textAlign: 'left',
                                padding: '8px',
                                fontSize: '0.875rem',
                                fontWeight: 'bold',
                              }}
                            >
                              Product
                            </th>
                            <th
                              style={{
                                textAlign: 'right',
                                padding: '8px',
                                fontSize: '0.875rem',
                                fontWeight: 'bold',
                              }}
                            >
                              Original Qty
                            </th>
                            <th
                              style={{
                                textAlign: 'right',
                                padding: '8px',
                                fontSize: '0.875rem',
                                fontWeight: 'bold',
                              }}
                            >
                              Refund Qty
                            </th>
                            <th
                              style={{
                                textAlign: 'center',
                                padding: '8px',
                                fontSize: '0.875rem',
                                fontWeight: 'bold',
                              }}
                            >
                              Unit
                            </th>
                            <th
                              style={{
                                textAlign: 'right',
                                padding: '8px',
                                fontSize: '0.875rem',
                                fontWeight: 'bold',
                              }}
                            >
                              Unit Price
                            </th>
                            <th
                              style={{
                                textAlign: 'right',
                                padding: '8px',
                                fontSize: '0.875rem',
                                fontWeight: 'bold',
                              }}
                            >
                              Refund Amount
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedRefund.items.map((item, idx) => {
                            const productName =
                              typeof item.product === 'object'
                                ? item.product?.name || 'N/A'
                                : 'N/A';
                            return (
                              <tr key={idx} style={{ borderBottom: '1px solid #e0e0e0' }}>
                                <td style={{ padding: '8px' }}>{productName}</td>
                                <td style={{ padding: '8px', textAlign: 'right' }}>
                                  {item.originalQuantity}
                                </td>
                                <td style={{ padding: '8px', textAlign: 'right' }}>
                                  {item.refundQuantity}
                                </td>
                                <td style={{ padding: '8px', textAlign: 'center' }}>
                                  {item.unit || '-'}
                                </td>
                                <td style={{ padding: '8px', textAlign: 'right' }}>
                                  {Number(item.unitPrice).toFixed(2)}
                                </td>
                                <td
                                  style={{
                                    padding: '8px',
                                    textAlign: 'right',
                                    fontWeight: 'bold',
                                    color: '#d32f2f',
                                  }}
                                >
                                  {Number(item.refundAmount).toFixed(2)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </Box>
                  </Paper>
                </Box>
              )}

              {/* Reason */}
              {selectedRefund.reason && (
                <Box sx={{ mt: 3 }}>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 'bold', mb: 1, color: '#1976d2' }}
                  >
                    Reason
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Paper variant="outlined" sx={{ p: 2, backgroundColor: '#fafafa' }}>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {selectedRefund.reason}
                    </Typography>
                  </Paper>
                </Box>
              )}
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setModalOpen(false);
              setSelectedRefund(null);
            }}
            color="primary"
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Refunds;
