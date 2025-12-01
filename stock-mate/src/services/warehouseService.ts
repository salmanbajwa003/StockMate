import axiosInstance from './authService';

export interface Warehouse {
  id: number;
  name: string;
  location: string;
  capacity?: number;
}

export const warehouseService = {
  findAll: async () => {
    const response = await axiosInstance.get('/api/warehouses');
    return response.data;
  },

  findOne: async (id: number) => {
    const response = await axiosInstance.get(`/api/warehouses/${id}`);
    return response.data;
  },
};

