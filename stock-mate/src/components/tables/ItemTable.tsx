import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Typography,
  Box,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

type Item = {
  id: number;
  name: string;
  type: string;
  quantity: number;
  unit: string;
  rate: number;
  warehouse: string;
};

const ItemTable: React.FC<{
  items: Item[];
  onEdit: (it: Item) => void;
  onDelete: (id: number) => void;
}> = ({ items, onEdit, onDelete }) => {
  if (!items.length) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography>No items yet. Click “Add Item” to create one.</Typography>
      </Box>
    );
  }

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small" aria-label="items table">
        <TableHead>
          <TableRow>
            <TableCell>
              <strong>Name</strong>
            </TableCell>
            <TableCell>
              <strong>Type</strong>
            </TableCell>
            <TableCell>
              <strong>Qty</strong>
            </TableCell>
            <TableCell>
              <strong>Unit</strong>
            </TableCell>
            <TableCell>
              <strong>Rate</strong>
            </TableCell>
            <TableCell>
              <strong>Warehouse</strong>
            </TableCell>
            <TableCell>
              <strong>Value</strong>
            </TableCell>
            <TableCell align="center">
              <strong>Actions</strong>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((i) => (
            <TableRow key={i.id}>
              <TableCell>{i.name}</TableCell>
              <TableCell>{i.type}</TableCell>
              <TableCell>{i.quantity}</TableCell>
              <TableCell>{i.unit}</TableCell>
              <TableCell>{i.rate}</TableCell>
              <TableCell>{i.warehouse}</TableCell>
              <TableCell>{(i.quantity * i.rate).toFixed(2)}</TableCell>
              <TableCell align="center">
                <IconButton
                  size="small"
                  onClick={() => onEdit(i)}
                  aria-label={`edit ${i.name}`}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => onDelete(i.id)}
                  aria-label={`delete ${i.name}`}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ItemTable;
