// admindashboard/admin/src/store/ProductStore.js
import { create } from 'zustand';
import { getAllProducts, deleteProduct } from '../utils/api';

const useProductStore = create((set) => ({
  products: [],
  
  fetchProducts: async () => {
    try {
      const data = await getAllProducts();
      set({ products: data.products || [] });
    } catch (error) {
      console.error('Fetch products error:', error);
      set({ products: [] });
    }
  },
  
  deleteProduct: async (id) => {
    return await deleteProduct(id);
  },
}));

export default useProductStore;