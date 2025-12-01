// Common Types
export interface Column<T = Record<string, unknown>> {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
}

export interface SearchOption {
  label: string;
  value: string;
  type?: 'text' | 'date';
}

// Entity Types - Matching Backend Schema
export interface Customer {
  id: number;
  name: string; // Required
  email: string; // Required, unique
  phone?: string; // Optional
  phone_number2?: string; // Optional
  phone_number3?: string; // Optional
  address?: string; // Optional
  updatedAt?: string | Date; // Optional - last update timestamp
  [key: string]: unknown; // Index signature for type compatibility
}

export interface Warehouse {
  id: number;
  name: string; // Required
  address: string; // Required
  size?: string; // Optional
  updatedAt?: string | Date; // Optional - last update timestamp
  [key: string]: unknown; // Index signature for type compatibility
}

export interface Product {
  id: number;
  name: string; // Required
  fabric: { id: number; name: string }; // Required (nullable: false in backend)
  color: { id: number; name: string }; // Required (nullable: false in backend)
  price?: number; // Optional
  weight?: number; // Optional
  unit?: string; // Optional
  productWarehouses?: Array<{
    quantity: number;
    unit: string;
    warehouse?: { id: number; name: string };
  }>;
  updatedAt?: string | Date; // Optional - last update timestamp
  [key: string]: unknown; // Index signature for type compatibility
}

export interface InvoiceItem {
  id?: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  discount?: number;
  total?: number;
  notes?: string;
}

export interface Invoice {
  id: number;
  invoiceNumber: string; // Required, unique
  customer: { id: number; name: string } | string; // Required
  warehouse: { id: number; name: string } | string; // Required
  invoiceDate: string; // Optional (defaults to now)
  dueDate?: string; // Optional
  status: 'draft' | 'pending' | 'paid' | 'cancelled'; // Optional (defaults to 'draft')
  subtotal: number; // Calculated, not input
  taxRate?: number; // Optional (defaults to 0)
  taxAmount?: number; // Calculated, not input
  discount?: number; // Optional (defaults to 0)
  total: number; // Calculated, not input
  notes?: string; // Optional
  items?: InvoiceItem[]; // Required for creation
  updatedAt?: string | Date; // Optional - last update timestamp
  [key: string]: unknown; // Index signature for type compatibility
}

export interface Color {
  id: number;
  name: string; // Required, unique
  hexCode?: string; // Optional (must match #XXXXXX format if provided)
  description?: string; // Optional
  isActive?: boolean; // Optional (defaults to true)
  [key: string]: unknown; // Index signature for type compatibility
}

export interface Fiber {
  id: number;
  name: string; // Required, unique
  description?: string; // Optional
  isActive?: boolean; // Optional (defaults to true)
  [key: string]: unknown; // Index signature for type compatibility
}

// Form Field Types
export interface FormFieldOption {
  id: number | string;
  name: string;
}

export interface FormField {
  key: string;
  label: string;
  type?: string;
  options?: string[] | FormFieldOption[]; // Support both string arrays and id/name objects
  required?: boolean; // Whether the field is required (defaults to false)
  disabled?: boolean; // Whether the field is disabled
}

// Auth Types
export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}
