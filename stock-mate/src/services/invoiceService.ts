import axiosInstance from './authService';

export interface InvoiceItem {
  productId: number;
  quantity: number;
  unit: string;
  unitPrice: number;
}

export interface CreateInvoiceData {
  invoiceNumber?: string; // Optional - backend will generate if not provided
  customerId: number;
  warehouseId: number;
  invoiceDate?: string;
  paidAmount?: number;
  notes?: string;
  items: InvoiceItem[];
}

export interface UpdateInvoiceData {
  paidAmount?: number;
  notes?: string;
}

export interface Invoice {
  id: number;
  invoiceNumber: string;
  customer: {
    id: number;
    name: string;
    email: string;
    phone: string;
  };
  warehouse: {
    id: number;
    name: string;
    location: string;
  };
  invoiceDate: string;
  status: string;
  total: number;
  paidAmount: number;
  notes?: string;
  items: Array<{
    id: number;
    product: {
      id: number;
      name: string;
    };
    quantity: number;
    unit: string;
    unitPrice: number;
  }>;
}

export const invoiceService = {
  create: async (data: CreateInvoiceData) => {
    const response = await axiosInstance.post('/api/invoices', data);
    return response.data;
  },

  findAll: async (customerId?: number, warehouseId?: number, status?: string) => {
    const params = new URLSearchParams();
    if (customerId) params.append('customerId', customerId.toString());
    if (warehouseId) params.append('warehouseId', warehouseId.toString());
    if (status) params.append('status', status);

    const response = await axiosInstance.get(`/api/invoices?${params.toString()}`);
    return response.data;
  },

  findOne: async (id: number) => {
    const response = await axiosInstance.get(`/api/invoices/${id}`);
    return response.data;
  },

  update: async (id: number, data: UpdateInvoiceData) => {
    const response = await axiosInstance.patch(`/api/invoices/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await axiosInstance.delete(`/api/invoices/${id}`);
    return response.data;
  },
};
