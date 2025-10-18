import { useState } from "react";
import { Box, Typography } from "@mui/material";
import CustomForm from "../components/CustomForm";
import CustomTable from "../components/CustomTable";

interface Item {
  id: number;
  itemName: string;
  type: string;
  quantity: number;
  pricePerMeter: number;
  totalStock: number;
}

const Inventory = () => {
  const [rows, setRows] = useState<Item[]>([
    {
      id: 1,
      itemName: "Linen Fabric",
      type: "Linen",
      quantity: 120,
      pricePerMeter: 450,
      totalStock: 54000,
    },
  ]);

  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  const columns = [
    { key: "id", label: "ID" },
    { key: "itemName", label: "Item Name" },
    { key: "type", label: "Type" },
    { key: "quantity", label: "Quantity (m)" },
    { key: "pricePerMeter", label: "Price per Meter" },
    { key: "totalStock", label: "Total Stock" },
  ];

  const handleAddOrUpdate = (data: Record<string, string | number>) => {
    const updatedItem: Item = {
      id: Number(data.id),
      itemName: String(data.itemName),
      type: String(data.type),
      quantity: Number(data.quantity),
      pricePerMeter: Number(data.pricePerMeter),
      totalStock:
        Number(data.quantity) * Number(data.pricePerMeter) ||
        Number(data.totalStock),
    };

    if (selectedItem) {
      // update
      setRows((prev) =>
        prev.map((r) => (r.id === selectedItem.id ? updatedItem : r))
      );
      setSelectedItem(null);
    } else {
      // add new
      setRows((prev) => [...prev, updatedItem]);
    }
  };

  const handleRowClick = (item: Item) => {
    setSelectedItem(item);
  };

  const handleCancel = () => {
    setSelectedItem(null);
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
        Manage Products
      </Typography>

      <CustomForm
        fields={[
          { key: "id", label: "ID", type: "number" },
          { key: "itemName", label: "Item Name" },
          { key: "type", label: "Type" },
          { key: "quantity", label: "Quantity (m)", type: "number" },
          { key: "pricePerMeter", label: "Price per Meter", type: "number" },
          { key: "totalStock", label: "Total Stock", type: "number" },
        ]}
        onSubmit={handleAddOrUpdate}
        initialData={
          selectedItem
            ? (Object.fromEntries(Object.entries(selectedItem)) as Record<
                string,
                string | number
              >)
            : null
        }
        onCancel={handleCancel}
      />

      <CustomTable<Item>
        columns={columns}
        rows={rows}
        onRowClick={handleRowClick}
      />
    </Box>
  );
};

export default Inventory;
