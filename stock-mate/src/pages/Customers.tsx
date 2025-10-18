import { useState } from "react";
import { Box, Typography } from "@mui/material";
import CustomForm from "../components/CustomForm";
import CustomTable from "../components/CustomTable";

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
}

const Customers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );

  const columns = [
    { key: "id", label: "ID" },
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "address", label: "Address" },
  ];

  const handleAddOrUpdate = (data: Record<string, string | number>) => {
    const newCustomer: Customer = {
      id: Number(data.id) || Date.now(), // if no ID entered, generate one
      name: String(data.name),
      email: String(data.email),
      phone: String(data.phone),
      address: String(data.address),
    };

    if (selectedCustomer) {
      // Update existing
      setCustomers((prev) =>
        prev.map((c) => (c.id === selectedCustomer.id ? newCustomer : c))
      );
      setSelectedCustomer(null);
    } else {
      // Add new
      setCustomers((prev) => [...prev, newCustomer]);
    }
  };

  const handleRowClick = (customer: Customer) => {
    setSelectedCustomer(customer);
  };

  const handleCancel = () => {
    setSelectedCustomer(null);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography
        variant="h5"
        sx={{
          mb: 2,
          fontWeight: "bold",
          color: "#1976d2",
        }}
      >
        Manage Customers
      </Typography>

      <CustomForm
        fields={[
          { key: "id", label: "ID", type: "number" },
          { key: "name", label: "Name" },
          { key: "email", label: "Email", type: "email" },
          { key: "phone", label: "Phone" },
          { key: "address", label: "Address" },
        ]}
        onSubmit={handleAddOrUpdate}
        initialData={
          selectedCustomer
            ? (Object.fromEntries(Object.entries(selectedCustomer)) as Record<
                string,
                string | number
              >)
            : null
        }
        onCancel={handleCancel}
      />

      <CustomTable<Customer>
        columns={columns}
        rows={customers}
        onRowClick={handleRowClick}
      />
    </Box>
  );
};

export default Customers;
