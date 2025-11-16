import { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import axios from 'axios';
import CustomForm from '../components/CustomForm';
import CustomTable from '../components/CustomTable';
import CustomSearchFilter from '../components/CustomSearchFilter';
import type { SearchOption, Color, Column } from '../utils/types';
import { API_ENDPOINTS } from '../utils/constants';

const API_URL = API_ENDPOINTS.COLORS;

const Colors = () => {
  const [colors, setColors] = useState<Color[]>([]);
  const [filteredColors, setFilteredColors] = useState<Color[]>([]);
  const [selectedColor, setSelectedColor] = useState<Color | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchKey, setSearchKey] = useState<string>('name');
  const [searchValue, setSearchValue] = useState<string>('');

  // Search options based on backend fields
  const searchOptions: SearchOption[] = [
    { label: 'By Name', value: 'name' },
    { label: 'By ID', value: 'id' },
    { label: 'By Hex Code', value: 'hexCode' },
  ];

  // Fetch all colors
  const fetchColors = async () => {
    try {
      setLoading(true);
      const res = await axios.get<Color[]>(API_URL);
      setColors(res.data);
      setFilteredColors(res.data);
    } catch (err) {
      console.error('Error fetching colors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchColors();
  }, []);

  // Filter colors based on search
  useEffect(() => {
    if (!searchValue.trim()) {
      setFilteredColors(colors);
      return;
    }

    const filtered = colors.filter((color) => {
      const fieldValue = String(color[searchKey as keyof Color] || '').toLowerCase();
      return fieldValue.includes(searchValue.toLowerCase());
    });

    setFilteredColors(filtered);
  }, [searchValue, searchKey, colors]);

  // Add or Update Color
  const handleAddOrUpdate = async (data: Record<string, string | number>) => {
    try {
      setSaving(true);
      const payload: Record<string, string> = {
        name: String(data.name),
      };

      if (data.hexCode) payload.hexCode = String(data.hexCode);
      if (data.description) payload.description = String(data.description);

      if (selectedColor) {
        console.log('Updating color:', selectedColor.id, payload);
        const response = await axios.patch(`${API_URL}/${selectedColor.id}`, payload);
        console.log('Update response:', response.data);
      } else {
        console.log('Creating color:', payload);
        const response = await axios.post(API_URL, payload);
        console.log('Create response:', response.data);
      }
      await fetchColors();
      setSelectedColor(null);
    } catch (err: unknown) {
      console.error('Error saving color:', err);
      let errorMessage = 'Failed to save color';
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

  // Handle row click — populate form
  const handleRowClick = (color: Color) => {
    setSelectedColor(color);
  };

  // Cancel edit
  const handleCancel = () => {
    setSelectedColor(null);
  };

  const columns: Column<Color>[] = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'hexCode', label: 'Hex Code' },
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
        Manage Colors
      </Typography>

      <Box sx={{ display: 'flex', gap: 3, width: '100%', flexDirection: { xs: 'column', md: 'row' } }}>
        {/* Left Side - Form (30%) */}
        <Box sx={{ width: { xs: '100%', md: '30%' }, flexShrink: 0 }}>
          <CustomForm
            title="Color Details"
            fields={[
              { key: 'name', label: 'Name', required: true },
              { key: 'hexCode', label: 'Hex Code (e.g., #00FF00)', required: false },
              { key: 'description', label: 'Description', required: false },
            ]}
            onSubmit={handleAddOrUpdate}
            initialData={
              selectedColor
                ? {
                    name: selectedColor.name,
                    hexCode: selectedColor.hexCode || '',
                    description: selectedColor.description || '',
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
          <CustomTable<Color>
            columns={columns}
            rows={filteredColors}
            onRowClick={handleRowClick}
            loading={loading}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default Colors;

