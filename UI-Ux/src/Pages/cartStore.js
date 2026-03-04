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
      const previousItems = get().cartItems || [];
      const previousImageByKey = new Map(previousItems.map((item) => [item.key, item.image]));

      const formattedItems = items.map((item) => {
        const isAiGenerated = item.itemType === 'ai_generated';
        const stableKey = item._id
          ? `cart-${item._id}`
          : (isAiGenerated
              ? `ai-${item.design?._id || item.designId || item.id || 'x'}`
              : `catalog-${item.product?._id || item.productId || item.id || 'x'}`);
        let imageUrl = item.resolvedImage || (isAiGenerated
          ? (
              item.design?.generatedImage ||
              item.generatedImageSnapshot ||
              item.design?.printReadyImage ||
              item.design?.backgroundRemovedImage ||
              item.design?.originalImage ||
              null
            )
          : (item.product?.image || item.product?.productImage || null));

        if (typeof imageUrl === 'string') {
          imageUrl = imageUrl.trim();
        }
        
        if (imageUrl && !imageUrl.startsWith('data:')) {
          if (imageUrl.startsWith('http')) {
            // Already absolute
          } else if (imageUrl.startsWith('/')) {
            imageUrl = SERVER_URL + imageUrl;
          } else {
            imageUrl = SERVER_URL + '/' + imageUrl;
          }
        }

        if (!imageUrl) {
          imageUrl = previousImageByKey.get(stableKey) || '/placeholder.png';
        }

        return {
          key: stableKey,
          id: isAiGenerated ? item.design?._id : item.product?._id,
          itemType: item.itemType || 'catalog',
          productId: item.product?._id || null,
          designId: item.design?._id || null,
          name: isAiGenerated ? 'AI Generated Anime T-Shirt' : (item.product?.name || 'Catalog Product'),
          price: Number(item.priceSnapshot?.finalPrice ?? item.priceSnapshot?.unitPrice ?? item.product?.price ?? 0),
          image: imageUrl,
          quantity: item.quantity,
          stock: isAiGenerated ? null : item.product?.stock,
          category: isAiGenerated ? 'ai_generated' : item.product?.category,
          selectedOptions: item.selectedOptions || {
            highResolutionExport: false,
            customPlacement: false,
            backgroundRemoval: false,
          },
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

  // Add to cart (supports both catalog and ai_generated payloads)
  addToCart: async (payload, quantity = 1) => {
    set({ loading: true, error: null });
    try {
      let body;

      if (payload?.itemType) {
        body = payload;
      } else {
        body = {
          itemType: 'catalog',
          productId: payload?.id || payload?._id,
          quantity,
        };
      }

      await addToCart(body);
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
  removeFromCart: async (payload) => {
    set({ loading: true, error: null });
    try {
      let body;

      if (payload?.itemType) {
        body = payload;
      } else {
        body = {
          itemType: 'catalog',
          productId: payload,
        };
      }

      await removeFromCart(body);
      await get().fetchCart();
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to remove from cart',
        loading: false,
      });
    }
  },

  // Increase quantity - add 1
  increaseQuantity: async (targetItem) => {
    const item = get().cartItems.find((i) => i.key === targetItem.key);
    if (!item) return;

    if (item.itemType === 'catalog' && item.quantity >= item.stock) {
      set({ error: 'Insufficient stock available' });
      return;
    }

    set({ loading: true, error: null });
    try {
      if (item.itemType === 'catalog') {
        await addToCart({
          itemType: 'catalog',
          productId: item.productId,
          quantity: 1,
        });
      } else {
        await addToCart({
          itemType: 'ai_generated',
          designId: item.designId,
          quantity: item.quantity + 1,
          selectedOptions: item.selectedOptions,
        });
      }
      await get().fetchCart();
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to update quantity',
        loading: false,
      });
    }
  },

  // Decrease quantity - remove 1
  decreaseQuantity: async (targetItem) => {
    const item = get().cartItems.find((i) => i.key === targetItem.key);
    if (!item) return;

    // If quantity is 1, remove completely
    if (item.quantity === 1) {
      await get().removeFromCart(
        item.itemType === 'catalog'
          ? { itemType: 'catalog', productId: item.productId }
          : { itemType: 'ai_generated', designId: item.designId }
      );
      return;
    }

    set({ loading: true, error: null });
    try {
      const newQuantity = item.quantity - 1;

      if (item.itemType === 'catalog') {
        await removeFromCart({ itemType: 'catalog', productId: item.productId });
        await addToCart({
          itemType: 'catalog',
          productId: item.productId,
          quantity: newQuantity,
        });
      } else {
        await addToCart({
          itemType: 'ai_generated',
          designId: item.designId,
          quantity: newQuantity,
          selectedOptions: item.selectedOptions,
        });
      }

      await get().fetchCart();
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to update quantity',
        loading: false,
      });
    }
  },

  // Clear cart
  clearCart: () => set({ cartItems: [], totalAmount: 0, error: null }),

  // Clear error
  clearError: () => set({ error: null }),
}));
