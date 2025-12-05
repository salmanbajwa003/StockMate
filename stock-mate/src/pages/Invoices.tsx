import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  IconButton,
  Chip,
  Autocomplete,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import axios from 'axios';
import dayjs, { Dayjs } from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import jsPDF from 'jspdf';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
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

const API_URL = API_ENDPOINTS.INVOICES;

interface DateRange {
  start: Dayjs | null;
  end: Dayjs | null;
}

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
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [searchKey, setSearchKey] = useState<string>('invoiceNumber');
  const [searchValue, setSearchValue] = useState<string | Dayjs | null | DateRange>('');
  const [dateFilter, setDateFilter] = useState<string>('all'); // 'all', 'today', 'thisMonth', 'previousMonth'
  const [totalAmount, setTotalAmount] = useState<string>('0.00');

  // Form state for invoice details
  const [formData, setFormData] = useState<Record<string, string | number>>({
    customerId: '',
    paidAmount: '',
    notes: '',
  });
  // Track raw input values for number fields to allow free typing (like Products Price field)
  const [numberFieldInputs, setNumberFieldInputs] = useState<Record<string, string>>({});
  // Track raw input values for Price Per Unit in invoice items
  const [itemPriceInputs, setItemPriceInputs] = useState<Record<number, string>>({});

  // Form state for invoice items (not handled by CustomForm)
  const [items, setItems] = useState<InvoiceItemForm[]>([
    { warehouseId: '', productId: '', quantity: '', unit: '', unitPrice: '' },
  ]);

  // Search options
  const searchOptions: SearchOption[] = useMemo(
    () => [
      { label: 'By Invoice Number', value: 'invoiceNumber', type: 'text' },
      { label: 'By Customer', value: 'customerName', type: 'text' },
      { label: 'By Status', value: 'status', type: 'text' },
      { label: 'By Date', value: 'invoiceDate', type: 'dateRange' },
    ],
    [],
  );

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
      const [productsData, customersData] = await Promise.all([
        productService.findAll(),
        customerService.findAll(),
      ]);
      setProducts(productsData);
      setCustomers(customersData);
    } catch (err) {
      console.error('Error fetching dropdown data:', err);
    }
  };

  useEffect(() => {
    fetchInvoices();
    fetchDropdowns();
  }, []);

  // Reset searchValue when searchKey changes
  useEffect(() => {
    const selectedOption = searchOptions.find((opt) => opt.value === searchKey);
    const isDateRange = selectedOption?.type === 'dateRange';

    if (isDateRange) {
      setSearchValue({ start: null, end: null });
    } else {
      setSearchValue('');
    }
  }, [searchKey, searchOptions]);

  // Filter invoices based on date filter and search
  useEffect(() => {
    let filtered = [...invoices];

    // Apply date filter first (predefined date filters)
    if (dateFilter !== 'all') {
      const today = dayjs();
      filtered = filtered.filter((invoice) => {
        if (!invoice.invoiceDate) return false;
        const invoiceDate = dayjs(invoice.invoiceDate);

        switch (dateFilter) {
          case 'today':
            return invoiceDate.isSame(today, 'day');
          case 'thisMonth':
            return invoiceDate.isSame(today, 'month') && invoiceDate.isSame(today, 'year');
          case 'previousMonth': {
            const previousMonth = today.subtract(1, 'month');
            return (
              invoiceDate.isSame(previousMonth, 'month') &&
              invoiceDate.isSame(previousMonth, 'year')
            );
          }
          default:
            return true;
        }
      });
    }

    // Apply search filter if search value exists
    const selectedOption = searchOptions.find((opt) => opt.value === searchKey);
    const isDateRange = selectedOption?.type === 'dateRange';

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
        filtered = filtered.filter((invoice) => {
          if (!invoice.invoiceDate) return false;
          const invoiceDate = dayjs(invoice.invoiceDate);
          const startDate = dateRange.start;
          const endDate = dateRange.end || dayjs(); // Default to today if end date not selected

          if (startDate && endDate) {
            return (
              invoiceDate.isSameOrAfter(startDate, 'day') &&
              invoiceDate.isSameOrBefore(endDate, 'day')
            );
          } else if (startDate) {
            return invoiceDate.isSameOrAfter(startDate, 'day');
          } else if (endDate) {
            return invoiceDate.isSameOrBefore(endDate, 'day');
          }
          return true;
        });
      }
    } else {
      // Handle text search
      if (typeof searchValue === 'string' && searchValue.trim()) {
        filtered = filtered.filter((invoice) => {
          let fieldValue = '';
          if (searchKey === 'customerName') {
            fieldValue =
              typeof invoice.customer === 'object'
                ? invoice.customer?.name || ''
                : invoice.customer || '';
          } else if (searchKey === 'status') {
            fieldValue = invoice.status || '';
          } else {
            fieldValue = String(invoice[searchKey as keyof Invoice] || '').toLowerCase();
          }
          return fieldValue.toLowerCase().includes(searchValue.toLowerCase());
        });
      }
    }

    setFilteredInvoices(filtered);
  }, [searchValue, searchKey, invoices, dateFilter, searchOptions]);

  // Get product weight
  const getProductWeight = (productId: string): number => {
    if (!productId) return 0;
    const product = products.find((p) => p.id === Number(productId));
    return product?.weight ? Number(product.weight) : 0;
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

    // If product is changed, reset warehouse, unit, and quantity, then auto-set unit from product
    if (field === 'productId') {
      const product = products.find((p) => p.id === Number(value));
      const productUnit = product?.unit || '';
      newItems[index] = {
        ...currentItem,
        productId: value,
        warehouseId: '',
        unit: productUnit, // Auto-fill from product.unit
        quantity: '',
      };
    }
    // If warehouse is changed, reset quantity (but keep product and unit)
    else if (field === 'warehouseId') {
      newItems[index] = {
        ...currentItem,
        warehouseId: value,
        quantity: '', // Reset quantity when warehouse changes
      };
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
    // Remove price input for the removed item and reindex remaining items
    setItemPriceInputs((prev) => {
      const updated: Record<number, string> = {};
      Object.keys(prev).forEach((key) => {
        const keyNum = Number(key);
        if (keyNum < index) {
          updated[keyNum] = prev[keyNum];
        } else if (keyNum > index) {
          updated[keyNum - 1] = prev[keyNum];
        }
        // Skip the removed item (keyNum === index)
      });
      return updated;
    });
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

      // Validate quantities don't exceed product weight
      for (const item of items) {
        const productWeight = getProductWeight(item.productId);
        const requestedQty = Number(item.quantity);
        const product = products.find((p) => p.id === Number(item.productId));

        if (productWeight > 0 && requestedQty > productWeight) {
          alert(
            `Quantity exceeds product weight for ${
              product?.name || 'product'
            }. Weight: ${productWeight}, Requested: ${requestedQty}`,
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
      // Normalize price: replace all commas with dots for decimal (handles cases like "1000,00")
      const normalizedPrice = price.replace(/,/g, '.');
      return {
        warehouseId: invoiceWarehouseId, // Use invoice warehouse for all items
        productId: item.product?.id?.toString() || '',
        quantity: qty,
        unit: item.unit || '',
        unitPrice: normalizedPrice,
      };
    }) || [{ warehouseId: '', productId: '', quantity: '', unit: '', unitPrice: '' }];
    setItems(invoiceItems);
    calculateTotalAmount(invoiceItems);

    // Initialize itemPriceInputs for each item
    const priceInputs: Record<number, string> = {};
    invoiceItems.forEach((item, index) => {
      if (item.unitPrice) {
        const normalizedPrice = String(item.unitPrice).replace(/,/g, '.');
        const numValue = Number(normalizedPrice);
        if (!isNaN(numValue)) {
          priceInputs[index] = String(numValue);
        }
      }
    });
    setItemPriceInputs(priceInputs);

    // Update form data
    // Normalize paidAmount: convert comma to dot if present (e.g., "10,00" -> "10.00")
    const paidAmountValue = invoice.paidAmount
      ? String(invoice.paidAmount).replace(/,/g, '.')
      : '0';
    setFormData({
      customerId: typeof invoice.customer === 'object' ? invoice.customer?.id || '' : '',
      paidAmount: paidAmountValue,
      notes: invoice.notes || '',
    });
    // Initialize number field inputs
    if (paidAmountValue && paidAmountValue !== '0') {
      const numValue = Number(paidAmountValue);
      setNumberFieldInputs((prev) => ({
        ...prev,
        paidAmount: !isNaN(numValue) ? String(numValue) : '',
      }));
    }
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
      customerId: '',
      paidAmount: '',
      notes: '',
    });
    setNumberFieldInputs({});
    setItemPriceInputs({});
  };

  // Get available warehouses for a specific product (with quantities)
  const getAvailableWarehouses = (productId: string) => {
    if (!productId) return [];
    const product = products.find((p) => p.id === Number(productId));
    if (!product || !product.productWarehouses) return [];

    return product.productWarehouses
      .filter((pw) => pw.warehouse) // Only warehouses that exist
      .map((pw) => ({
        warehouse: pw.warehouse!,
        quantity: pw.quantity || 0,
      }));
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
    { key: 'id', label: 'Invoice ID' },
    {
      key: 'customer',
      label: 'Customer',
      render: (row: Invoice) =>
        typeof row.customer === 'object' ? row.customer?.name : row.customer || '-',
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
    {
      key: 'customerId',
      label: 'Customer',
      type: 'select',
      required: true,
      options: customers.map((customer) => ({ id: customer.id, name: customer.name })),
    },
    { key: 'paidAmount', label: 'Paid Amount', type: 'number', required: false },
    { key: 'notes', label: 'Notes', type: 'textarea', required: false },
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
                  const isTextarea = field.type === 'textarea';
                  const fieldValue = formData[field.key] ?? '';

                  return (
                    <Box
                      key={field.key}
                      sx={{
                        width: { xs: '100%', sm: isTextarea ? '100%' : 'calc(50% - 8px)' },
                        boxSizing: 'border-box',
                        flexGrow: 0,
                        flexShrink: 0,
                      }}
                    >
                      {isSelect ? (
                        <Autocomplete
                          options={field.options || []}
                          getOptionLabel={(option) => {
                            if (typeof option === 'object' && 'id' in option) {
                              return option.name;
                            }
                            return String(option);
                          }}
                          isOptionEqualToValue={(option, value) => {
                            if (typeof option === 'object' && 'id' in option) {
                              if (typeof value === 'object' && 'id' in value) {
                                return option.id === value.id;
                              }
                              return option.id === value;
                            }
                            return option === value;
                          }}
                          value={
                            field.options?.find((opt) => {
                              if (typeof opt === 'object' && 'id' in opt) {
                                return opt.id === fieldValue;
                              }
                              return opt === fieldValue;
                            }) || null
                          }
                          onChange={(_, newValue) => {
                            const value =
                              typeof newValue === 'object' && newValue && 'id' in newValue
                                ? newValue.id
                                : newValue || '';
                            setFormData((prev) => ({ ...prev, [field.key]: value }));
                          }}
                          filterOptions={(options, { inputValue }) => {
                            return options.filter((option) => {
                              const label =
                                typeof option === 'object' && 'id' in option
                                  ? option.name
                                  : String(option);
                              return label.toLowerCase().startsWith(inputValue.toLowerCase());
                            });
                          }}
                          disabled={saving}
                          size="small"
                          fullWidth
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label={field.label}
                              required={field.required === true}
                            />
                          )}
                        />
                      ) : (
                        <TextField
                          name={field.key}
                          multiline={isTextarea}
                          rows={isTextarea ? 4 : undefined}
                          label={field.label}
                          type={
                            isTextarea
                              ? undefined
                              : field.type === 'number'
                              ? 'text'
                              : field.type || 'text'
                          }
                          value={
                            field.type === 'number'
                              ? numberFieldInputs[field.key] ?? ''
                              : fieldValue
                          }
                          onChange={(e) => {
                            if (field.type === 'number') {
                              // Replace all commas with dots for decimal input
                              let normalizedValue = e.target.value.replace(/,/g, '.');
                              // Remove any non-numeric characters except dot
                              normalizedValue = normalizedValue.replace(/[^0-9.]/g, '');
                              // Ensure only one dot for decimal
                              const parts = normalizedValue.split('.');
                              if (parts.length > 2) {
                                normalizedValue = parts[0] + '.' + parts.slice(1).join('');
                              }
                              // Limit decimal places to 2 while typing
                              if (normalizedValue.includes('.')) {
                                const [integerPart, decimalPart] = normalizedValue.split('.');
                                if (decimalPart && decimalPart.length > 2) {
                                  normalizedValue = integerPart + '.' + decimalPart.substring(0, 2);
                                }
                              }
                              // Store raw input string for display
                              setNumberFieldInputs((prev) => ({
                                ...prev,
                                [field.key]: normalizedValue,
                              }));
                              // Store numeric value in formData for submission
                              if (normalizedValue === '' || normalizedValue === '.') {
                                setFormData((prev) => ({ ...prev, [field.key]: '' }));
                              } else {
                                const numValue = Number(normalizedValue);
                                setFormData((prev) => ({
                                  ...prev,
                                  [field.key]: isNaN(numValue) ? 0 : numValue,
                                }));
                              }
                            } else {
                              setFormData((prev) => ({ ...prev, [field.key]: e.target.value }));
                            }
                          }}
                          onKeyPress={(e) => {
                            // Prevent non-numeric input for number fields
                            if (field.type === 'number') {
                              const char = e.key;
                              const allowedKeys = [
                                '0',
                                '1',
                                '2',
                                '3',
                                '4',
                                '5',
                                '6',
                                '7',
                                '8',
                                '9',
                                '.',
                                'Backspace',
                                'Delete',
                                'ArrowLeft',
                                'ArrowRight',
                                'ArrowUp',
                                'ArrowDown',
                                'Tab',
                                'Enter',
                              ];
                              // Allow control keys (Ctrl, Alt, Meta, etc.)
                              if (e.ctrlKey || e.metaKey || e.altKey) {
                                return;
                              }
                              // Check if the key is allowed
                              if (
                                !allowedKeys.includes(char) &&
                                !e.ctrlKey &&
                                !e.metaKey &&
                                !e.altKey
                              ) {
                                e.preventDefault();
                              }
                              // Prevent multiple decimal points
                              if (
                                char === '.' &&
                                (e.currentTarget as HTMLInputElement).value.includes('.')
                              ) {
                                e.preventDefault();
                              }
                            }
                          }}
                          onPaste={(e) => {
                            // Handle paste for number fields - filter out non-numeric characters
                            if (field.type === 'number') {
                              e.preventDefault();
                              const pastedText = e.clipboardData.getData('text');
                              // Replace commas with dots and remove non-numeric characters
                              let normalizedValue = pastedText.replace(/,/g, '.');
                              normalizedValue = normalizedValue.replace(/[^0-9.]/g, '');
                              // Ensure only one dot
                              const parts = normalizedValue.split('.');
                              if (parts.length > 2) {
                                normalizedValue = parts[0] + '.' + parts.slice(1).join('');
                              }
                              // Limit decimal places to 2
                              if (normalizedValue.includes('.')) {
                                const [integerPart, decimalPart] = normalizedValue.split('.');
                                if (decimalPart && decimalPart.length > 2) {
                                  normalizedValue = integerPart + '.' + decimalPart.substring(0, 2);
                                }
                              }
                              setNumberFieldInputs((prev) => ({
                                ...prev,
                                [field.key]: normalizedValue,
                              }));
                              const value = Number(normalizedValue) || 0;
                              setFormData((prev) => ({ ...prev, [field.key]: value }));
                            }
                          }}
                          onBlur={() => {
                            // Format to 2 decimal places when field loses focus
                            if (field.type === 'number') {
                              const currentInput = numberFieldInputs[field.key] || '';
                              if (currentInput === '' || currentInput === '.') {
                                setNumberFieldInputs((prev) => {
                                  const updated = { ...prev };
                                  delete updated[field.key];
                                  return updated;
                                });
                                setFormData((prev) => ({ ...prev, [field.key]: '' }));
                              } else {
                                const normalizedValue = currentInput.replace(/,/g, '.');
                                const numValue = Number(normalizedValue) || 0;
                                // Format to 2 decimal places
                                const formatted = numValue.toFixed(2);
                                setNumberFieldInputs((prev) => ({
                                  ...prev,
                                  [field.key]: formatted,
                                }));
                                setFormData((prev) => ({ ...prev, [field.key]: numValue }));
                              }
                            }
                          }}
                          required={field.required === true}
                          size="small"
                          fullWidth
                          disabled={saving}
                          sx={{ width: '100%' }}
                          placeholder={field.type === 'number' ? '0.00' : undefined}
                        />
                      )}
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
                  const availableWarehousesForItem = getAvailableWarehouses(item.productId);
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
                      <Autocomplete
                        options={products}
                        getOptionLabel={(option) => option.name}
                        isOptionEqualToValue={(option, value) => option.id === value.id}
                        value={products.find((p) => p.id === Number(item.productId)) || null}
                        onChange={(_, newValue) => {
                          handleItemChange(index, 'productId', newValue ? String(newValue.id) : '');
                        }}
                        filterOptions={(options, { inputValue }) => {
                          return options.filter((option) =>
                            option.name.toLowerCase().startsWith(inputValue.toLowerCase()),
                          );
                        }}
                        disabled={saving}
                        size="small"
                        fullWidth
                        renderInput={(params) => <TextField {...params} label="Product" required />}
                      />
                      <Autocomplete
                        options={availableWarehousesForItem}
                        getOptionLabel={(option) => `${option.warehouse.name}`}
                        isOptionEqualToValue={(option, value) =>
                          option.warehouse.id === value.warehouse.id
                        }
                        value={
                          availableWarehousesForItem.find(
                            (pw) => pw.warehouse.id === Number(item.warehouseId),
                          ) || null
                        }
                        onChange={(_, newValue) => {
                          handleItemChange(
                            index,
                            'warehouseId',
                            newValue ? String(newValue.warehouse.id) : '',
                          );
                        }}
                        filterOptions={(options, { inputValue }) => {
                          return options.filter((option) =>
                            option.warehouse.name
                              .toLowerCase()
                              .startsWith(inputValue.toLowerCase()),
                          );
                        }}
                        disabled={!item.productId || saving}
                        size="small"
                        fullWidth
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Warehouse"
                            required
                            placeholder={
                              item.productId
                                ? 'No warehouses available for this product'
                                : 'Select product first'
                            }
                          />
                        )}
                      />
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
                        helperText={
                          item.productId
                            ? `Product Weight: ${getProductWeight(item.productId) || 'N/A'}`
                            : ''
                        }
                        error={
                          !!(
                            item.productId &&
                            item.quantity &&
                            getProductWeight(item.productId) > 0 &&
                            Number(item.quantity) > getProductWeight(item.productId)
                          )
                        }
                      />
                      <Autocomplete
                        options={(() => {
                          if (!item.productId) return [];
                          const product = products.find((p) => p.id === Number(item.productId));
                          const productUnit = product?.unit || '';
                          return productUnit ? [productUnit] : [];
                        })()}
                        getOptionLabel={(option) => String(option)}
                        isOptionEqualToValue={(option, value) => option === value}
                        value={item.unit || null}
                        onChange={(_, newValue) => {
                          handleItemChange(index, 'unit', newValue || '');
                        }}
                        filterOptions={(options, { inputValue }) => {
                          return options.filter((option) =>
                            String(option).toLowerCase().startsWith(inputValue.toLowerCase()),
                          );
                        }}
                        disabled={!item.productId || saving}
                        size="small"
                        fullWidth
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Unit"
                            required
                            helperText={
                              item.productId
                                ? item.unit
                                  ? `Auto-selected from product: ${item.unit}`
                                  : 'Unit will be auto-filled from product'
                                : 'Select product first'
                            }
                          />
                        )}
                      />
                      <TextField
                        label="Price Per Unit"
                        type="text"
                        inputMode="decimal"
                        value={
                          itemPriceInputs[index] ??
                          (item.unitPrice ? String(item.unitPrice).replace(/,/g, '.') : '')
                        }
                        onChange={(e) => {
                          // Replace all commas with dots for decimal input
                          let normalizedValue = e.target.value.replace(/,/g, '.');
                          // Remove any non-numeric characters except dot
                          normalizedValue = normalizedValue.replace(/[^0-9.]/g, '');
                          // Ensure only one dot for decimal
                          const parts = normalizedValue.split('.');
                          if (parts.length > 2) {
                            normalizedValue = parts[0] + '.' + parts.slice(1).join('');
                          }
                          // Limit decimal places to 2 while typing
                          if (normalizedValue.includes('.')) {
                            const [integerPart, decimalPart] = normalizedValue.split('.');
                            if (decimalPart && decimalPart.length > 2) {
                              normalizedValue = integerPart + '.' + decimalPart.substring(0, 2);
                            }
                          }
                          // Store raw input string for display
                          setItemPriceInputs((prev) => ({ ...prev, [index]: normalizedValue }));
                          // Store numeric value in items for calculation
                          if (normalizedValue === '' || normalizedValue === '.') {
                            handleItemChange(index, 'unitPrice', '');
                          } else {
                            const numValue = Number(normalizedValue);
                            handleItemChange(
                              index,
                              'unitPrice',
                              isNaN(numValue) ? '0' : String(numValue),
                            );
                          }
                        }}
                        onKeyPress={(e) => {
                          // Prevent non-numeric input for number fields
                          const char = e.key;
                          const allowedKeys = [
                            '0',
                            '1',
                            '2',
                            '3',
                            '4',
                            '5',
                            '6',
                            '7',
                            '8',
                            '9',
                            '.',
                            'Backspace',
                            'Delete',
                            'ArrowLeft',
                            'ArrowRight',
                            'ArrowUp',
                            'ArrowDown',
                            'Tab',
                            'Enter',
                          ];
                          // Allow control keys (Ctrl, Alt, Meta, etc.)
                          if (e.ctrlKey || e.metaKey || e.altKey) {
                            return;
                          }
                          // Check if the key is allowed
                          if (
                            !allowedKeys.includes(char) &&
                            !e.ctrlKey &&
                            !e.metaKey &&
                            !e.altKey
                          ) {
                            e.preventDefault();
                          }
                          // Prevent multiple decimal points
                          if (
                            char === '.' &&
                            (e.currentTarget as HTMLInputElement).value.includes('.')
                          ) {
                            e.preventDefault();
                          }
                        }}
                        onPaste={(e) => {
                          // Handle paste for number fields - filter out non-numeric characters
                          e.preventDefault();
                          const pastedText = e.clipboardData.getData('text');
                          // Replace commas with dots and remove non-numeric characters
                          let normalizedValue = pastedText.replace(/,/g, '.');
                          normalizedValue = normalizedValue.replace(/[^0-9.]/g, '');
                          // Ensure only one dot
                          const parts = normalizedValue.split('.');
                          if (parts.length > 2) {
                            normalizedValue = parts[0] + '.' + parts.slice(1).join('');
                          }
                          // Limit decimal places to 2
                          if (normalizedValue.includes('.')) {
                            const [integerPart, decimalPart] = normalizedValue.split('.');
                            if (decimalPart && decimalPart.length > 2) {
                              normalizedValue = integerPart + '.' + decimalPart.substring(0, 2);
                            }
                          }
                          setItemPriceInputs((prev) => ({ ...prev, [index]: normalizedValue }));
                          const value = Number(normalizedValue) || 0;
                          handleItemChange(index, 'unitPrice', String(value));
                        }}
                        onBlur={() => {
                          // Format to 2 decimal places when field loses focus
                          const currentInput = itemPriceInputs[index] || '';
                          if (currentInput === '' || currentInput === '.') {
                            setItemPriceInputs((prev) => {
                              const updated = { ...prev };
                              delete updated[index];
                              return updated;
                            });
                            handleItemChange(index, 'unitPrice', '');
                          } else {
                            const normalizedValue = currentInput.replace(/,/g, '.');
                            const numValue = Number(normalizedValue) || 0;
                            // Format to 2 decimal places
                            const formatted = numValue.toFixed(2);
                            setItemPriceInputs((prev) => ({ ...prev, [index]: formatted }));
                            handleItemChange(index, 'unitPrice', formatted);
                          }
                        }}
                        required
                        size="small"
                        fullWidth
                        disabled={saving}
                        placeholder="0.00"
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
