import { useEffect, useState } from "react";
import { Box, TextField, Button, Paper, MenuItem } from "@mui/material";

interface Field {
  key: string;
  label: string;
  type?: string;
  options?: string[]; // ✅ added support for select options
}

interface CustomFormProps {
  fields: Field[];
  onSubmit: (formData: Record<string, string | number>) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialData?: Record<string, any> | null;
  onCancel?: () => void;
}

const CustomForm = ({
  fields,
  onSubmit,
  initialData,
  onCancel,
}: CustomFormProps) => {
  const [formData, setFormData] = useState<Record<string, string | number>>({});
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      const emptyForm = fields.reduce((acc, field) => {
        acc[field.key] = "";
        return acc;
      }, {} as Record<string, string | number>);
      setFormData(emptyForm);
    }
    setErrors({});
  }, [initialData, fields]);

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (value.trim() !== "") {
      setErrors((prev) => ({ ...prev, [key]: false }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, boolean> = {};
    let isValid = true;

    fields.forEach((field) => {
      const value = String(formData[field.key] ?? "").trim();
      if (!value) {
        newErrors[field.key] = true;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    onSubmit(formData);
  };

  const isEditMode = Boolean(initialData);

  return (
    <Paper
      elevation={2}
      sx={{
        p: 2,
        mb: 3,
        borderRadius: 1,
        backgroundColor: "#fafafa",
      }}
    >
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 2,
          alignItems: "center",
        }}
      >
        {fields.map((field) => {
          const isSelect = field.options && field.options.length > 0;
          return (
            <TextField
              select={isSelect}
              key={field.key}
              label={field.label}
              type={isSelect ? undefined : field.type || "text"}
              value={formData[field.key] ?? ""}
              onChange={(e) => handleChange(field.key, e.target.value)}
              error={!!errors[field.key]}
              helperText={errors[field.key] ? "Required" : ""}
              size="small"
              sx={{ flex: "1 1 200px" }}
            >
              {isSelect &&
                field.options?.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
            </TextField>
          );
        })}

        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            type="submit"
            variant="contained"
            sx={{
              backgroundColor: "#1976d2",
              ":hover": {
                backgroundColor: "#1565c0",
              },
            }}
          >
            {isEditMode ? "Save" : "Add"}
          </Button>

          {isEditMode && (
            <Button
              type="button"
              variant="outlined"
              // color="error"
              onClick={onCancel}
            >
              Cancel
            </Button>
          )}
        </Box>
      </Box>
    </Paper>
  );
};

export default CustomForm;
