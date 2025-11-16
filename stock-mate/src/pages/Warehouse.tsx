import { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import axios from 'axios';
import CustomForm from '../components/CustomForm';
import CustomTable from '../components/CustomTable';
import CustomSearchFilter from '../components/CustomSearchFilter';
import type { SearchOption, Warehouse, Column } from '../utils/types';
import { API_ENDPOINTS } from '../utils/constants';

const API_URL = API_ENDPOINTS.WAREHOUSES;

// Alias for consistency
type WarehouseType = Warehouse;

const WarehousePage = () => {
  const [warehouses, setWarehouses] = useState<WarehouseType[]>([]);
  const [filteredWarehouses, setFilteredWarehouses] = useState<WarehouseType[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<WarehouseType | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchKey, setSearchKey] = useState<string>('name');
  const [searchValue, setSearchValue] = useState<string>('');

  // Search options based on backend fields
  const searchOptions: SearchOption[] = [
    { label: 'By Name', value: 'name' },
    { label: 'By Size', value: 'size' },
    { label: 'By Address', value: 'address' },
    { label: 'By ID', value: 'id' },
  ];

  // ✅ Fetch all warehouses
  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      const res = await axios.get<WarehouseType[]>(API_URL);
      setWarehouses(res.data);
      setFilteredWarehouses(res.data);
    } catch (err) {
      console.error('Error fetching warehouses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  // Filter warehouses based on search
  useEffect(() => {
    if (!searchValue.trim()) {
      setFilteredWarehouses(warehouses);
      return;
    }

    const filtered = warehouses.filter((warehouse) => {
      const fieldValue = String(warehouse[searchKey as keyof WarehouseType] || '').toLowerCase();
      return fieldValue.includes(searchValue.toLowerCase());
    });

    setFilteredWarehouses(filtered);
  }, [searchValue, searchKey, warehouses]);

  // ✅ Add or Update
  const handleAddOrUpdate = async (data: Record<string, string | number | boolean>) => {
    try {
      setSaving(true);
      //  Prepare payload with correct data types
      const payload: Record<string, string> = {
        name: String(data.name),
        address: String(data.address),
      };

      if (data.size) payload.size = String(data.size);

      if (selectedWarehouse) {
        console.log('Updating warehouse:', selectedWarehouse.id, payload);
        const response = await axios.patch(`${API_URL}/${selectedWarehouse.id}`, payload);
        console.log('Update response:', response.data);
      } else {
        console.log('Creating warehouse:', payload);
        const response = await axios.post(API_URL, payload);
        console.log('Create response:', response.data);
      }

      await fetchWarehouses();
      setSelectedWarehouse(null);
    } catch (err: unknown) {
      console.error('Error saving warehouse:', err);
      let errorMessage = 'Failed to save warehouse';
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
    } finally {
      setSaving(false);
    }
  };

  // ✅ Row click → edit mode
  const handleRowClick = (warehouse: WarehouseType) => {
    setSelectedWarehouse(warehouse);
  };

  // ✅ Cancel edit
  const handleCancel = () => {
    setSelectedWarehouse(null);
  };

  const columns: Column<WarehouseType>[] = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'address', label: 'Address' },
    { key: 'size', label: 'Size' },
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
        Manage Warehouses
      </Typography>

      <Box sx={{ display: 'flex', gap: 3, width: '100%', flexDirection: { xs: 'column', md: 'row' } }}>
        {/* Left Side - Form (30%) */}
        <Box sx={{ width: { xs: '100%', md: '30%' }, flexShrink: 0 }}>
          <CustomForm
            title="Warehouse Details"
            fields={[
              { key: 'name', label: 'Name', required: true },
              { key: 'address', label: 'Address', required: true },
              { key: 'size', label: 'Size', required: false },
            ]}
            onSubmit={handleAddOrUpdate}
            initialData={
              selectedWarehouse
                ? {
                    name: selectedWarehouse.name,
                    address: selectedWarehouse.address,
                    size: selectedWarehouse.size || '',
                  }
                : null
            }
            onCancel={handleCancel}
            loading={saving}
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
          <CustomTable<WarehouseType>
            columns={columns}
            rows={filteredWarehouses}
            onRowClick={handleRowClick}
            loading={loading}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default WarehousePage;
