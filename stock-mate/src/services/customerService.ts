import axiosInstance from './authService';

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
}

export const customerService = {
  findAll: async (): Promise<Customer[]> => {
    const response = await axiosInstance.get('/api/customers');
    return response.data;
  },

  findOne: async (id: number): Promise<Customer> => {
    const response = await axiosInstance.get(`/api/customers/${id}`);
    return response.data;
  },
};
