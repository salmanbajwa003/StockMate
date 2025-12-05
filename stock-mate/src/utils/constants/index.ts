// API Base URL
export const API_BASE_URL = import.meta.env.VITE_BASE_URL;
// export const API_BASE_URL = 'http://localhost:4000/'; // for local development

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: `${API_BASE_URL}/auth`,
  CUSTOMERS: `${API_BASE_URL}api/customers`,
  WAREHOUSES: `${API_BASE_URL}api/warehouses`,
  PRODUCTS: `${API_BASE_URL}api/products`,
  INVOICES: `${API_BASE_URL}api/invoices`,
  COLORS: `${API_BASE_URL}api/colors`,
  FABRICS: `${API_BASE_URL}api/fabrics`,
} as const;
