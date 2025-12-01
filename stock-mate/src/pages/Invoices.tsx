import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  MenuItem,
  IconButton,
  Chip,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import axios from 'axios';
import dayjs from 'dayjs';
import CustomForm from '../components/CustomForm';
import CustomTable from '../components/CustomTable';
import CustomSearchFilter from '../components/CustomSearchFilter';
import type { SearchOption, Column } from '../utils/types';
import { API_ENDPOINTS } from '../utils/constants';
import { invoiceService } from '../services/invoiceService';
import type { Invoice } from '../services/invoiceService';
import { productService } from '../services/productService';
import type { Product } from '../utils/types';
import { customerService } from '../services/customerService';
import type { Customer } from '../services/customerService';
import { warehouseService } from '../services/warehouseService';
import type { Warehouse } from '../services/warehouseService';

const API_URL = API_ENDPOINTS.INVOICES;

interface InvoiceItemForm {
  warehouseId: string;
  productId: string;
  quantity: string;
  unit: string;
  unitPrice: string;
}

const Invoices = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [searchKey, setSearchKey] = useState<string>('invoiceNumber');
  const [searchValue, setSearchValue] = useState<string>('');
  const [totalAmount, setTotalAmount] = useState<string>('0.00');

  // Form state for invoice items (not handled by CustomForm)
  const [items, setItems] = useState<InvoiceItemForm[]>([
    { warehouseId: '', productId: '', quantity: '', unit: '', unitPrice: '' },
  ]);

  // Search options
  const searchOptions: SearchOption[] = [
    { label: 'By Invoice Number', value: 'invoiceNumber' },
    { label: 'By Customer', value: 'customerName' },
    { label: 'By Warehouse', value: 'warehouseName' },
    { label: 'By Status', value: 'status' },
  ];

  // Fetch all data
  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await axios.get<Invoice[]>(API_URL);
      setInvoices(res.data);
      setFilteredInvoices(res.data);
    } catch (err) {
      console.error('Error fetching invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdowns = async () => {
    try {
      const [productsData, customersData, warehousesData] = await Promise.all([
        productService.findAll(),
        customerService.findAll(),
        warehouseService.findAll(),
      ]);
      setProducts(productsData);
      setCustomers(customersData);
      setWarehouses(warehousesData);
    } catch (err) {
      console.error('Error fetching dropdown data:', err);
    }
  };

  useEffect(() => {
    fetchInvoices();
    fetchDropdowns();
  }, []);

  // Filter invoices based on search
  useEffect(() => {
    if (!searchValue.trim()) {
      setFilteredInvoices(invoices);
      return;
    }

    const filtered = invoices.filter((invoice) => {
      let fieldValue = '';
      if (searchKey === 'customerName') {
        fieldValue = invoice.customer?.name || '';
      } else if (searchKey === 'warehouseName') {
        fieldValue = invoice.warehouse?.name || '';
      } else if (searchKey === 'status') {
        fieldValue = invoice.status || '';
      } else {
        fieldValue = String(invoice[searchKey as keyof Invoice] || '').toLowerCase();
      }
      return fieldValue.toLowerCase().includes(searchValue.toLowerCase());
    });

    setFilteredInvoices(filtered);
  }, [searchValue, searchKey, invoices]);

  // Get product warehouse unit
  const getProductWarehouseUnit = (productId: string, itemWarehouseId: string): string | null => {
    if (!productId || !itemWarehouseId) return null;
    const product = products.find((p) => p.id === Number(productId));
    if (!product) return null;
    const productWarehouse = product.productWarehouses?.find(
      (pw) => pw.warehouse?.id === Number(itemWarehouseId),
    );
    return productWarehouse?.unit || null;
  };

  // Get available quantity for a product in a warehouse
  const getAvailableQuantity = (productId: string, itemWarehouseId: string): number => {
    if (!productId || !itemWarehouseId) return 0;
    const product = products.find((p) => p.id === Number(productId));

    if (!product) return 0;
    const productWarehouse = product.productWarehouses?.find(
      (pw) => pw.warehouse?.id === Number(itemWarehouseId),
    );
    return productWarehouse?.quantity ? Number(productWarehouse.quantity) : 0;
  };

  // Calculate item total
  const calculateItemTotal = (quantity: string, unitPrice: string): number => {
    const qty = Number(quantity) || 0;
    const price = Number(unitPrice) || 0;
    return qty * price;
  };

  // Handle invoice item changes
  const handleItemChange = (index: number, field: keyof InvoiceItemForm, value: string) => {
    const newItems = [...items];
    const currentItem = newItems[index];

    // If warehouse is changed, reset product and unit
    if (field === 'warehouseId') {
      newItems[index] = {
        ...currentItem,
        warehouseId: value,
        productId: '',
        unit: '',
        quantity: '',
      };
    }
    // If product is changed, auto-set the unit to match product warehouse unit
    else if (field === 'productId' && value && currentItem.warehouseId) {
      const productUnit = getProductWarehouseUnit(value, currentItem.warehouseId);
      if (productUnit) {
        newItems[index] = { ...currentItem, [field]: value, unit: productUnit };
      } else {
        newItems[index] = { ...currentItem, [field]: value };
      }
    } else {
      newItems[index] = { ...currentItem, [field]: value };
    }

    setItems(newItems);

    // Calculate total amount for all items
    calculateTotalAmount(newItems);
  };

  // Calculate total amount for all invoice items
  const calculateTotalAmount = (itemsList: InvoiceItemForm[]) => {
    const total = itemsList.reduce((sum, item) => {
      const itemTotal = calculateItemTotal(item.quantity, item.unitPrice);
      return sum + itemTotal;
    }, 0);
    setTotalAmount(total.toFixed(2));
  };

  const handleAddItem = () => {
    const newItems = [
      ...items,
      { warehouseId: '', productId: '', quantity: '', unit: '', unitPrice: '' },
    ];
    setItems(newItems);
    calculateTotalAmount(newItems);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    calculateTotalAmount(newItems);
  };

  // Handle form submission (from CustomForm + items)
  const handleAddOrUpdate = async (formData: Record<string, string | number>) => {
    try {
      setSaving(true);

      // If updating, only send paidAmount and notes
      if (selectedInvoice) {
        const updateData = {
          paidAmount: formData.paidAmount ? Number(formData.paidAmount) : 0,
          notes: formData.notes ? String(formData.notes) : undefined,
        };
        await invoiceService.update(selectedInvoice.id, updateData);
        await fetchInvoices();
        resetForm();
        return;
      }

      // For new invoice, validate items
      if (
        items.length === 0 ||
        items.some(
          (item) =>
            !item.warehouseId || !item.productId || !item.quantity || !item.unit || !item.unitPrice,
        )
      ) {
        alert('Please add at least one item with all fields filled (including warehouse)');
        return;
      }

      // Validate quantities don't exceed available stock
      for (const item of items) {
        const availableQty = getAvailableQuantity(item.productId, item.warehouseId);
        const requestedQty = Number(item.quantity);
        const product = products.find((p) => p.id === Number(item.productId));

        if (requestedQty > availableQty) {
          alert(
            `Quantity exceeds available stock for ${product?.name || 'product'}. Available: ${availableQty}, Requested: ${requestedQty}`,
          );
          return;
        }
      }

      // Use the warehouse from the first item (assuming all items use the same warehouse)
      // Or you could validate that all items use the same warehouse
      const firstItemWarehouseId = items[0]?.warehouseId;
      if (!firstItemWarehouseId) {
        alert('Please select a warehouse for at least one item');
        return;
      }

      const invoiceData = {
        invoiceNumber: String(formData.invoiceNumber),
        customerId: Number(formData.customerId),
        warehouseId: Number(firstItemWarehouseId),
        paidAmount: formData.paidAmount ? Number(formData.paidAmount) : 0,
        notes: formData.notes ? String(formData.notes) : undefined,
        items: items.map((item) => ({
          productId: Number(item.productId),
          quantity: Number(item.quantity),
          unit: item.unit,
          unitPrice: Number(item.unitPrice),
        })),
      };

      await invoiceService.create(invoiceData);
      await fetchInvoices();
      resetForm();
    } catch (err: unknown) {
      console.error('Error saving invoice:', err);
      let errorMessage = 'Failed to save invoice';
      if (err && typeof err === 'object') {
        if (
          'response' in err &&
          err.response &&
          typeof err.response === 'object' &&
          'data' in err.response
        ) {
          const responseData = err.response.data;
          if (responseData && typeof responseData === 'object' && 'message' in responseData) {
            errorMessage = String(responseData.message);
          }
        } else if ('message' in err) {
          errorMessage = String(err.message);
        }
      }
      alert(`Error: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  // Handle row click
  const handleRowClick = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    const invoiceWarehouseId = invoice.warehouse?.id?.toString() || '';
    const invoiceItems = invoice.items?.map((item) => {
      const qty = item.quantity?.toString() || '0';
      const price = item.unitPrice?.toString() || '0';
      return {
        warehouseId: invoiceWarehouseId, // Use invoice warehouse for all items
        productId: item.product?.id?.toString() || '',
        quantity: qty,
        unit: item.unit || '',
        unitPrice: price,
      };
    }) || [{ warehouseId: '', productId: '', quantity: '', unit: '', unitPrice: '' }];
    setItems(invoiceItems);
    calculateTotalAmount(invoiceItems);
  };

  // Cancel edit
  const handleCancel = () => {
    resetForm();
  };

  const resetForm = () => {
    setSelectedInvoice(null);
    const emptyItems = [{ warehouseId: '', productId: '', quantity: '', unit: '', unitPrice: '' }];
    setItems(emptyItems);
    setTotalAmount('0.00');
  };

  // Get available products for a specific warehouse
  const getAvailableProducts = (warehouseId: string) => {
    if (!warehouseId) return [];
    return products.filter((product) =>
      product.productWarehouses?.some((pw) => pw.warehouse?.id === Number(warehouseId)),
    );
  };

  // Table columns
  const columns: Column<Invoice>[] = [
    { key: 'invoiceNumber', label: 'Invoice #' },
    {
      key: 'customer',
      label: 'Customer',
      render: (row: Invoice) =>
        typeof row.customer === 'object' ? row.customer?.name : row.customer || '-',
    },
    {
      key: 'warehouse',
      label: 'Warehouse',
      render: (row: Invoice) =>
        typeof row.warehouse === 'object' ? row.warehouse?.name : row.warehouse || '-',
    },
    {
      key: 'total',
      label: 'Total',
      render: (row: Invoice) => `$${Number(row.total || 0).toFixed(2)}`,
    },
    {
      key: 'paidAmount',
      label: 'Paid',
      render: (row: Invoice) => `$${Number(row.paidAmount || 0).toFixed(2)}`,
    },
    {
      key: 'remainingAmount',
      label: 'Remaining',
      render: (row: Invoice) => {
        const remaining = Number(row.total || 0) - Number(row.paidAmount || 0);
        return `$${remaining.toFixed(2)}`;
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (row: Invoice) => {
        const status = row.status || 'pending';
        const color = status === 'paid' ? 'success' : 'warning';
        return (
          <Chip
            label={status.charAt(0).toUpperCase() + status.slice(1)}
            color={color}
            size="small"
          />
        );
      },
    },
    {
      key: 'invoiceDate',
      label: 'Date',
      render: (row: Invoice) => {
        if (row.invoiceDate) {
          return dayjs(row.invoiceDate).format('DD-MM-YYYY');
        }
        return '-';
      },
    },
  ];

  // Form fields for CustomForm - show all fields for both create and update
  const formFields = [
    { key: 'invoiceNumber', label: 'Invoice Number', required: true },
    {
      key: 'customerId',
      label: 'Customer',
      type: 'select',
      required: true,
      options: customers.map((customer) => ({ id: customer.id, name: customer.name })),
    },
    { key: 'paidAmount', label: 'Paid Amount', type: 'number', required: false },
    { key: 'notes', label: 'Notes', required: false },
  ];

  return (
    <Box sx={{ p: 3, width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', color: '#1976d2' }}>
        Manage Invoices
      </Typography>

      <Box
        sx={{ display: 'flex', gap: 3, width: '100%', flexDirection: { xs: 'column', md: 'row' } }}
      >
        {/* Left Side - Form (30%) */}
        <Box sx={{ width: { xs: '100%', md: '30%' }, flexShrink: 0 }}>
          <CustomForm
            title="Invoice Details"
            fields={formFields}
            onSubmit={handleAddOrUpdate}
            initialData={
              selectedInvoice
                ? {
                    invoiceNumber: selectedInvoice.invoiceNumber,
                    customerId:
                      typeof selectedInvoice.customer === 'object'
                        ? selectedInvoice.customer?.id
                        : '',
                    paidAmount: selectedInvoice.paidAmount || 0,
                    notes: selectedInvoice.notes || '',
                  }
                : null
            }
            onCancel={handleCancel}
            loading={saving}
          />

          {/* Total Amount Display */}
          <Paper
            elevation={2}
            sx={{
              p: 2,
              mt: 2,
              mb: 2,
              borderRadius: 1,
              backgroundColor: '#f5f5f5',
              width: '100%',
              boxSizing: 'border-box',
            }}
          >
            <TextField
              label="Total Amount"
              value={
                selectedInvoice
                  ? `$${Number(selectedInvoice.total || 0).toFixed(2)}`
                  : `$${totalAmount}`
              }
              disabled
              size="small"
              fullWidth
              sx={{
                '& .MuiInputBase-input': {
                  fontWeight: 'bold',
                  fontSize: '1.1rem',
                  color: '#1976d2',
                },
              }}
              helperText={
                selectedInvoice
                  ? 'Total from invoice items (not editable)'
                  : 'Auto-calculated from invoice items (Price Per Unit × Quantity)'
              }
            />
          </Paper>

          {/* Invoice Items Section - Only show for new invoices */}
          {!selectedInvoice && (
            <Paper
              elevation={2}
              sx={{
                p: 2,
                mt: 2,
                borderRadius: 1,
                backgroundColor: '#fafafa',
                width: '100%',
                boxSizing: 'border-box',
              }}
            >
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: '#1976d2' }}>
                Invoice Items
              </Typography>
              {items.map((item, index) => {
                const availableProductsForItem = getAvailableProducts(item.warehouseId);
                return (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 1,
                      mb: 2,
                      p: 2,
                      border: '1px solid #e0e0e0',
                      borderRadius: 1,
                      backgroundColor: '#ffffff',
                    }}
                  >
                    <TextField
                      select
                      label="Warehouse"
                      value={item.warehouseId}
                      onChange={(e) => handleItemChange(index, 'warehouseId', e.target.value)}
                      required
                      size="small"
                      fullWidth
                      disabled={saving}
                    >
                      {warehouses.length > 0 ? (
                        warehouses.map((warehouse) => (
                          <MenuItem key={warehouse.id} value={warehouse.id}>
                            {warehouse.name}
                          </MenuItem>
                        ))
                      ) : (
                        <MenuItem value="" disabled>
                          No warehouses available
                        </MenuItem>
                      )}
                    </TextField>
                    <TextField
                      select
                      label="Product"
                      value={item.productId}
                      onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                      required
                      size="small"
                      fullWidth
                      disabled={!item.warehouseId || saving}
                    >
                      {availableProductsForItem.length > 0 ? (
                        availableProductsForItem.map((product) => (
                          <MenuItem key={product.id} value={product.id}>
                            {product.name}
                          </MenuItem>
                        ))
                      ) : (
                        <MenuItem value="" disabled>
                          {item.warehouseId ? 'No products available' : 'Select warehouse first'}
                        </MenuItem>
                      )}
                    </TextField>
                    <TextField
                      label="Quantity"
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      required
                      size="small"
                      fullWidth
                      disabled={saving}
                      inputProps={{ min: 1, step: 0.01 }}
                    />
                    <TextField
                      select
                      label="Unit"
                      value={
                        item.unit ||
                        (item.productId && item.warehouseId
                          ? getProductWarehouseUnit(item.productId, item.warehouseId) || ''
                          : '')
                      }
                      onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                      required
                      size="small"
                      fullWidth
                      disabled={!item.productId || !item.warehouseId || saving}
                      helperText={
                        item.productId && item.warehouseId
                          ? getProductWarehouseUnit(item.productId, item.warehouseId)
                            ? `Auto-selected: ${getProductWarehouseUnit(item.productId, item.warehouseId)}`
                            : 'Product not available in warehouse'
                          : 'Select warehouse and product first'
                      }
                    >
                      {(() => {
                        const productUnit = getProductWarehouseUnit(
                          item.productId,
                          item.warehouseId,
                        );
                        if (productUnit) {
                          return (
                            <MenuItem key={productUnit} value={productUnit}>
                              {productUnit}
                            </MenuItem>
                          );
                        }
                        // Always provide at least one MenuItem to avoid MUI error
                        return (
                          <MenuItem value="" disabled>
                            {!item.productId || !item.warehouseId
                              ? 'Select warehouse and product first'
                              : 'No unit available'}
                          </MenuItem>
                        );
                      })()}
                    </TextField>
                    <TextField
                      label="Price Per Unit"
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                      required
                      size="small"
                      fullWidth
                      disabled={saving}
                      inputProps={{ min: 0, step: 0.01 }}
                      helperText={
                        item.productId && item.warehouseId && item.quantity
                          ? `Available: ${getAvailableQuantity(item.productId, item.warehouseId)}`
                          : ''
                      }
                      error={
                        !!(
                          item.productId &&
                          item.warehouseId &&
                          item.quantity &&
                          Number(item.quantity) >
                            getAvailableQuantity(item.productId, item.warehouseId)
                        )
                      }
                    />
                    {items.length > 1 && (
                      <IconButton
                        onClick={() => handleRemoveItem(index)}
                        color="error"
                        size="small"
                        disabled={saving}
                        sx={{ alignSelf: 'center' }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </Box>
                );
              })}
              <Button
                startIcon={<AddIcon />}
                onClick={handleAddItem}
                variant="outlined"
                size="small"
                disabled={saving}
                fullWidth
              >
                Add Item
              </Button>
            </Paper>
          )}

          {/* Show read-only invoice items when editing */}
          {selectedInvoice && (
            <Paper
              elevation={2}
              sx={{
                p: 2,
                mt: 2,
                borderRadius: 1,
                backgroundColor: '#fafafa',
                width: '100%',
                boxSizing: 'border-box',
              }}
            >
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: '#1976d2' }}>
                Invoice Items (Read Only)
              </Typography>
              {selectedInvoice.items?.map((item, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 1,
                    mb: 2,
                    p: 2,
                    border: '1px solid #e0e0e0',
                    borderRadius: 1,
                    backgroundColor: '#ffffff',
                  }}
                >
                  <TextField
                    label="Product"
                    value={item.product?.name || '-'}
                    disabled
                    size="small"
                    fullWidth
                  />
                  <TextField
                    label="Quantity"
                    value={item.quantity || '-'}
                    disabled
                    size="small"
                    fullWidth
                  />
                  <TextField
                    label="Unit"
                    value={item.unit || '-'}
                    disabled
                    size="small"
                    fullWidth
                  />
                  <TextField
                    label="Price Per Unit"
                    value={`$${Number(item.unitPrice || 0).toFixed(2)}`}
                    disabled
                    size="small"
                    fullWidth
                  />
                  <TextField
                    label="Item Total"
                    value={`$${(Number(item.quantity || 0) * Number(item.unitPrice || 0)).toFixed(2)}`}
                    disabled
                    size="small"
                    fullWidth
                  />
                </Box>
              ))}
            </Paper>
          )}
        </Box>

        {/* Right Side - Table (70%) */}
        <Box
          sx={{
            width: { xs: '100%', md: '70%' },
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
          }}
        >
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
            rows={filteredInvoices as unknown as Record<string, unknown>[]}
            onRowClick={(row) => {
              const invoice = filteredInvoices.find(
                (inv) => inv.id === (row as unknown as Invoice).id,
              );
              if (invoice) handleRowClick(invoice);
            }}
            loading={loading}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default Invoices;
