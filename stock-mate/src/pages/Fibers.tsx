import { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import axios from 'axios';
import CustomForm from '../components/CustomForm';
import CustomTable from '../components/CustomTable';
import CustomSearchFilter from '../components/CustomSearchFilter';
import type { SearchOption, Fiber, Column } from '../utils/types';
import { API_ENDPOINTS } from '../utils/constants';

const API_URL = API_ENDPOINTS.FABRICS;

const Fibers = () => {
  const [fibers, setFibers] = useState<Fiber[]>([]);
  const [filteredFibers, setFilteredFibers] = useState<Fiber[]>([]);
  const [selectedFiber, setSelectedFiber] = useState<Fiber | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchKey, setSearchKey] = useState<string>('name');
  const [searchValue, setSearchValue] = useState<string>('');

  // Search options based on backend fields
  const searchOptions: SearchOption[] = [
    { label: 'By Name', value: 'name' },
    { label: 'By ID', value: 'id' },
  ];

  // Fetch all fibers
  const fetchFibers = async () => {
    try {
      setLoading(true);
      const res = await axios.get<Fiber[]>(API_URL);
      setFibers(res.data);
      setFilteredFibers(res.data);
    } catch (err) {
      console.error('Error fetching fibers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFibers();
  }, []);

  // Filter fibers based on search
  useEffect(() => {
    if (!searchValue.trim()) {
      setFilteredFibers(fibers);
      return;
    }

    const filtered = fibers.filter((fiber) => {
      const fieldValue = String(fiber[searchKey as keyof Fiber] || '').toLowerCase();
      return fieldValue.includes(searchValue.toLowerCase());
    });

    setFilteredFibers(filtered);
  }, [searchValue, searchKey, fibers]);

  // Add or Update Fiber
  const handleAddOrUpdate = async (data: Record<string, string | number>) => {
    try {
      const payload: Record<string, string> = {
        name: String(data.name),
      };

      if (data.description) payload.description = String(data.description);

      if (selectedFiber) {
        console.log('Updating fiber:', selectedFiber.id, payload);
        const response = await axios.patch(`${API_URL}/${selectedFiber.id}`, payload);
        console.log('Update response:', response.data);
      } else {
        console.log('Creating fiber:', payload);
        const response = await axios.post(API_URL, payload);
        console.log('Create response:', response.data);
      }
      await fetchFibers();
      setSelectedFiber(null);
    } catch (err: unknown) {
      console.error('Error saving fiber:', err);
      let errorMessage = 'Failed to save fiber';
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

  // Handle row click — populate form
  const handleRowClick = (fiber: Fiber) => {
    setSelectedFiber(fiber);
  };

  // Cancel edit
  const handleCancel = () => {
    setSelectedFiber(null);
  };

  const columns: Column<Fiber>[] = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'description', label: 'Description' },
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
        Manage Fibers
      </Typography>

      <Box sx={{ display: 'flex', gap: 3, width: '100%', flexDirection: { xs: 'column', md: 'row' } }}>
        {/* Left Side - Form (30%) */}
        <Box sx={{ width: { xs: '100%', md: '30%' }, flexShrink: 0 }}>
          <CustomForm
            title="Fiber Details"
            fields={[
              { key: 'name', label: 'Name', required: true },
              { key: 'description', label: 'Description', required: false },
            ]}
            onSubmit={handleAddOrUpdate}
            initialData={
              selectedFiber
                ? {
                    name: selectedFiber.name,
                    description: selectedFiber.description || '',
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
          <CustomTable<Fiber>
            columns={columns}
            rows={filteredFibers}
            onRowClick={handleRowClick}
            loading={loading}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default Fibers;

