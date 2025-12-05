import { useEffect, useState, useRef } from 'react';
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  CircularProgress,
  Autocomplete,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import type { FormField, FormFieldOption } from '../utils/types';

interface CustomFormProps {
  fields: FormField[];
  onSubmit: (formData: Record<string, string | number>) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialData?: Record<string, any> | null;
  onCancel?: () => void;
  title?: string;
  loading?: boolean;
  onFieldChange?: (key: string, value: string | number | Dayjs | null) => void; // Callback when any field changes
}

const CustomForm = ({
  fields,
  onSubmit,
  initialData,
  onCancel,
  title,
  loading = false,
  onFieldChange,
}: CustomFormProps) => {
  const [formData, setFormData] = useState<Record<string, string | number | Dayjs | null>>({});
  const [errors, setErrors] = useState<Record<string, string>>({}); // ✅ store error messages instead of booleans
  // Track raw input values for number fields to allow free typing
  const [numberFieldInputs, setNumberFieldInputs] = useState<Record<string, string>>({});

  // Track if this is the initial mount to prevent overwriting user selections
  const isInitialMountRef = useRef(true);

  useEffect(() => {
    // Only reset form data if initialData changes from null to something, or from something to null
    // Don't reset if user is actively editing (to prevent overwriting selections)
    if (initialData) {
      // Check if this is a new initialData (different selectedItem) or just a re-render
      const processedData: Record<string, string | number | Dayjs | null> = {};
      const numberInputs: Record<string, string> = {};
      fields.forEach((field) => {
        if (field.type === 'date' && initialData[field.key]) {
          processedData[field.key] = dayjs(initialData[field.key]);
        } else {
          // For select fields with object options, ensure IDs are stored as numbers
          const isSelectField = field.options && field.options.length > 0;
          const hasObjectOptions =
            isSelectField &&
            field.options &&
            typeof field.options[0] === 'object' &&
            'id' in field.options[0];

          if (
            hasObjectOptions &&
            initialData[field.key] !== undefined &&
            initialData[field.key] !== null &&
            initialData[field.key] !== ''
          ) {
            // Store as number for ID fields to match option ID types
            const idValue = Number(initialData[field.key]);
            processedData[field.key] = !isNaN(idValue) ? idValue : initialData[field.key];
          } else {
            processedData[field.key] = initialData[field.key] ?? '';
          }

          // For number fields, store the raw string value for display
          if (
            field.type === 'number' &&
            initialData[field.key] !== undefined &&
            initialData[field.key] !== null &&
            initialData[field.key] !== ''
          ) {
            const numValue = Number(String(initialData[field.key]).replace(/,/g, '.'));
            if (!isNaN(numValue)) {
              numberInputs[field.key] = String(numValue);
            }
          }
        }
      });

      // Only update formData if this is the initial mount (first time initialData is set)
      // This prevents overwriting user selections in dropdowns
      if (isInitialMountRef.current) {
        setFormData(processedData);
        isInitialMountRef.current = false;
      }
      // Don't update formData on subsequent initialData changes to preserve user selections

      setNumberFieldInputs((prev) => {
        // Merge with existing, but also clear fields that are not in initialData
        const updated = { ...prev };
        fields.forEach((field) => {
          if (field.type === 'number') {
            if (numberInputs[field.key]) {
              updated[field.key] = numberInputs[field.key];
            } else if (
              initialData[field.key] === undefined ||
              initialData[field.key] === null ||
              initialData[field.key] === ''
            ) {
              // Clear the number input if field is empty in initialData
              delete updated[field.key];
            }
          }
        });
        return updated;
      });
    } else {
      // Reset form completely when initialData is null
      const emptyForm = fields.reduce((acc, field) => {
        acc[field.key] = field.type === 'date' ? null : '';
        return acc;
      }, {} as Record<string, string | number | Dayjs | null>);
      setFormData(emptyForm);
      setNumberFieldInputs({}); // Clear all number field inputs
      isInitialMountRef.current = true; // Reset flag
    }
    setErrors({});
  }, [initialData, fields]);

  // Update form data when initialData changes (for auto-generated fields like product name)
  // This ensures read-only fields and other fields update when initialData changes
  // IMPORTANT: Only update read-only fields, don't interfere with user selections in dropdowns
  useEffect(() => {
    if (initialData) {
      setFormData((prev) => {
        const updated = { ...prev }; // Preserve all existing values
        let hasChanges = false;
        fields.forEach((field) => {
          // Only update read-only fields or fields that are not select/dropdown fields
          // This prevents interference with user selections in dropdowns
          const isSelectField = field.options && field.options.length > 0;
          if (!isSelectField && initialData[field.key] !== undefined) {
            let newValue: string | number | Dayjs | null;
            if (field.type === 'date' && initialData[field.key]) {
              newValue = dayjs.isDayjs(initialData[field.key])
                ? initialData[field.key]
                : dayjs(initialData[field.key]);
            } else {
              newValue = initialData[field.key] ?? '';
            }
            // Compare values properly (handle number/string type mismatches)
            const prevValue = prev[field.key];
            const valuesEqual =
              prevValue === newValue ||
              (prevValue !== null &&
                prevValue !== undefined &&
                newValue !== null &&
                newValue !== undefined &&
                String(prevValue) === String(newValue));
            // Only update if value actually changed
            if (!valuesEqual) {
              updated[field.key] = newValue;
              hasChanges = true;
            }
          }
          // For select fields, don't update from initialData changes to avoid interfering with user selections
        });
        return hasChanges ? updated : prev;
      });
    }
  }, [initialData, fields]);

  const handleChange = (key: string, value: string | number | Dayjs | null) => {
    setFormData((prev) => ({ ...prev, [key]: value }));

    // Clear error dynamically when user fixes input
    setErrors((prev) => ({ ...prev, [key]: '' }));

    // Call the onChange callback if provided
    if (onFieldChange) {
      onFieldChange(key, value);
    }
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
                    format="DD-MM-YYYY"
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
                        disabled: loading || field.disabled === true,
                        sx: { width: '100%' },
                      },
                    }}
                  />
                ) : isSelect ? (
                  <Autocomplete<string | FormFieldOption, false, false, false>
                    options={(field.options || []) as (string | FormFieldOption)[]}
                    getOptionLabel={(option) => {
                      if (typeof option === 'object' && 'id' in option) {
                        return option.name;
                      }
                      return String(option);
                    }}
                    isOptionEqualToValue={(option, value) => {
                      if (!value) return false;
                      if (typeof option === 'object' && 'id' in option) {
                        if (typeof value === 'object' && 'id' in value) {
                          return String(option.id) === String(value.id);
                        }
                        // Compare option.id with value (which might be a number/string)
                        return String(option.id) === String(value);
                      }
                      return String(option) === String(value);
                    }}
                    value={(() => {
                      const fieldValue = formData[field.key];
                      if (fieldValue === null || fieldValue === undefined || fieldValue === '') {
                        return null;
                      }
                      // Find the matching option - ensure proper type comparison
                      const found = field.options?.find((opt) => {
                        if (typeof opt === 'object' && 'id' in opt) {
                          // Compare both as strings to handle type mismatches (number vs string)
                          const optIdStr = String(opt.id);
                          const fieldValStr = String(fieldValue);
                          return optIdStr === fieldValStr;
                        }
                        return String(opt) === String(fieldValue);
                      });
                      return found || null;
                    })()}
                    onChange={(_, newValue) => {
                      // Immediately update the form data with the selected value
                      if (newValue === null) {
                        handleChange(field.key, '');
                        return;
                      }

                      const value =
                        typeof newValue === 'object' && 'id' in newValue ? newValue.id : newValue;

                      // For ID fields, ensure we store as number for consistency
                      // But keep the type that matches the option's ID type
                      const finalValue =
                        value && !isNaN(Number(value)) && field.key.endsWith('Id')
                          ? Number(value)
                          : value;

                      // Update form data immediately
                      handleChange(field.key, finalValue);
                    }}
                    filterOptions={(options, { inputValue }) => {
                      return options.filter((option) => {
                        const label =
                          typeof option === 'object' && 'id' in option
                            ? option.name
                            : String(option);
                        return label.toLowerCase().startsWith(inputValue.toLowerCase());
                      });
                    }}
                    disabled={loading || field.disabled === true}
                    size="small"
                    fullWidth
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label={field.label}
                        required={field.required === true}
                        error={!!errors[field.key]}
                        helperText={errors[field.key] || ' '}
                      />
                    )}
                  />
                ) : (
                  <TextField
                    label={field.label}
                    type={field.type === 'number' ? 'text' : field.type || 'text'}
                    inputMode={field.type === 'number' ? 'decimal' : undefined}
                    value={
                      field.type === 'number'
                        ? numberFieldInputs[field.key] ?? ''
                        : formData[field.key] ?? ''
                    }
                    onChange={(e) => {
                      if (field.readOnly) return; // Prevent changes to read-only fields
                      if (field.type === 'number') {
                        // Replace all commas with dots for decimal input
                        let normalizedValue = e.target.value.replace(/,/g, '.');
                        // Remove any non-numeric characters except dot
                        normalizedValue = normalizedValue.replace(/[^0-9.]/g, '');
                        // Ensure only one dot for decimal
                        const parts = normalizedValue.split('.');
                        if (parts.length > 2) {
                          normalizedValue = parts[0] + '.' + parts.slice(1).join('');
                        }
                        // Limit decimal places to 2 while typing
                        if (normalizedValue.includes('.')) {
                          const [integerPart, decimalPart] = normalizedValue.split('.');
                          if (decimalPart && decimalPart.length > 2) {
                            normalizedValue = integerPart + '.' + decimalPart.substring(0, 2);
                          }
                        }
                        // Store raw input string for display
                        setNumberFieldInputs((prev) => ({ ...prev, [field.key]: normalizedValue }));
                        // Store numeric value in formData for submission
                        if (normalizedValue === '' || normalizedValue === '.') {
                          handleChange(field.key, '');
                        } else {
                          const numValue = Number(normalizedValue);
                          handleChange(field.key, isNaN(numValue) ? 0 : numValue);
                        }
                      } else {
                        handleChange(field.key, e.target.value);
                      }
                    }}
                    onKeyPress={(e) => {
                      // Prevent non-numeric input for number fields
                      if (field.type === 'number' && !field.readOnly) {
                        const char = e.key;
                        // Allow: numbers (0-9), decimal point (.), backspace, delete, arrow keys, etc.
                        const allowedKeys = [
                          '0',
                          '1',
                          '2',
                          '3',
                          '4',
                          '5',
                          '6',
                          '7',
                          '8',
                          '9',
                          '.',
                          'Backspace',
                          'Delete',
                          'ArrowLeft',
                          'ArrowRight',
                          'ArrowUp',
                          'ArrowDown',
                          'Tab',
                          'Enter',
                        ];
                        // Allow control keys (Ctrl, Alt, Meta, etc.)
                        if (e.ctrlKey || e.metaKey || e.altKey) {
                          return;
                        }
                        // Check if the key is allowed
                        if (!allowedKeys.includes(char) && !e.ctrlKey && !e.metaKey && !e.altKey) {
                          e.preventDefault();
                        }
                        // Prevent multiple decimal points
                        if (
                          char === '.' &&
                          (e.currentTarget as HTMLInputElement).value.includes('.')
                        ) {
                          e.preventDefault();
                        }
                      }
                    }}
                    onPaste={(e) => {
                      // Handle paste for number fields - filter out non-numeric characters
                      if (field.type === 'number' && !field.readOnly) {
                        e.preventDefault();
                        const pastedText = e.clipboardData.getData('text');
                        // Replace commas with dots and remove non-numeric characters
                        let normalizedValue = pastedText.replace(/,/g, '.');
                        normalizedValue = normalizedValue.replace(/[^0-9.]/g, '');
                        // Ensure only one dot
                        const parts = normalizedValue.split('.');
                        if (parts.length > 2) {
                          normalizedValue = parts[0] + '.' + parts.slice(1).join('');
                        }
                        // Limit decimal places to 2
                        if (normalizedValue.includes('.')) {
                          const [integerPart, decimalPart] = normalizedValue.split('.');
                          if (decimalPart && decimalPart.length > 2) {
                            normalizedValue = integerPart + '.' + decimalPart.substring(0, 2);
                          }
                        }
                        const value = Number(normalizedValue) || 0;
                        handleChange(field.key, value);
                      }
                    }}
                    onBlur={() => {
                      // Format to 2 decimal places when field loses focus
                      if (field.type === 'number') {
                        const currentInput = numberFieldInputs[field.key] || '';
                        if (currentInput === '' || currentInput === '.') {
                          setNumberFieldInputs((prev) => {
                            const updated = { ...prev };
                            delete updated[field.key];
                            return updated;
                          });
                          handleChange(field.key, '');
                        } else {
                          const normalizedValue = currentInput.replace(/,/g, '.');
                          const numValue = Number(normalizedValue) || 0;
                          // Format to 2 decimal places
                          const formatted = numValue.toFixed(2);
                          setNumberFieldInputs((prev) => ({ ...prev, [field.key]: formatted }));
                          handleChange(field.key, numValue);
                        }
                      }
                    }}
                    error={!!errors[field.key]}
                    helperText={errors[field.key] || ' '}
                    size="small"
                    fullWidth
                    required={field.required === true}
                    disabled={loading || field.disabled === true || field.readOnly === true}
                    InputProps={{
                      readOnly: field.readOnly === true,
                    }}
                    sx={{
                      width: '100%',
                      '& .MuiInputBase-input[readonly]': {
                        backgroundColor: 'rgba(0, 0, 0, 0.04)',
                        cursor: 'default',
                      },
                    }}
                    placeholder={field.type === 'number' ? '0.00' : undefined}
                  />
                )}
              </Box>
            );
          })}

          <Box sx={{ width: '100%' }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                sx={{
                  flex: 1,
                  backgroundColor: '#1976d2',
                  ':hover': {
                    backgroundColor: '#1565c0',
                  },
                }}
              >
                {loading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : isEditMode ? (
                  'Save'
                ) : (
                  'Add'
                )}
              </Button>

              {isEditMode && (
                <Button
                  type="button"
                  variant="outlined"
                  sx={{ flex: 1 }}
                  onClick={onCancel}
                  disabled={loading}
                >
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
