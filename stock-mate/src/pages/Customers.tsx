import { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import axios from 'axios';
import dayjs from 'dayjs';
import CustomForm from '../components/CustomForm';
import CustomTable from '../components/CustomTable';
import CustomSearchFilter from '../components/CustomSearchFilter';
import type { SearchOption, Customer, Column } from '../utils/types';
import { API_ENDPOINTS } from '../utils/constants';

const API_URL = API_ENDPOINTS.CUSTOMERS;

const Customers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchKey, setSearchKey] = useState<string>('name');
  const [searchValue, setSearchValue] = useState<string>('');

  // Search options based on backend fields
  const searchOptions: SearchOption[] = [
    { label: 'By Name', value: 'name' },
    // { label: 'By Email', value: 'email' }, // Commented out
    { label: 'By Phone', value: 'phone' },
    { label: 'By ID', value: 'id' },
  ];

  // ✅ Fetch all customers
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await axios.get<Customer[]>(API_URL);
      setCustomers(res.data);
      setFilteredCustomers(res.data);
    } catch (err) {
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Filter customers based on search
  useEffect(() => {
    if (!searchValue.trim()) {
      setFilteredCustomers(customers);
      return;
    }

    const filtered = customers.filter((customer) => {
      const fieldValue = String(customer[searchKey as keyof Customer] || '').toLowerCase();
      return fieldValue.includes(searchValue.toLowerCase());
    });

    setFilteredCustomers(filtered);
  }, [searchValue, searchKey, customers]);

  // ✅ Add or Update Customer
  const handleAddOrUpdate = async (data: Record<string, string | number>) => {
    try {
      setSaving(true);
      const payload: Record<string, string> = {
        name: String(data.name),
        phone: String(data.phone),
        // email: String(data.email), // Commented out
      };

      // Add optional fields if they exist
      if (data.phone_number2) payload.phone_number2 = String(data.phone_number2);
      // if (data.phone_number3) payload.phone_number3 = String(data.phone_number3); // Commented out
      if (data.address) payload.address = String(data.address);
      if (data.driver_name) payload.driver_name = String(data.driver_name);
      if (data.vehicle_make) payload.vehicle_make = String(data.vehicle_make);
      if (data.driver_no) payload.driver_no = String(data.driver_no);

      if (selectedCustomer) {
        // Update existing
        console.log('Updating customer:', selectedCustomer.id, payload);
        const response = await axios.patch(`${API_URL}/${selectedCustomer.id}`, payload);
        console.log('Update response:', response.data);
      } else {
        // Add new
        console.log('Creating customer:', payload);
        const response = await axios.post(API_URL, payload);
        console.log('Create response:', response.data);
      }
      await fetchCustomers();
      setSelectedCustomer(null); // reset form after saving
    } catch (err: unknown) {
      console.error('Error saving customer:', err);
      let errorMessage = 'Failed to save customer';
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

  // ✅ Handle row click — populate form
  const handleRowClick = (customer: Customer) => {
    setSelectedCustomer(customer);
  };

  // ✅ Cancel edit
  const handleCancel = () => {
    setSelectedCustomer(null);
  };

  const columns: Column<Customer>[] = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    // { key: 'email', label: 'Email' }, // Commented out
    {
      key: 'phone',
      label: 'Phone Numbers',
      render: (row: Customer) => {
        const phones = [row.phone, row.phone_number2].filter(Boolean); // Removed phone_number3
        return phones.length > 0 ? phones.join(', ') : '-';
      },
    },
    { key: 'address', label: 'Address' },
    { key: 'driver_name', label: 'Driver Name' },
    { key: 'vehicle_make', label: 'Vehicle Make' },
    { key: 'driver_no', label: 'Driver No.' },
    {
      key: 'updatedAt',
      label: 'Date',
      render: (row: Customer) => {
        const updatedAt = row.updatedAt;
        if (updatedAt) {
          return dayjs(updatedAt).format('DD-MM-YYYY');
        }
        return '-';
      },
    },
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
        Manage Customers
      </Typography>

      <Box
        sx={{ display: 'flex', gap: 3, width: '100%', flexDirection: { xs: 'column', md: 'row' } }}
      >
        {/* Left Side - Form (30%) */}
        <Box sx={{ width: { xs: '100%', md: '30%' }, flexShrink: 0 }}>
          <CustomForm
            title="Customer Details"
            fields={[
              { key: 'name', label: 'Name', required: true },
              // { key: 'email', label: 'Email', type: 'email', required: true }, // Commented out
              { key: 'phone', label: 'Phone', required: true },
              { key: 'phone_number2', label: 'Phone Number 2', required: false },
              // { key: 'phone_number3', label: 'Phone Number 3', required: false }, // Commented out
              { key: 'address', label: 'Address', required: false },
              { key: 'driver_name', label: 'Driver Name', required: false },
              { key: 'vehicle_make', label: 'Vehicle Make', required: false },
              { key: 'driver_no', label: 'Driver No.', required: false },
            ]}
            onSubmit={handleAddOrUpdate}
            initialData={
              selectedCustomer
                ? {
                    name: selectedCustomer.name,
                    // email: selectedCustomer.email, // Commented out
                    phone: selectedCustomer.phone || '',
                    phone_number2: selectedCustomer.phone_number2 || '',
                    // phone_number3: selectedCustomer.phone_number3 || '', // Commented out
                    address: selectedCustomer.address || '',
                    driver_name: selectedCustomer.driver_name || '',
                    vehicle_make: selectedCustomer.vehicle_make || '',
                    driver_no: selectedCustomer.driver_no || '',
                  }
                : null
            }
            onCancel={handleCancel}
            loading={saving}
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
          <CustomTable<Customer>
            columns={columns}
            rows={filteredCustomers}
            onRowClick={handleRowClick}
            loading={loading}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default Customers;
