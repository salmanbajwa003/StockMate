import axiosInstance from './authService';

export interface RefundItem {
  id: number;
  product: {
    id: number;
    name: string;
  };
  originalQuantity: number;
  refundQuantity: number;
  unit: string;
  unitPrice: number;
  refundAmount: number;
}

export interface Refund {
  id: number;
  invoice: {
    id: number;
    invoiceNumber: string;
    total?: number;
  };
  customer: {
    id: number;
    name: string;
    email?: string;
    phone: string;
  };
  warehouse: {
    id: number;
    name: string;
    location: string;
  };
  totalRefundAmount: number;
  reason?: string;
  createdAt: string;
  items: RefundItem[];
}

export interface CreateRefundData {
  invoiceId: number;
  invoiceNumber: string;
  customerId: number;
  warehouseId: number;
  refundItems: Array<{
    itemId: number;
    productId: number;
    originalQuantity: number;
    refundQuantity: number;
    unit: string;
    unitPrice: string;
    refundAmount: number;
  }>;
  reason?: string;
  totalRefundAmount: number;
}

export const refundService = {
  create: async (data: CreateRefundData) => {
    const response = await axiosInstance.post('/api/refunds', data);
    return response.data;
  },

  findAll: async () => {
    const response = await axiosInstance.get('/api/refunds');
    return response.data;
  },

  findOne: async (id: number) => {
    const response = await axiosInstance.get(`/api/refunds/${id}`);
    return response.data;
  },
};
