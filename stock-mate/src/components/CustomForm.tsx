import { useEffect, useState } from 'react';
import { Box, TextField, Button, Paper, MenuItem, Typography } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import type { FormField } from '../utils/types';

interface CustomFormProps {
  fields: FormField[];
  onSubmit: (formData: Record<string, string | number>) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialData?: Record<string, any> | null;
  onCancel?: () => void;
  title?: string;
}

const CustomForm = ({ fields, onSubmit, initialData, onCancel, title }: CustomFormProps) => {
  const [formData, setFormData] = useState<Record<string, string | number | Dayjs | null>>({});
  const [errors, setErrors] = useState<Record<string, string>>({}); // ✅ store error messages instead of booleans

  useEffect(() => {
    if (initialData) {
      const processedData: Record<string, string | number | Dayjs | null> = {};
      fields.forEach((field) => {
        if (field.type === 'date' && initialData[field.key]) {
          processedData[field.key] = dayjs(initialData[field.key]);
        } else {
          processedData[field.key] = initialData[field.key] ?? '';
        }
      });
      setFormData(processedData);
    } else {
      const emptyForm = fields.reduce((acc, field) => {
        acc[field.key] = field.type === 'date' ? null : '';
        return acc;
      }, {} as Record<string, string | number | Dayjs | null>);
      setFormData(emptyForm);
    }
    setErrors({});
  }, [initialData, fields]);

  const handleChange = (key: string, value: string | Dayjs | null) => {
    setFormData((prev) => ({ ...prev, [key]: value }));

    // Clear error dynamically when user fixes input
    setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    fields.forEach((field) => {
      const value = formData[field.key];
      const isRequired = field.required === true; // Only required if explicitly set to true

      // 🔹 Required field check (only if field is marked as required)
      if (isRequired) {
        if (field.type === 'date') {
          if (!value || !dayjs.isDayjs(value) || !value.isValid()) {
            newErrors[field.key] = 'Required';
            isValid = false;
            return;
          }
        } else {
          const stringValue = String(value ?? '').trim();
          if (!stringValue) {
            newErrors[field.key] = 'Required';
            isValid = false;
            return;
          }

          // 🔹 Phone field validation
          if (
            field.key === 'phone' ||
            field.key === 'phone_number2' ||
            field.key === 'phone_number3'
          ) {
            const phoneRegex = /^03\d{9}$/; // must start with 03 and have 11 digits total
            if (stringValue && !phoneRegex.test(stringValue)) {
              newErrors[field.key] =
                'Invalid phone number (must start with 03 and be 11 digits long)';
              isValid = false;
            }
          }

          // 🔹 Email validation
          if (field.type === 'email') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (stringValue && !emailRegex.test(stringValue)) {
              newErrors[field.key] = 'Invalid email address';
              isValid = false;
            }
          }

          // 🔹 Hex code validation for colors
          if (field.key === 'hexCode' && stringValue) {
            const hexRegex = /^#[0-9A-F]{6}$/i;
            if (!hexRegex.test(stringValue)) {
              newErrors[field.key] = 'Must be a valid hex color code (e.g., #00FF00)';
              isValid = false;
            }
          }
        }
      } else {
        // Optional fields - still validate format if value is provided
        if (value) {
          const stringValue = String(value ?? '').trim();

          if (field.type === 'email' && stringValue) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(stringValue)) {
              newErrors[field.key] = 'Invalid email address';
              isValid = false;
            }
          }

          if (field.key === 'hexCode' && stringValue) {
            const hexRegex = /^#[0-9A-F]{6}$/i;
            if (!hexRegex.test(stringValue)) {
              newErrors[field.key] = 'Must be a valid hex color code (e.g., #00FF00)';
              isValid = false;
            }
          }
        }
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      console.log('Form validation failed');
      return;
    }

    // Convert date fields to string format for submission
    const submitData: Record<string, string | number> = {};
    Object.keys(formData).forEach((key) => {
      const value = formData[key];
      const field = fields.find((f) => f.key === key);

      if (dayjs.isDayjs(value)) {
        submitData[key] = value.format('YYYY-MM-DD');
      } else if (value !== null && value !== undefined && value !== '') {
        // Convert to number if field type is number
        if (field?.type === 'number') {
          const numValue = Number(value);
          if (!isNaN(numValue)) {
            submitData[key] = numValue;
          }
        } else {
          submitData[key] = value as string | number;
        }
      }
    });

    console.log('Form submitting with data:', submitData);
    onSubmit(submitData);
  };

  const isEditMode = Boolean(initialData);

  return (
    <Paper
      elevation={2}
      sx={{
        p: 2,
        mb: 3,
        borderRadius: 1,
        backgroundColor: '#fafafa',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        {title && (
          <Typography
            variant="h6"
            sx={{
              mb: 2,
              fontWeight: 'bold',
              color: '#1976d2',
            }}
          >
            {title}
          </Typography>
        )}
        <Box sx={{ width: '100%', display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {fields.map((field, index) => {
            const isSelect = field.options && field.options.length > 0;
            const isDate = field.type === 'date';
            // Check if options are objects with id/name structure
            const hasObjectOptions =
              isSelect &&
              field.options &&
              field.options.length > 0 &&
              typeof field.options[0] === 'object' &&
              'id' in field.options[0];
            // If it's the last field and there's an odd number of fields, make it full width
            const isLastOddField = fields.length % 2 !== 0 && index === fields.length - 1;
            return (
              <Box
                key={field.key}
                sx={{
                  width: { xs: '100%', sm: isLastOddField ? '100%' : 'calc(50% - 8px)' },
                  boxSizing: 'border-box',
                  flexGrow: 0,
                  flexShrink: 0,
                }}
              >
                {isDate ? (
                  <DatePicker
                    label={field.label}
                    value={
                      formData[field.key]
                        ? dayjs.isDayjs(formData[field.key])
                          ? (formData[field.key] as Dayjs)
                          : dayjs(formData[field.key] as string)
                        : null
                    }
                    onChange={(date) => handleChange(field.key, date)}
                    slotProps={{
                      textField: {
                        size: 'small',
                        fullWidth: true,
                        required: field.required === true,
                        error: !!errors[field.key],
                        helperText: errors[field.key] || ' ',
                        sx: { width: '100%' },
                      },
                    }}
                  />
                ) : (
                  <TextField
                    select={isSelect}
                    label={field.label}
                    type={isSelect ? undefined : field.type || 'text'}
                    value={formData[field.key] ?? ''}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    error={!!errors[field.key]}
                    helperText={errors[field.key] || ' '}
                    size="small"
                    fullWidth
                    required={field.required === true}
                    sx={{ width: '100%' }}
                  >
                    {isSelect &&
                      field.options?.map((option) => {
                        // Handle object options (id/name structure)
                        if (hasObjectOptions && typeof option === 'object' && 'id' in option) {
                          return (
                            <MenuItem key={option.id} value={option.id}>
                              {option.name}
                            </MenuItem>
                          );
                        }
                        // Handle string options
                        return (
                          <MenuItem key={option as string} value={option as string}>
                            {option as string}
                          </MenuItem>
                        );
                      })}
                  </TextField>
                )}
              </Box>
            );
          })}

          <Box sx={{ width: '100%' }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                type="submit"
                variant="contained"
                sx={{
                  flex: 1,
                  backgroundColor: '#1976d2',
                  ':hover': {
                    backgroundColor: '#1565c0',
                  },
                }}
              >
                {isEditMode ? 'Save' : 'Add'}
              </Button>

              {isEditMode && (
                <Button type="button" variant="outlined" sx={{ flex: 1 }} onClick={onCancel}>
                  Cancel
                </Button>
              )}
            </Box>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};

export default CustomForm;
