import { Box, TextField, MenuItem, Paper } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import type { SearchOption } from '../utils/types';

interface CustomSearchFilterProps {
  searchKey: string;
  searchValue: string | Dayjs | null;
  options: SearchOption[];
  onKeyChange: (value: string) => void;
  onValueChange: (value: any) => void;
}

const CustomSearchFilter: React.FC<CustomSearchFilterProps> = ({
  searchKey,
  searchValue,
  options,
  onKeyChange,
  onValueChange,
}) => {
  const selectedOption = options.find((opt) => opt.value === searchKey);
  const inputType = selectedOption?.type || 'text';

  return (
    <Paper
      elevation={2}
      sx={{
        p: 2,
        mb: 2,
        borderRadius: 1,
        backgroundColor: '#ffffff',
        width: '100%',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          alignItems: 'center',
          justifyContent: 'flex-start',
          width: '100%',
        }}
      >
        {/* Filter Field Selector */}
        <TextField
          select
          label="Search By"
          size="small"
          value={searchKey}
          onChange={(e) => onKeyChange(e.target.value)}
          sx={{ minWidth: 200, flexShrink: 0 }}
        >
          {options.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </TextField>

        {/* Dynamic Search Input */}
        {inputType === 'date' ? (
          <DatePicker
            label="Select Date"
            value={searchValue ? dayjs(searchValue) : null}
            onChange={(date) => onValueChange(date)}
            slotProps={{
              textField: {
                size: 'small',
                sx: { minWidth: 220, flex: 1 },
              },
            }}
          />
        ) : (
          <TextField
            label="Search"
            size="small"
            value={typeof searchValue === 'string' ? searchValue : ''}
            onChange={(e) => onValueChange(e.target.value)}
            sx={{ minWidth: 220, flex: 1 }}
            fullWidth
          />
        )}
      </Box>
    </Paper>
  );
};

export default CustomSearchFilter;
