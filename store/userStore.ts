import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';

interface UserStore {
  user: User | null;
  isLoggedIn: boolean;
  login: (user: User) => void;
  logout: () => void;
  getCurrentUser: () => User | null;
}

// Mock user data
const mockUser: User = {
  id: 'user-123',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  phone: '+234 801 234 5678',
  company: 'Tech Solutions Ltd',
  address: '123 Victoria Island',
  city: 'Lagos',
  state: 'Lagos',
  country: 'Nigeria',
  zipCode: '101241',
  isLoggedIn: true,
};

const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      user: mockUser, // Start with mock user logged in
      isLoggedIn: true,

      login: (user: User) => {
        set({
          user,
          isLoggedIn: true,
        });
      },

      logout: () => {
        set({
          user: null,
          isLoggedIn: false,
        });
      },

      getCurrentUser: () => {
        return get().user;
      },
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({
        user: state.user,
        isLoggedIn: state.isLoggedIn,
      }),
    }
  )
);

export default useUserStore;
