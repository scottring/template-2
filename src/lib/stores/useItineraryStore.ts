import { create } from 'zustand';
import { ItineraryItem, Schedule, TimeScale } from '@/types/models';
import { addDoc, collection, deleteDoc, doc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { startOfDay, endOfDay, addDays, isSameDay, isWithinInterval } from 'date-fns';

interface ItineraryStore {
  items: ItineraryItem[];
  loading: boolean;
  error: string | null;
  addItem: (item: Omit<ItineraryItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateItem: (id: string, updates: Partial<ItineraryItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  loadItems: () => Promise<void>;
  updateItemSchedule: (id: string, schedule: Schedule) => Promise<void>;
  getActiveHabits: () => ItineraryItem[];
  getTodayItems: () => ItineraryItem[];
  getItemsForDay: (date: Date) => ItineraryItem[];
}

const useItineraryStore = create<ItineraryStore>((set, get) => ({
  items: [],
  loading: false,
  error: null,

  addItem: async (item) => {
    try {
      const docRef = await addDoc(collection(db, 'itinerary'), {
        ...item,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const newItem = {
        ...item,
        id: docRef.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      set(state => ({
        items: [...state.items, newItem],
      }));
      return docRef.id;
    } catch (error) {
      console.error('Error adding item:', error);
      throw error;
    }
  },

  updateItem: async (id, updates) => {
    try {
      const docRef = doc(db, 'itinerary', id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date(),
      });
      set(state => ({
        items: state.items.map(item =>
          item.id === id
            ? { ...item, ...updates, updatedAt: new Date() }
            : item
        ),
      }));
    } catch (error) {
      console.error('Error updating item:', error);
      throw error;
    }
  },

  deleteItem: async (id) => {
    try {
      await deleteDoc(doc(db, 'itinerary', id));
      set(state => ({
        items: state.items.filter(item => item.id !== id),
      }));
    } catch (error) {
      console.error('Error deleting item:', error);
      throw error;
    }
  },

  loadItems: async () => {
    set({ loading: true, error: null });
    try {
      const querySnapshot = await getDocs(collection(db, 'itinerary'));
      const items = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as ItineraryItem[];
      set({ items, loading: false });
    } catch (error) {
      console.error('Error loading items:', error);
      set({ error: 'Failed to load items', loading: false });
    }
  },

  updateItemSchedule: async (id, schedule) => {
    try {
      const docRef = doc(db, 'itinerary', id);
      await updateDoc(docRef, {
        schedule,
        updatedAt: new Date(),
      });
      set(state => ({
        items: state.items.map(item =>
          item.id === id
            ? { ...item, schedule, updatedAt: new Date() }
            : item
        ),
      }));
    } catch (error) {
      console.error('Error updating item schedule:', error);
      throw error;
    }
  },

  getActiveHabits: () => {
    const { items } = get();
    return items.filter(item => item.type === 'habit' && item.status === 'pending');
  },

  getTodayItems: () => {
    const { items } = get();
    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);

    return items.filter(item => {
      if (item.status === 'completed') return false;

      if (item.schedule) {
        const { schedules, repeat } = item.schedule;
        const dayOfWeek = today.getDay();

        // Check if any schedule matches today
        return schedules.some(schedule => {
          if (schedule.day !== dayOfWeek) return false;

          // For daily items, always return true
          if (repeat === 'daily') return true;

          // For weekly items, check if it's been a week since last update
          if (repeat === 'weekly') {
            if (!item.updatedAt) return true;
            const lastUpdate = startOfDay(item.updatedAt);
            const nextDue = addDays(lastUpdate, 7);
            return today >= nextDue;
          }

          // For monthly items, check if it's been a month
          if (repeat === 'monthly') {
            if (!item.updatedAt) return true;
            const lastUpdate = startOfDay(item.updatedAt);
            const nextDue = new Date(lastUpdate);
            nextDue.setMonth(nextDue.getMonth() + 1);
            return today >= nextDue;
          }

          // For quarterly items, check if it's been three months
          if (repeat === 'quarterly') {
            if (!item.updatedAt) return true;
            const lastUpdate = startOfDay(item.updatedAt);
            const nextDue = new Date(lastUpdate);
            nextDue.setMonth(nextDue.getMonth() + 3);
            return today >= nextDue;
          }

          return false;
        });
      }

      return false;
    });
  },

  getItemsForDay: (date: Date) => {
    const { items } = get();
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);
    const dayOfWeek = date.getDay();

    return items.filter(item => {
      if (item.schedule) {
        const { schedules, repeat } = item.schedule;
        
        // Check if any schedule matches the given day
        return schedules.some(schedule => {
          if (schedule.day !== dayOfWeek) return false;

          // For daily items, always return true
          if (repeat === 'daily') return true;

          // For weekly items, check if it's within the week
          if (repeat === 'weekly') {
            if (!item.updatedAt) return true;
            const lastUpdate = startOfDay(item.updatedAt);
            const nextDue = addDays(lastUpdate, 7);
            return isWithinInterval(date, { start: lastUpdate, end: nextDue });
          }

          // For monthly items, check if it's within the month
          if (repeat === 'monthly') {
            if (!item.updatedAt) return true;
            const lastUpdate = startOfDay(item.updatedAt);
            const nextDue = new Date(lastUpdate);
            nextDue.setMonth(nextDue.getMonth() + 1);
            return isWithinInterval(date, { start: lastUpdate, end: nextDue });
          }

          // For quarterly items, check if it's within the quarter
          if (repeat === 'quarterly') {
            if (!item.updatedAt) return true;
            const lastUpdate = startOfDay(item.updatedAt);
            const nextDue = new Date(lastUpdate);
            nextDue.setMonth(nextDue.getMonth() + 3);
            return isWithinInterval(date, { start: lastUpdate, end: nextDue });
          }

          return false;
        });
      }

      return false;
    });
  },
}));

export default useItineraryStore;
