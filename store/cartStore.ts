import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Cart, CartItem, Domain } from '@/types';

interface CartStore extends Cart {
  addItem: (domain: Domain) => void;
  removeItem: (domainId: string) => void;
  clearCart: () => void;
  getItemCount: () => number;
  getTotalPrice: () => number;
}

const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      totalItems: 0,
      totalPrice: 0,
      currency: 'NGN',

      addItem: (domain: Domain) => {
        const { items } = get();
        const existingItem = items.find(item => item.domain.id === domain.id);

        if (!existingItem) {
          // Add new item only if it doesn't exist
          const newItem: CartItem = {
            domain,
            totalPrice: domain.price,
          };

          set(state => ({
            items: [...state.items, newItem],
            totalItems: state.totalItems + 1,
            totalPrice: state.totalPrice + domain.price,
          }));
        }
      },

      removeItem: (domainId: string) => {
        set(state => {
          const itemToRemove = state.items.find(item => item.domain.id === domainId);
          if (!itemToRemove) return state;

          return {
            items: state.items.filter(item => item.domain.id !== domainId),
            totalItems: state.totalItems - 1,
            totalPrice: state.totalPrice - itemToRemove.totalPrice,
          };
        });
      },



      clearCart: () => {
        set({
          items: [],
          totalItems: 0,
          totalPrice: 0,
        });
      },

      getItemCount: () => {
        return get().totalItems;
      },

      getTotalPrice: () => {
        return get().totalPrice;
      },
    }),
    {
      name: 'domain-cart-storage',
      partialize: (state) => ({
        items: state.items,
        totalItems: state.totalItems,
        totalPrice: state.totalPrice,
        currency: state.currency,
      }),
    }
  )
);

export default useCartStore;

