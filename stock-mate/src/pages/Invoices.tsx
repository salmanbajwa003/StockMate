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
import jsPDF from 'jspdf';
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

  // Form state for invoice details
  const [formData, setFormData] = useState<Record<string, string | number>>({
    invoiceNumber: '',
    customerId: '',
    paidAmount: '',
    notes: '',
  });

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
            `Quantity exceeds available stock for ${
              product?.name || 'product'
            }. Available: ${availableQty}, Requested: ${requestedQty}`,
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

    // Update form data
    setFormData({
      invoiceNumber: invoice.invoiceNumber || '',
      customerId: typeof invoice.customer === 'object' ? invoice.customer?.id || '' : '',
      paidAmount: invoice.paidAmount || 0,
      notes: invoice.notes || '',
    });
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
    setFormData({
      invoiceNumber: '',
      customerId: '',
      paidAmount: '',
      notes: '',
    });
  };

  // Get available products for a specific warehouse
  const getAvailableProducts = (warehouseId: string) => {
    if (!warehouseId) return [];
    return products.filter((product) =>
      product.productWarehouses?.some((pw) => pw.warehouse?.id === Number(warehouseId)),
    );
  };

  // Download Button Component (separate component to avoid React hooks issues)
  const DownloadButton = ({ invoice }: { invoice: Invoice }) => {
    return (
      <Button
        size="small"
        variant="outlined"
        color="primary"
        onClick={(e) => {
          e.stopPropagation();
          handleDownloadPDF(invoice, e);
        }}
        title="Download PDF"
        sx={{ minWidth: 'auto', px: 1 }}
      >
        Download
      </Button>
    );
  };

  // Generate and download PDF
  const handleDownloadPDF = async (invoice: Invoice, e?: React.MouseEvent) => {
    e?.stopPropagation(); // Prevent row click

    try {
      // Fetch full invoice details if needed
      const fullInvoice = await invoiceService.findOne(invoice.id);

      // Create PDF
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 20;
      let yPos = margin;

      // Header
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('INVOICE', pageWidth / 2, yPos, { align: 'center' });
      yPos += 10;

      // Invoice Number and Date
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Invoice #: ${fullInvoice.invoiceNumber}`, margin, yPos);
      if (fullInvoice.invoiceDate) {
        const invoiceDate = dayjs(fullInvoice.invoiceDate).format('DD-MM-YYYY');
        pdf.text(`Date: ${invoiceDate}`, pageWidth - margin, yPos, { align: 'right' });
      }
      yPos += 15;

      // Customer Information
      pdf.setFont('helvetica', 'bold');
      pdf.text('Bill To:', margin, yPos);
      yPos += 7;
      pdf.setFont('helvetica', 'normal');
      const customerName =
        typeof fullInvoice.customer === 'object'
          ? fullInvoice.customer?.name
          : fullInvoice.customer || 'N/A';
      pdf.text(customerName, margin, yPos);
      yPos += 7;
      if (typeof fullInvoice.customer === 'object') {
        if (fullInvoice.customer.phone) {
          pdf.text(`Phone: ${fullInvoice.customer.phone}`, margin, yPos);
          yPos += 7;
        }
        if (fullInvoice.customer.email) {
          pdf.text(`Email: ${fullInvoice.customer.email}`, margin, yPos);
          yPos += 7;
        }
      }
      yPos += 10;

      // Items Table Header
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.text('Item', margin, yPos);
      pdf.text('Quantity', margin + 50, yPos);
      pdf.text('Unit', margin + 80, yPos);
      pdf.text('Unit Price', margin + 100, yPos);
      pdf.text('Total', pageWidth - margin, yPos, { align: 'right' });
      yPos += 7;

      // Draw line
      pdf.setLineWidth(0.5);
      pdf.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 5;

      // Items
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      if (fullInvoice.items && fullInvoice.items.length > 0) {
        fullInvoice.items.forEach(
          (item: {
            id: number;
            product: { id: number; name: string } | string;
            quantity: number;
            unit: string;
            unitPrice: number;
          }) => {
            if (yPos > 250) {
              // New page if needed
              pdf.addPage();
              yPos = margin;
            }
            const productName =
              typeof item.product === 'object' ? item.product?.name : item.product || 'N/A';
            const quantity = item.quantity || 0;
            const unit = item.unit || '';
            const unitPrice = Number(item.unitPrice || 0);
            const itemTotal = quantity * unitPrice;

            // Truncate product name if too long
            const maxWidth = 45;
            const truncatedName =
              pdf.getTextWidth(productName) > maxWidth
                ? productName.substring(0, 20) + '...'
                : productName;

            pdf.text(truncatedName, margin, yPos);
            pdf.text(quantity.toString(), margin + 50, yPos);
            pdf.text(unit, margin + 80, yPos);
            pdf.text(unitPrice.toFixed(2), margin + 100, yPos);
            pdf.text(itemTotal.toFixed(2), pageWidth - margin, yPos, { align: 'right' });
            yPos += 7;
          },
        );
      } else {
        pdf.text('No items', margin, yPos);
        yPos += 7;
      }

      yPos += 5;
      pdf.setLineWidth(0.5);
      pdf.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 10;

      // Totals
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      const total = Number(fullInvoice.total || 0);
      const paidAmount = Number(fullInvoice.paidAmount || 0);
      const remaining = total - paidAmount;

      pdf.text(`Subtotal: ${total.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' });
      yPos += 8;
      pdf.text(`Paid: ${paidAmount.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' });
      yPos += 8;
      pdf.text(`Remaining: ${remaining.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' });
      yPos += 10;

      // Status
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      const status = fullInvoice.status || 'pending';
      pdf.text(`Status: ${status.charAt(0).toUpperCase() + status.slice(1)}`, margin, yPos);

      // Notes
      if (fullInvoice.notes) {
        yPos += 10;
        pdf.setFont('helvetica', 'bold');
        pdf.text('Notes:', margin, yPos);
        yPos += 7;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        const notesLines = pdf.splitTextToSize(fullInvoice.notes, pageWidth - 2 * margin);
        notesLines.forEach((line: string) => {
          if (yPos > 250) {
            pdf.addPage();
            yPos = margin;
          }
          pdf.text(line, margin, yPos);
          yPos += 7;
        });
      }

      // Print Date at the bottom - add after all content
      yPos += 20; // Add some space before print date
      const dateStr = dayjs().format('DD-MM-YYYY');
      const timeStr = dayjs().format('hh:mm A');
      const printDate = `${dateStr} (${timeStr})`;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0); // Black color to make it visible

      // Check if we need a new page for the print date
      if (yPos > 270) {
        pdf.addPage();
        yPos = margin + 20;
      }

      pdf.text(`Bill printed at : ${printDate}`, pageWidth / 2, yPos, { align: 'center' });

      // Save PDF
      const fileName = `Invoice_${fullInvoice.invoiceNumber}_${dayjs().format('YYYY-MM-DD')}.pdf`;
      pdf.save(fileName);
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Failed to generate PDF. Please try again.');
    }
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
      render: (row: Invoice) => `${Number(row.total || 0).toFixed(2)}`,
    },
    {
      key: 'paidAmount',
      label: 'Paid',
      render: (row: Invoice) => `${Number(row.paidAmount || 0).toFixed(2)}`,
    },
    {
      key: 'remainingAmount',
      label: 'Remaining',
      render: (row: Invoice) => {
        const remaining = Number(row.total || 0) - Number(row.paidAmount || 0);
        return `${remaining.toFixed(2)}`;
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
    {
      key: 'actions',
      label: 'Actions',
      render: (row: Invoice) => <DownloadButton invoice={row} />,
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
          <Paper
            elevation={2}
            sx={{
              p: 2,
              mb: 3,
              borderRadius: 1,
              backgroundColor: '#fafafa',
              width: '100%',
              boxSizing: 'border-box',
            }}
          >
            <Box
              component="form"
              onSubmit={(e) => {
                e.preventDefault();
                handleAddOrUpdate(formData);
              }}
              sx={{
                width: '100%',
                boxSizing: 'border-box',
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  mb: 2,
                  fontWeight: 'bold',
                  color: '#1976d2',
                }}
              >
                Invoice Details
              </Typography>

              {/* Form Fields */}
              <Box sx={{ width: '100%', display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                {formFields.map((field) => {
                  const isSelect = field.options && field.options.length > 0;
                  const fieldValue = formData[field.key] ?? '';

                  return (
                    <Box
                      key={field.key}
                      sx={{
                        width: { xs: '100%', sm: 'calc(50% - 8px)' },
                        boxSizing: 'border-box',
                        flexGrow: 0,
                        flexShrink: 0,
                      }}
                    >
                      <TextField
                        name={field.key}
                        select={isSelect}
                        label={field.label}
                        type={isSelect ? undefined : field.type || 'text'}
                        value={fieldValue}
                        onChange={(e) => {
                          const value =
                            field.type === 'number' ? Number(e.target.value) || 0 : e.target.value;
                          setFormData((prev) => ({ ...prev, [field.key]: value }));
                        }}
                        required={field.required === true}
                        size="small"
                        fullWidth
                        disabled={saving}
                        sx={{ width: '100%' }}
                      >
                        {isSelect &&
                          field.options?.map((option) => {
                            if (typeof option === 'object' && 'id' in option) {
                              return (
                                <MenuItem key={option.id} value={option.id}>
                                  {option.name}
                                </MenuItem>
                              );
                            }
                            return (
                              <MenuItem key={option as string} value={option as string}>
                                {option as string}
                              </MenuItem>
                            );
                          })}
                      </TextField>
                    </Box>
                  );
                })}
              </Box>

              {/* Total Amount Display */}
              <Box sx={{ width: '100%', mt: 2, mb: 2 }}>
                <TextField
                  label="Total Amount"
                  value={
                    selectedInvoice
                      ? `${Number(selectedInvoice.total || 0).toFixed(2)}`
                      : `${totalAmount}`
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
              </Box>

              {/* Invoice Items Section - Show for both new and existing invoices */}
              <Box sx={{ width: '100%', mt: 2, mb: 2 }}>
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
                              ? `Auto-selected: ${getProductWarehouseUnit(
                                  item.productId,
                                  item.warehouseId,
                                )}`
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
              </Box>

              {/* Submit Buttons */}
              <Box sx={{ width: '100%', mt: 2 }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={saving}
                    sx={{
                      flex: 1,
                      backgroundColor: '#1976d2',
                      ':hover': {
                        backgroundColor: '#1565c0',
                      },
                    }}
                  >
                    {selectedInvoice ? 'Save' : 'Add'}
                  </Button>

                  {selectedInvoice && (
                    <Button
                      type="button"
                      variant="outlined"
                      sx={{ flex: 1 }}
                      onClick={handleCancel}
                      disabled={saving}
                    >
                      Cancel
                    </Button>
                  )}
                </Box>
              </Box>
            </Box>
          </Paper>
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
