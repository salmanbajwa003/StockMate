import axiosInstance from './authService';

export const productService = {
  findAll: async () => {
    const response = await axiosInstance.get('/api/products');
    return response.data;
  },

  findOne: async (id: number) => {
    const response = await axiosInstance.get(`/api/products/${id}`);
    return response.data;
  },
};
