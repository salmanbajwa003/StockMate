import { useState } from 'react';
import { Box, Typography } from '@mui/material';
import CustomForm from '../components/CustomForm';
import CustomTable from '../components/CustomTable';

interface WarehouseType {
  id: number;
  name: string;
  address: string;
  city?: string;
  capacity?: number;
}

const Warehouse = () => {
  const [warehouses, setWarehouses] = useState<WarehouseType[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<WarehouseType | null>(null);

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'address', label: 'Address' },
    { key: 'city', label: 'City' },
    { key: 'capacity', label: 'Capacity' },
  ];

  const handleAddOrUpdate = (data: Record<string, string | number | boolean>) => {
    const newWarehouse: WarehouseType = {
      id: Number(data.id) || Date.now(),
      name: String(data.name),
      address: String(data.address),
      city: data.city ? String(data.city) : '',
      capacity: data.capacity ? Number(data.capacity) : undefined,
    };

    if (selectedWarehouse) {
      // update
      setWarehouses((prev) => prev.map((w) => (w.id === selectedWarehouse.id ? newWarehouse : w)));
      setSelectedWarehouse(null);
    } else {
      // add new
      setWarehouses((prev) => [...prev, newWarehouse]);
    }
  };

  const handleRowClick = (warehouse: WarehouseType) => {
    setSelectedWarehouse(warehouse);
  };

  const handleCancel = () => {
    setSelectedWarehouse(null);
  };

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
        Manage Warehouses
      </Typography>

      <CustomForm
        fields={[
          { key: 'id', label: 'ID', type: 'number' },
          { key: 'name', label: 'Name' },
          { key: 'address', label: 'Address' },
          { key: 'city', label: 'City' },
          { key: 'capacity', label: 'Capacity', type: 'number' },
        ]}
        onSubmit={handleAddOrUpdate}
        initialData={
          selectedWarehouse
            ? (Object.fromEntries(Object.entries(selectedWarehouse)) as Record<
                string,
                string | number | boolean
              >)
            : null
        }
        onCancel={handleCancel}
      />

      <CustomTable<WarehouseType> columns={columns} rows={warehouses} onRowClick={handleRowClick} />
    </Box>
  );
};

export default Warehouse;
