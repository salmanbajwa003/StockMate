/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";

interface CustomTableProps<T = Record<string, any>> {
  columns: { key: string; label: string }[];
  rows: T[];
  onRowClick?: (row: T) => void;
  onEdit?: (row: T) => void;
  onDelete?: (id: number | string) => void;
}
const CustomTable = <T extends Record<string, any>>({
  columns,
  rows,
  onRowClick,
}: CustomTableProps<T>) => {
  return (
    <TableContainer component={Paper} sx={{ borderRadius: 1 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            {columns.map((col) => (
              <TableCell
                key={col.key}
                align={"left"}
                sx={{
                  fontWeight: "bold",
                  backgroundColor: "#f5f5f5",
                }}
              >
                {col.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow
              key={index}
              onClick={() => onRowClick && onRowClick(row)}
              sx={{
                cursor: onRowClick ? "pointer" : "default",
                "&:hover": { backgroundColor: "#f0f0f0" },
              }}
            >
              {columns.map((col) => (
                <TableCell key={col.key} align={"left"}>
                  {row[col.key] ?? "-"}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default CustomTable;
