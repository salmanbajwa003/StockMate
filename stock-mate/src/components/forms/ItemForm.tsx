import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  DialogActions,
  DialogContent,
  TextField,
  MenuItem,
  Typography,
} from "@mui/material";

const types = ["Linen", "Khaddar", "Cotton", "Silk"];
const units = ["meter", "kg", "yard"];
const warehouses = ["Lahore", "Faisalabad", "Karachi", "Multan"];

type FormValues = {
  name: string;
  type: string;
  quantity: number | "";
  unit: string;
  rate: number | "";
  warehouse: string;
};

const empty: FormValues = {
  name: "",
  type: types[0],
  quantity: "",
  unit: units[0],
  rate: "",
  warehouse: warehouses[0],
};

const ItemForm: React.FC<{
  initial?: Partial<FormValues>;
  onSubmit: (v: FormValues) => void;
  onCancel: () => void;
}> = ({ initial, onSubmit, onCancel }) => {
  const [values, setValues] = useState<FormValues>({
    ...empty,
    ...initial,
  } as FormValues);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(
    () => setValues({ ...empty, ...(initial ?? {}) } as FormValues),
    [initial]
  );

  const handle =
    (key: keyof FormValues) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      setValues((prev) => ({
        ...prev,
        [key]:
          key === "quantity" || key === "rate"
            ? raw === ""
              ? ""
              : Number(raw)
            : raw,
      }));
    };

  const validate = () => {
    const err: Record<string, string> = {};
    if (!values.name.trim()) err.name = "Enter item name";
    if (!values.quantity && values.quantity !== 0)
      err.quantity = "Enter quantity";
    if (!values.rate && values.rate !== 0) err.rate = "Enter rate";
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(values);
  };

  return (
    <form onSubmit={submit}>
      <DialogContent>
        <Box sx={{ display: "grid", gap: 2, width: 420, p: 1 }}>
          <Typography variant="subtitle1">
            {initial ? "Edit Item" : "Add Item"}
          </Typography>

          <TextField
            label="Item name"
            value={values.name}
            onChange={handle("name")}
            error={!!errors.name}
            helperText={errors.name}
            required
          />

          <TextField
            select
            label="Type"
            value={values.type}
            onChange={handle("type")}
          >
            {types.map((t) => (
              <MenuItem key={t} value={t}>
                {t}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Quantity"
            type="number"
            value={values.quantity}
            onChange={handle("quantity")}
            error={!!errors.quantity}
            helperText={errors.quantity}
            required
          />

          <TextField
            select
            label="Unit"
            value={values.unit}
            onChange={handle("unit")}
          >
            {units.map((u) => (
              <MenuItem key={u} value={u}>
                {u}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Rate"
            type="number"
            value={values.rate}
            onChange={handle("rate")}
            error={!!errors.rate}
            helperText={errors.rate}
            required
          />

          <TextField
            select
            label="Warehouse"
            value={values.warehouse}
            onChange={handle("warehouse")}
          >
            {warehouses.map((w) => (
              <MenuItem key={w} value={w}>
                {w}
              </MenuItem>
            ))}
          </TextField>
        </Box>
      </DialogContent>

      <DialogActions sx={{ pr: 3, pb: 2 }}>
        <Button onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="contained">
          Save
        </Button>
      </DialogActions>
    </form>
  );
};

export default ItemForm;
