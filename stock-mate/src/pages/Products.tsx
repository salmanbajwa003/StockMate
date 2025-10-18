import { Box, Typography } from '@mui/material';
import CustomForm from '../components/CustomForm';
import CustomTable from '../components/CustomTable';
import { useState } from 'react';

interface Item {
  id: number;
  name: string;
  type: string;
  quantity: number;
  unit: string;
  rate: number;
  warehouse: string;
}

const Products = () => {
  const [rows, setRows] = useState<Item[]>([
    {
      id: 1,
      name: 'Khaddar Shirt',
      type: 'Khaddar',
      quantity: 20.5,
      unit: 'Meter',
      rate: 950,
      warehouse: 'Lahore',
    },
  ]);

  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  // ✅ Add or Update Handler
  const handleAddOrUpdate = (data: Record<string, string | number>) => {
    const newItem: Item = {
      id: Number(data.id) || Date.now(),
      name: String(data.name),
      type: String(data.type),
      quantity: Number(data.quantity),
      unit: String(data.unit),
      rate: Number(data.rate),
      warehouse: String(data.warehouse),
    };

    if (selectedItem) {
      // Update existing
      setRows((prev) => prev.map((r) => (r.id === selectedItem.id ? newItem : r)));
      setSelectedItem(null);
    } else {
      // Add new
      setRows((prev) => [...prev, newItem]);
    }
  };

  // ✅ Row Click to Edit
  const handleRowClick = (item: Item) => {
    setSelectedItem(item);
  };

  // ✅ Cancel Editing
  const handleCancel = () => {
    setSelectedItem(null);
  };

  const columns = [
    { key: 'id', label: 'ID', align: 'right' },
    { key: 'name', label: 'Item Name' },
    { key: 'type', label: 'Type' },
    { key: 'quantity', label: 'Quantity', align: 'right' },
    { key: 'unit', label: 'Unit' },
    { key: 'rate', label: 'Price per Meter', align: 'right' },
    { key: 'warehouse', label: 'Warehouse' },
  ];

  const fields = [
    { key: 'id', label: 'ID', type: 'number' },
    { key: 'name', label: 'Item Name' },
    { key: 'type', label: 'Type' },
    { key: 'quantity', label: 'Quantity', type: 'number' },
    {
      key: 'unit',
      label: 'Unit',
      type: 'select',
      options: ['Meter', 'Kg', 'Yard'], // ✅ Dropdown values
    },
    { key: 'rate', label: 'Price per Meter', type: 'number' },
    { key: 'warehouse', label: 'Warehouse' },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography
        variant="h5"
        sx={{
          mb: 2,
          fontWeight: 'bold',
          color: '#1976d2',
        }}
      >
        Manage Items
      </Typography>

      {/* ✅ Custom Form */}
      <CustomForm
        fields={fields}
        onSubmit={handleAddOrUpdate}
        initialData={
          selectedItem
            ? (Object.fromEntries(Object.entries(selectedItem)) as Record<string, string | number>)
            : null
        }
        onCancel={handleCancel}
      />

      {/* ✅ Table with Row Click */}
      <CustomTable<Item> columns={columns} rows={rows} onRowClick={handleRowClick} />
    </Box>
  );
};

export default Products;
