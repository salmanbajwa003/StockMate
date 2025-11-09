import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Box,
  Typography,
} from '@mui/material';
import type { Column } from '../utils/types';

interface CustomTableProps<T = Record<string, unknown>> {
  columns: Column<T>[];
  rows: T[];
  onRowClick?: (row: T) => void;
  onEdit?: (row: T) => void;
  onDelete?: (id: number | string) => void;
  loading?: boolean;
}

const CustomTable = <T extends Record<string, unknown> = Record<string, unknown>>({
  columns,
  rows,
  onRowClick,
  loading, // ✅ accept as prop
}: CustomTableProps<T>) => {
  return (
    <TableContainer component={Paper} sx={{ borderRadius: 1, width: '100%' }}>
      <Table size="small" sx={{ width: '100%' }}>
        <TableHead>
          <TableRow>
            {columns.map((col) => (
              <TableCell
                key={col.key}
                align="left"
                sx={{
                  fontWeight: 'bold',
                  backgroundColor: '#f5f5f5',
                }}
              >
                {col.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>

        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={columns.length} align="center">
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              </TableCell>
            </TableRow>
          ) : rows.length > 0 ? (
            rows.map((row, index) => (
              <TableRow
                key={index}
                onClick={() => onRowClick?.(row)}
                sx={{
                  cursor: onRowClick ? 'pointer' : 'default',
                  '&:hover': { backgroundColor: '#f0f0f0' },
                }}
              >
                {columns.map((col) => (
                  <TableCell key={col.key} align="left">
                    {col.render ? col.render(row) : String(row[col.key] ?? '-')}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} align="center">
                <Typography variant="body2" color="text.secondary">
                  No data available
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default CustomTable;
