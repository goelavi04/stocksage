import { create } from 'zustand'

const useStore = create((set) => ({
  fatherMode: false,
  toggleFatherMode: () => set((state) => ({ fatherMode: !state.fatherMode })),

  selectedSymbol: '',
  setSelectedSymbol: (symbol) => set({ selectedSymbol: symbol }),

  notifications: [],
  setNotifications: (notifications) => set({ notifications }),

  unreadCount: 0,
  setUnreadCount: (count) => set({ unreadCount: count }),
}))

export default useStore
