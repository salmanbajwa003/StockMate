import { Box, Typography } from '@mui/material';
import CustomForm from '../components/CustomForm';
import CustomTable from '../components/CustomTable';
import CustomSearchFilter from '../components/CustomSearchFilter';
import { useState, useEffect } from 'react';
import axios from 'axios';
import type { SearchOption, Invoice, Customer, Warehouse, Column } from '../utils/types';
import { API_ENDPOINTS } from '../utils/constants';

const Invoices = () => {
  const [rows, setRows] = useState<Invoice[]>([]);
  const [filteredRows, setFilteredRows] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchKey, setSearchKey] = useState<string>('invoiceNumber');
  const [searchValue, setSearchValue] = useState<string>('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  // Fetch invoices, customers, and warehouses
  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await axios.get<Invoice[]>(API_ENDPOINTS.INVOICES);
      setRows(res.data);
      setFilteredRows(res.data);
    } catch (err) {
      console.error('Error fetching invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await axios.get<Customer[]>(API_ENDPOINTS.CUSTOMERS);
      setCustomers(res.data);
    } catch (err) {
      console.error('Error fetching customers:', err);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const res = await axios.get<Warehouse[]>(API_ENDPOINTS.WAREHOUSES);
      setWarehouses(res.data);
    } catch (err) {
      console.error('Error fetching warehouses:', err);
    }
  };

  useEffect(() => {
    fetchInvoices();
    fetchCustomers();
    fetchWarehouses();
  }, []);

  // Search options based on backend fields
  const searchOptions: SearchOption[] = [
    { label: 'By Invoice Number', value: 'invoiceNumber' },
    { label: 'By ID', value: 'id' },
    { label: 'By Status', value: 'status' },
  ];

  // Filter invoices based on search
  useEffect(() => {
    if (!searchValue.trim()) {
      setFilteredRows(rows);
      return;
    }

    const filtered = rows.filter((invoice) => {
      const fieldValue = String(invoice[searchKey as keyof Invoice] || '').toLowerCase();
      return fieldValue.includes(searchValue.toLowerCase());
    });

    setFilteredRows(filtered);
  }, [searchValue, searchKey, rows]);

  const handleAddOrUpdate = async (data: Record<string, string | number>) => {
    try {
      const payload = {
        invoiceNumber: String(data.invoiceNumber),
        customerId: Number(data.customerId),
        warehouseId: Number(data.warehouseId),
        invoiceDate: data.invoiceDate ? String(data.invoiceDate) : undefined,
        dueDate: data.dueDate ? String(data.dueDate) : undefined,
        status: data.status || 'draft',
        taxRate: data.taxRate ? Number(data.taxRate) : 0,
        discount: data.discount ? Number(data.discount) : 0,
        notes: data.notes ? String(data.notes) : undefined,
        items: [], // TODO: Add invoice items support
      };

      if (selectedInvoice) {
        await axios.patch(`${API_ENDPOINTS.INVOICES}/${selectedInvoice.id}`, payload);
      } else {
        await axios.post(API_ENDPOINTS.INVOICES, payload);
      }
      await fetchInvoices();
      setSelectedInvoice(null);
    } catch (err) {
      console.error('Error saving invoice:', err);
    }
  };

  const handleRowClick = (row: Invoice) => {
    setSelectedInvoice(row);
  };

  const handleCancel = () => {
    setSelectedInvoice(null);
  };

  const columns: Column<Invoice>[] = [
    { key: 'id', label: 'ID' },
    { key: 'invoiceNumber', label: 'Invoice #' },
    { key: 'customer', label: 'Customer' },
    { key: 'warehouse', label: 'Warehouse' },
    { key: 'invoiceDate', label: 'Date' },
    { key: 'status', label: 'Status' },
    { key: 'subtotal', label: 'Subtotal' },
    { key: 'total', label: 'Total' },
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
        Manage Invoices
      </Typography>

      <Box sx={{ display: 'flex', gap: 3, width: '100%', flexDirection: { xs: 'column', md: 'row' } }}>
        {/* Left Side - Form (30%) */}
        <Box sx={{ width: { xs: '100%', md: '30%' }, flexShrink: 0 }}>
          <CustomForm
            title="Invoice Details"
            fields={[
              { key: 'invoiceNumber', label: 'Invoice Number', required: true },
              {
                key: 'customerId',
                label: 'Customer',
                type: 'select',
                required: true,
                options: customers.map((customer) => ({ id: customer.id, name: customer.name })),
              },
              {
                key: 'warehouseId',
                label: 'Warehouse',
                type: 'select',
                required: true,
                options: warehouses.map((warehouse) => ({ id: warehouse.id, name: warehouse.name })),
              },
              { key: 'invoiceDate', label: 'Invoice Date', type: 'date', required: false },
              { key: 'dueDate', label: 'Due Date', type: 'date', required: false },
              {
                key: 'status',
                label: 'Status',
                type: 'select',
                required: false,
                options: ['draft', 'pending', 'paid', 'cancelled'],
              },
              { key: 'taxRate', label: 'Tax Rate (%)', type: 'number', required: false },
              { key: 'discount', label: 'Discount', type: 'number', required: false },
              { key: 'notes', label: 'Notes', required: false },
            ]}
            onSubmit={handleAddOrUpdate}
            initialData={
              selectedInvoice
                ? {
                    invoiceNumber: selectedInvoice.invoiceNumber,
                    customerId:
                      typeof selectedInvoice.customer === 'object' && selectedInvoice.customer?.id
                        ? selectedInvoice.customer.id
                        : '',
                    warehouseId:
                      typeof selectedInvoice.warehouse === 'object' && selectedInvoice.warehouse?.id
                        ? selectedInvoice.warehouse.id
                        : '',
                    invoiceDate: selectedInvoice.invoiceDate,
                    dueDate: selectedInvoice.dueDate || '',
                    status: selectedInvoice.status || 'draft',
                    taxRate: selectedInvoice.taxRate || 0,
                    discount: selectedInvoice.discount || 0,
                    notes: selectedInvoice.notes || '',
                  }
                : null
            }
            onCancel={handleCancel}
          />
        </Box>

        {/* Right Side - Table (70%) */}
        <Box sx={{ width: { xs: '100%', md: '70%' }, display: 'flex', flexDirection: 'column', flex: 1 }}>
          {/* Search Filter */}
          <CustomSearchFilter
            searchKey={searchKey}
            searchValue={searchValue}
            options={searchOptions}
            onKeyChange={setSearchKey}
            onValueChange={setSearchValue}
          />

          {/* Table */}
          <CustomTable<Invoice> columns={columns} rows={filteredRows} onRowClick={handleRowClick} loading={loading} />
        </Box>
      </Box>
    </Box>
  );
};

export default Invoices;
