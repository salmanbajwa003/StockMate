import { useState } from 'react';
import { Box, TextField, MenuItem, Paper } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import type { SearchOption } from '../utils/types';

interface DateRange {
  start: Dayjs | null;
  end: Dayjs | null;
}

interface CustomSearchFilterProps {
  searchKey: string;
  searchValue: string | Dayjs | null | DateRange;
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
  const [openStartPicker, setOpenStartPicker] = useState(false);
  const [openEndPicker, setOpenEndPicker] = useState(false);
  const [openDatePicker, setOpenDatePicker] = useState(false);
  
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
        {inputType === 'dateRange' ? (
          <Box sx={{ display: 'flex', gap: 1, flex: 1, alignItems: 'center' }}>
            <DatePicker
              label="Start Date"
              format="DD-MM-YYYY"
              open={openStartPicker}
              onOpen={() => setOpenStartPicker(true)}
              onClose={() => setOpenStartPicker(false)}
              slots={{
                openPickerIcon: () => null,
              }}
              slotProps={{
                textField: {
                  size: 'small',
                  sx: { 
                    flex: 1,
                    '& .MuiInputBase-input': {
                      cursor: 'pointer',
                    },
                  },
                  placeholder: 'DD-MM-YYYY',
                  onClick: () => setOpenStartPicker(true),
                  InputProps: {
                    readOnly: true,
                    endAdornment: null,
                  },
                },
              }}
              value={
                searchValue && typeof searchValue === 'object' && 'start' in searchValue
                  ? searchValue.start
                  : null
              }
              onChange={(date) => {
                const currentRange =
                  searchValue && typeof searchValue === 'object' && 'start' in searchValue
                    ? (searchValue as DateRange)
                    : { start: null, end: null };
                onValueChange({ ...currentRange, start: date });
                setOpenStartPicker(false);
              }}
            />
            <DatePicker
              label="End Date"
              format="DD-MM-YYYY"
              open={openEndPicker}
              onOpen={() => setOpenEndPicker(true)}
              onClose={() => setOpenEndPicker(false)}
              slots={{
                openPickerIcon: () => null,
              }}
              slotProps={{
                textField: {
                  size: 'small',
                  sx: { 
                    flex: 1,
                    '& .MuiInputBase-input': {
                      cursor: 'pointer',
                    },
                  },
                  placeholder: 'DD-MM-YYYY',
                  onClick: () => setOpenEndPicker(true),
                  InputProps: {
                    readOnly: true,
                    endAdornment: null,
                  },
                },
              }}
              value={
                searchValue && typeof searchValue === 'object' && 'end' in searchValue
                  ? searchValue.end
                  : null
              }
              onChange={(date) => {
                const currentRange =
                  searchValue && typeof searchValue === 'object' && 'end' in searchValue
                    ? (searchValue as DateRange)
                    : { start: null, end: null };
                onValueChange({ ...currentRange, end: date });
                setOpenEndPicker(false);
              }}
            />
          </Box>
        ) : inputType === 'date' ? (
          <DatePicker
            label="Select Date"
            format="DD-MM-YYYY"
            open={openDatePicker}
            onOpen={() => setOpenDatePicker(true)}
            onClose={() => setOpenDatePicker(false)}
            slots={{
              openPickerIcon: () => null,
            }}
            slotProps={{
              textField: {
                size: 'small',
                sx: { 
                  minWidth: 220, 
                  flex: 1,
                  '& .MuiInputBase-input': {
                    cursor: 'pointer',
                  },
                },
                placeholder: 'DD-MM-YYYY',
                onClick: () => setOpenDatePicker(true),
                InputProps: {
                  readOnly: true,
                  endAdornment: null,
                },
              },
            }}
            value={searchValue && typeof searchValue !== 'object' ? dayjs(searchValue) : null}
            onChange={(date) => {
              onValueChange(date);
              setOpenDatePicker(false);
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
