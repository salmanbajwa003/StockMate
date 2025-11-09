import { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import axios from 'axios';
import CustomForm from '../components/CustomForm';
import CustomTable from '../components/CustomTable';
import CustomSearchFilter from '../components/CustomSearchFilter';
import type { SearchOption, Product, Fiber, Color, FormField, Column } from '../utils/types';
import { API_ENDPOINTS } from '../utils/constants';

const API_BASE = API_ENDPOINTS.PRODUCTS;

const Products = () => {
  const [rows, setRows] = useState<Product[]>([]);
  const [filteredRows, setFilteredRows] = useState<Product[]>([]);
  const [selectedItem, setSelectedItem] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchKey, setSearchKey] = useState<string>('name');
  const [searchValue, setSearchValue] = useState<string>('');
  const [fabrics, setFabrics] = useState<Fiber[]>([]);
  const [colors, setColors] = useState<Color[]>([]);

  // Search options based on backend fields
  const searchOptions: SearchOption[] = [
    { label: 'By Name', value: 'name' },
    { label: 'By ID', value: 'id' },
  ];

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

  useEffect(() => {
    fetchProducts();
    fetchFabrics();
    fetchColors();
  }, []);

  // Filter products based on search
  useEffect(() => {
    if (!searchValue.trim()) {
      setFilteredRows(rows);
      return;
    }

    const filtered = rows.filter((item) => {
      const fieldValue = String(item[searchKey as keyof Product] || '').toLowerCase();
      return fieldValue.includes(searchValue.toLowerCase());
    });

    setFilteredRows(filtered);
  }, [searchValue, searchKey, rows]);

  // ✅ Add or Update Product
  const handleAddOrUpdate = async (data: Record<string, string | number>) => {
    try {
      // Build payload with required and optional fields
      const payload: Record<string, string | number | null> = {
        name: String(data.name),
        fabricId: data.fabricId ? Number(data.fabricId) : null,
        colorId: data.colorId ? Number(data.colorId) : null,
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
        console.error(
          'Creating products requires warehouseQuantities. Please use the API directly or add warehouse quantity fields to the form.',
        );
        alert(
          'Creating products requires warehouse quantities. Please add them via the API or update the form.',
        );
        return;
      }

      await fetchProducts();
      setSelectedItem(null);
    } catch (err: unknown) {
      console.error('Error saving product:', err);
      let errorMessage = 'Failed to save product';
      if (err && typeof err === 'object') {
        if ('response' in err && err.response && typeof err.response === 'object' && 'data' in err.response) {
          const responseData = err.response.data;
          if (responseData && typeof responseData === 'object' && 'message' in responseData) {
            errorMessage = String(responseData.message);
          }
        } else if ('message' in err) {
          errorMessage = String(err.message);
        }
      }
      alert(`Error: ${errorMessage}`);
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
      label: 'Weight',
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
              (pw) => `${pw.quantity} ${pw.unit}${pw.warehouse ? ` (${pw.warehouse.name})` : ''}`,
            )
            .join(', ');
        }
        return '-';
      },
    },
  ];

  // Build form fields with dropdown options
  // Required fields: name, fabricId, colorId
  // Optional fields: price, weight, unit
  const fields: FormField[] = [
    { key: 'name', label: 'Product Name', required: true },
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
    { key: 'price', label: 'Price', type: 'number', required: false },
    { key: 'weight', label: 'Weight', type: 'number', required: false },
    {
      key: 'unit',
      label: 'Unit',
      type: 'select',
      required: false,
      options: ['meter', 'yard', 'kg', 'piece'],
    },
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
                    name: selectedItem.name,
                    fabricId:
                      typeof selectedItem.fabric === 'object' && selectedItem.fabric?.id
                        ? selectedItem.fabric.id
                        : '',
                    colorId:
                      typeof selectedItem.color === 'object' && selectedItem.color?.id
                        ? selectedItem.color.id
                        : '',
                    price: selectedItem.price || '',
                    weight: selectedItem.weight || '',
                    unit: selectedItem.unit || '',
                  }
                : null
            }
            onCancel={handleCancel}
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
