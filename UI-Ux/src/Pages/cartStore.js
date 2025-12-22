import { create } from 'zustand';
import { addToCart, removeFromCart, getCart } from '../Api/cartApi';

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";
const SERVER_URL = API_BASE.replace(/\/api\/v1\/?$/, "");

export const useCartStore = create((set, get) => ({
  cartItems: [],
  totalAmount: 0,
  loading: false,
  error: null,
  initialized: false,

  // Fetch cart from backend
  fetchCart: async () => {
    set({ loading: true, error: null });
    try {
      const data = await getCart();
      const items = data.cart?.items || [];

      const formattedItems = items.map((item) => {
        let imageUrl = item.product?.image || item.product?.productImage || null;
        
        if (imageUrl) {
          if (imageUrl.startsWith('http')) {
            // Already absolute
          } else if (imageUrl.startsWith('/')) {
            imageUrl = SERVER_URL + imageUrl;
          } else {
            imageUrl = SERVER_URL + '/' + imageUrl;
          }
        } else {
          imageUrl = '/placeholder.png';
        }

        return {
          id: item.product._id,
          name: item.product.name,
          price: item.product.price,
          image: imageUrl,
          quantity: item.quantity,
          stock: item.product.stock,
          category: item.product.category,
        };
      });

      set({
        cartItems: formattedItems,
        totalAmount: data.totalAmount || 0,
        loading: false,
        initialized: true,
      });
    } catch (error) {
      console.error('Fetch cart error:', error);
      set({
        error: error.response?.data?.message || 'Failed to fetch cart',
        loading: false,
        initialized: true,
      });
    }
  },

  // Initialize cart on app start (only if user is logged in)
  initializeCart: async () => {
    const { initialized } = get();
    const token = localStorage.getItem('token');
    
    // Only fetch cart if user is logged in and not already initialized
    if (!initialized && token) {
      await get().fetchCart();
    } else if (!token) {
      set({ initialized: true }); // Mark as initialized even without fetching
    }
  },

  // Re-initialize cart after fresh login
  reinitializeAfterLogin: async () => {
    set({ initialized: false, cartItems: [], totalAmount: 0, error: null });
    await get().fetchCart();
  },

  // Add to cart (adds quantity to existing)
  addToCart: async (product, quantity = 1) => {
    set({ loading: true, error: null });
    try {
      await addToCart(product.id || product._id, quantity);
      await get().fetchCart();
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to add to cart',
        loading: false,
      });
      throw error;
    }
  },

  // Remove from cart
  removeFromCart: async (productId) => {
    set({ loading: true, error: null });
    try {
      await removeFromCart(productId);
      await get().fetchCart();
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to remove from cart',
        loading: false,
      });
    }
  },

  // Increase quantity - add 1
  increaseQuantity: async (productId) => {
    const item = get().cartItems.find((i) => i.id === productId);
    if (!item) return;

    if (item.quantity >= item.stock) {
      set({ error: 'Insufficient stock available' });
      return;
    }

    set({ loading: true, error: null });
    try {
      // Add 1 to current quantity
      await addToCart(productId, 1);
      await get().fetchCart();
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to update quantity',
        loading: false,
      });
    }
  },

  // Decrease quantity - remove 1
  decreaseQuantity: async (productId) => {
    const item = get().cartItems.find((i) => i.id === productId);
    if (!item) return;

    // If quantity is 1, remove completely
    if (item.quantity === 1) {
      await get().removeFromCart(productId);
      return;
    }

    set({ loading: true, error: null });
    try {
      // Add -1 to decrease (backend should handle this)
      // OR remove and re-add with new quantity
      await removeFromCart(productId);
      // Re-add with new quantity (quantity - 1)
      const newQuantity = item.quantity - 1;
      await addToCart(productId, newQuantity);
      await get().fetchCart();
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to update quantity',
        loading: false,
      });
    }
  },

  // Clear error
  clearError: () => set({ error: null }),
}));