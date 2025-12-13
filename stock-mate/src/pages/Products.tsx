import { useEffect, useState, useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import axios from 'axios';
import dayjs, { Dayjs } from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import CustomForm from '../components/CustomForm';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
import CustomTable from '../components/CustomTable';
import CustomSearchFilter from '../components/CustomSearchFilter';
import type {
  SearchOption,
  Product,
  Fiber,
  Color,
  FormField,
  Column,
  Warehouse,
} from '../utils/types';
import { API_ENDPOINTS } from '../utils/constants';

interface DateRange {
  start: Dayjs | null;
  end: Dayjs | null;
}

const API_BASE = API_ENDPOINTS.PRODUCTS;

const Products = () => {
  const [rows, setRows] = useState<Product[]>([]);
  const [filteredRows, setFilteredRows] = useState<Product[]>([]);
  const [selectedItem, setSelectedItem] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);
  const [searchKey, setSearchKey] = useState<string>('name');
  const [searchValue, setSearchValue] = useState<string | Dayjs | null | DateRange>('');
  const [fabrics, setFabrics] = useState<Fiber[]>([]);
  const [colors, setColors] = useState<Color[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  // Search options based on backend fields
  const searchOptions: SearchOption[] = useMemo(
    () => [
      { label: 'By Name', value: 'name', type: 'text' },
      { label: 'By ID', value: 'id', type: 'text' },
      { label: 'By Fabric', value: 'fabric', type: 'text' },
      { label: 'By Color', value: 'color', type: 'text' },
      { label: 'By Unit', value: 'unit', type: 'text' },
      { label: 'By Warehouse', value: 'warehouses', type: 'text' },
      { label: 'By Date', value: 'updatedAt', type: 'dateRange' },
    ],
    [],
  );

  // ✅ Fetch All Products
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await axios.get<Product[]>(API_BASE);
      setRows(res.data);
      setFilteredRows(res.data);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch fabrics and colors for dropdowns
  const fetchFabrics = async () => {
    try {
      const res = await axios.get<Fiber[]>(API_ENDPOINTS.FABRICS);
      setFabrics(res.data);
    } catch (err) {
      console.error('Failed to fetch fabrics:', err);
    }
  };

  const fetchColors = async () => {
    try {
      const res = await axios.get<Color[]>(API_ENDPOINTS.COLORS);
      setColors(res.data);
    } catch (err) {
      console.error('Failed to fetch colors:', err);
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
    const loadData = async () => {
      setLoadingDropdowns(true);
      try {
        await Promise.all([fetchProducts(), fetchFabrics(), fetchColors(), fetchWarehouses()]);
      } finally {
        setLoadingDropdowns(false);
      }
    };
    loadData();
  }, []);

  // Filter products based on search
  useEffect(() => {
    const selectedOption = searchOptions.find((opt) => opt.value === searchKey);
    const isDateRange = selectedOption?.type === 'dateRange';

    // Check if search value is empty
    if (isDateRange) {
      const dateRange = searchValue as DateRange;
      if (
        !dateRange ||
        typeof dateRange !== 'object' ||
        !('start' in dateRange) ||
        !('end' in dateRange)
      ) {
        setFilteredRows(rows);
        return;
      }
      // If both start and end are null, show all rows
      if (!dateRange.start && !dateRange.end) {
        setFilteredRows(rows);
        return;
      }
    } else {
      // For non-date searches, ensure searchValue is a string
      if (typeof searchValue !== 'string') {
        setFilteredRows(rows);
        return;
      }
      if (!searchValue || !searchValue.trim()) {
        setFilteredRows(rows);
        return;
      }
    }

    const filtered = rows.filter((item) => {
      if (isDateRange) {
        const dateRange = searchValue as DateRange;
        if (!dateRange || typeof dateRange !== 'object' || !('start' in dateRange)) {
          return false;
        }

        const updatedAt = item.updatedAt ? dayjs(item.updatedAt) : null;
        if (!updatedAt) return false;

        const endDate = dateRange.end;
        const startDate = dateRange.start;

        // If both dates are selected
        if (startDate && endDate) {
          return (
            updatedAt.isSameOrAfter(startDate.startOf('day')) &&
            updatedAt.isSameOrBefore(endDate.endOf('day'))
          );
        }
        // If only start date is selected - filter from start date onwards
        else if (startDate) {
          return updatedAt.isSameOrAfter(startDate.startOf('day'));
        }
        // If only end date is selected - filter up to end date (default to today if not set)
        else if (endDate) {
          return updatedAt.isSameOrBefore(endDate.endOf('day'));
        }
        // If neither is selected, don't filter (shouldn't reach here due to earlier check)
        return true;
      } else {
        // Ensure searchValue is a string for text searches
        if (typeof searchValue !== 'string') {
          return false;
        }
        const searchStr = searchValue.toLowerCase();
        let fieldValue = '';

        if (searchKey === 'fabric') {
          fieldValue = item.fabric
            ? typeof item.fabric === 'string'
              ? item.fabric
              : item.fabric.name
            : '';
        } else if (searchKey === 'color') {
          fieldValue = item.color
            ? typeof item.color === 'string'
              ? item.color
              : item.color.name
            : '';
        } else if (searchKey === 'warehouses') {
          if (item.productWarehouses && item.productWarehouses.length > 0) {
            fieldValue = item.productWarehouses.map((pw) => pw?.warehouse?.name || '').join(', ');
          }
        } else if (searchKey === 'unit') {
          fieldValue = item.unit || '';
        } else {
          fieldValue = String(item[searchKey as keyof Product] || '');
        }

        return fieldValue.toLowerCase().includes(searchStr);
      }
    });

    setFilteredRows(filtered);
  }, [searchValue, searchKey, rows, searchOptions]);

  // ✅ Add or Update Product
  const handleAddOrUpdate = async (data: Record<string, string | number>) => {
    console.log('🚀 ~ handleAddOrUpdate ~ data:', data);

    try {
      setSaving(true);

      // Generate product name from color + fabric
      const fabricId = data.fabricId ? Number(data.fabricId) : null;
      const colorId = data.colorId ? Number(data.colorId) : null;

      // Find color and fabric names from their IDs
      const selectedColor = colorId ? colors.find((c) => c.id === colorId) : null;
      const selectedFabric = fabricId ? fabrics.find((f) => f.id === fabricId) : null;

      // Generate name: "Color Fabric" (e.g., "Red Cotton")
      let productName = '';
      if (selectedColor && selectedFabric) {
        productName = `${selectedColor.name} ${selectedFabric.name}`;
      } else if (selectedColor) {
        productName = selectedColor.name;
      } else if (selectedFabric) {
        productName = selectedFabric.name;
      }

      // Build payload with required and optional fields
      const payload: {
        name: string;
        fabricId: number | null;
        colorId: number | null;
        price?: number | null;
        weight?: number | null;
        unit?: string | null;
        warehouseQuantities: {
          warehouseId: number | null;
          quantity: number;
          unit: string;
        }[];
      } = {
        name: productName,
        fabricId: fabricId,
        colorId: colorId,
        warehouseQuantities: [
          {
            warehouseId: data.warehouseId ? Number(data.warehouseId) : null,
            quantity: Number(data.weight),
            unit: String(data.unit),
          },
        ],
      };

      // Add optional fields if they have values
      if (data.price !== undefined && data.price !== null && data.price !== '') {
        payload.price = Number(data.price);
      }
      if (data.weight !== undefined && data.weight !== null && data.weight !== '') {
        payload.weight = Number(data.weight);
      }
      if (data.unit !== undefined && data.unit !== null && data.unit !== '') {
        payload.unit = String(data.unit);
      }

      if (selectedItem) {
        // For update, all fields are optional (UpdateProductDto extends PartialType)
        console.log('Updating product:', selectedItem.id, payload);
        const response = await axios.patch(`${API_BASE}/${selectedItem.id}`, payload);
        console.log('Update response:', response.data);
      } else {
        // For create, warehouseQuantities is required - this should be handled separately
        // For now, we'll show an error if trying to create without warehouseQuantities
        await axios.post(`${API_BASE}`, payload);
        await fetchProducts();
        return;
      }

      await fetchProducts();
      setSelectedItem(null);
    } catch (err: unknown) {
      console.error('Error saving product:', err);
      let errorMessage = 'Failed to save product';
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

  // ✅ Row Click to Edit
  const handleRowClick = (item: Product) => {
    setSelectedItem(item);
  };

  // ✅ Cancel Editing
  const handleCancel = () => {
    setSelectedItem(null);
  };

  // Reset search value when search key changes
  useEffect(() => {
    const selectedOption = searchOptions.find((opt) => opt.value === searchKey);
    if (selectedOption?.type === 'dateRange') {
      // Initialize with both null - user needs to select dates to filter
      const currentValue = searchValue as DateRange;
      if (!currentValue || typeof currentValue !== 'object' || !('start' in currentValue)) {
        setSearchValue({ start: null, end: null });
      }
    } else {
      // Reset to empty string for text searches
      if (typeof searchValue !== 'string') {
        setSearchValue('');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchKey]);

  const columns: Column<Product>[] = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Product Name' },
    {
      key: 'fabric',
      label: 'Fabric',
      render: (row: Product) =>
        row.fabric ? (typeof row.fabric === 'string' ? row.fabric : row.fabric.name) : '-',
    },
    {
      key: 'color',
      label: 'Color',
      render: (row: Product) =>
        row.color ? (typeof row.color === 'string' ? row.color : row.color.name) : '-',
    },
    {
      key: 'price',
      label: 'Price',
      render: (row: Product) => (row.price ? `${Number(row.price).toFixed(2)}` : '-'),
    },
    {
      key: 'weight',
      label: 'Quantity',
      render: (row: Product) => (row.weight ? `${row.weight}` : '-'),
    },
    {
      key: 'unit',
      label: 'Unit',
      render: (row: Product) => row.unit || '-',
    },
    {
      key: 'warehouses',
      label: 'Warehouses',
      render: (row: Product) => {
        if (row.productWarehouses && row.productWarehouses.length > 0) {
          return row.productWarehouses
            .map(
              // (pw) => `${pw.quantity} ${pw.unit}${pw.warehouse ? ` (${pw.warehouse.name})` : ''}`,
              (pw) => `${pw?.warehouse?.name || ''}`,
            )
            .join(', ');
        }
        return '-';
      },
    },
    {
      key: 'updatedAt',
      label: 'Date',
      render: (row: Product) => {
        const updatedAt = row.updatedAt;
        if (updatedAt) {
          return dayjs(updatedAt).format('DD-MM-YYYY');
        }
        return '-';
      },
    },
  ];

  // Build form fields with dropdown options
  // Required fields: fabricId, colorId
  // Optional fields: price, weight, unit
  // Note: Product name is auto-generated from color + fabric and not shown in form
  // Layout: Warehouse (full width), Fabric & Color (same row), Quantity & Unit (same row), Price (full width)
  const fields: FormField[] = [
    {
      key: 'warehouseId',
      label: 'Warehouse',
      type: 'select',
      required: true,
      fullWidth: true,
      options: warehouses?.map((warehouse) => ({ id: warehouse.id, name: warehouse.name })) || [],
    },
    {
      key: 'fabricId',
      label: 'Fabric',
      type: 'select',
      required: true,
      options: fabrics.map((fabric) => ({ id: fabric.id, name: fabric.name })),
    },
    {
      key: 'colorId',
      label: 'Color',
      type: 'select',
      required: true,
      options: colors.map((color) => ({ id: color.id, name: color.name })),
    },
    { key: 'weight', label: 'Quantity', type: 'number', required: false },
    {
      key: 'unit',
      label: 'Unit',
      type: 'select',
      required: false,
      options: ['meter', 'yard', 'kg'],
    },
    { key: 'price', label: 'Price', type: 'number', required: false, fullWidth: true },
  ];

  return (
    <Box sx={{ p: 3, width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', color: '#1976d2' }}>
        Manage Products
      </Typography>

      <Box
        sx={{ display: 'flex', gap: 3, width: '100%', flexDirection: { xs: 'column', md: 'row' } }}
      >
        {/* Left Side - Form (30%) */}
        <Box sx={{ width: { xs: '100%', md: '30%' }, flexShrink: 0 }}>
          <CustomForm
            title="Product Details"
            fields={fields}
            onSubmit={handleAddOrUpdate}
            initialData={
              selectedItem
                ? {
                    fabricId:
                      typeof selectedItem.fabric === 'object' && selectedItem.fabric?.id
                        ? selectedItem.fabric.id
                        : '',
                    colorId:
                      typeof selectedItem.color === 'object' && selectedItem.color?.id
                        ? selectedItem.color.id
                        : '',
                    // Normalize price: convert comma to dot if present (e.g., "10,00" -> "10.00")
                    price: selectedItem.price
                      ? Number(String(selectedItem.price).replace(/,/g, '.') || 0)
                      : '',
                    // Normalize weight/quantity: convert comma to dot if present (e.g., "10,00" -> "10.00")
                    weight: selectedItem.weight
                      ? Number(String(selectedItem.weight).replace(/,/g, '.') || 0)
                      : '',
                    unit: selectedItem.unit || '',
                    warehouseId:
                      typeof selectedItem.productWarehouses?.[0]?.warehouse === 'object' &&
                      selectedItem.productWarehouses?.[0]?.warehouse?.id
                        ? selectedItem.productWarehouses?.[0]?.warehouse?.id
                        : '',
                  }
                : null
            }
            onCancel={handleCancel}
            loading={saving || loadingDropdowns}
          />
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
          <CustomTable<Product>
            columns={columns}
            rows={filteredRows}
            onRowClick={handleRowClick}
            loading={loading}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default Products;
