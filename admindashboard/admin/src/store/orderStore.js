import { create } from 'zustand';
import { getAllOrders, updateOrderStatus, deleteOrder } from '../utils/api';

const useOrderStore = create((set, get) => ({
  orders: [],
  loading: false,
  error: null,
  statusFilter: '',
  currentPage: 1,
  itemsPerPage: 10,

  // Fetch all orders
  fetchOrders: async () => {
    set({ loading: true, error: null });
    try {
      const response = await getAllOrders();
      const data = response?.data ? response.data : response;
      set({ orders: data?.orders || [] });
    } catch (err) {
      set({ error: err?.response?.data?.message || 'Failed to fetch orders' });
    } finally {
      set({ loading: false });
    }
  },

  // Update order status
  updateOrderStatus: async (orderId, status) => {
    set({ loading: true, error: null });
    try {
      await updateOrderStatus(orderId, status);
      // Refresh orders list
      await get().fetchOrders();
    } catch (err) {
      set({ error: err?.response?.data?.message || 'Failed to update order' });
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  // Delete order
  deleteOrder: async (orderId) => {
    set({ loading: true, error: null });
    try {
      const { deleteOrder } = await import('../utils/api');
      await deleteOrder(orderId);
      // Refresh orders list
      await get().fetchOrders();
    } catch (err) {
      set({ error: err?.response?.data?.message || 'Failed to delete order' });
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  // Set status filter
  setStatusFilter: (status) => set({ statusFilter: status, currentPage: 1 }),

  // Set current page
  setCurrentPage: (page) => set({ currentPage: page }),

  // Get filtered orders
  getFilteredOrders: () => {
    const { orders, statusFilter } = get();
    if (!statusFilter) return orders;
    return orders.filter((order) => order.status === statusFilter);
  },

  // Get paginated orders
  getPaginatedOrders: () => {
    const filtered = get().getFilteredOrders();
    const { currentPage, itemsPerPage } = get();
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  },

  // Get total pages
  getTotalPages: () => {
    const filtered = get().getFilteredOrders();
    const { itemsPerPage } = get();
    return Math.ceil(filtered.length / itemsPerPage);
  },
}));

export default useOrderStore;
