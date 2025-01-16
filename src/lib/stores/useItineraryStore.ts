import { create } from 'zustand';
import { ItineraryItem, Schedule, TimeScale, Goal, SuccessCriteria } from '@/types/models';
import { addDoc, collection, deleteDoc, doc, getDocs, query, updateDoc, where, getDoc, setDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { startOfDay, endOfDay, addDays, isSameDay, isWithinInterval } from 'date-fns';

interface ItineraryStore {
  items: ItineraryItem[];
  loading: boolean;
  error: string | null;
  
  // Core operations
  addItem: (item: Omit<ItineraryItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateItem: (id: string, updates: Partial<ItineraryItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  loadItems: () => Promise<void>;
  
  // Schedule management
  updateItemSchedule: (id: string, schedule: Schedule) => Promise<void>;
  completeItem: (id: string, userId: string) => Promise<void>;
  clearAllItems: () => Promise<void>;
  
  // Item queries
  getActiveHabits: () => ItineraryItem[];
  getTodayItems: (date?: Date) => ItineraryItem[];
  getItemsForDay: (date: Date) => ItineraryItem[];
  getUpcomingItems: (startDate: Date, endDate: Date) => ItineraryItem[];
  getNeedsAttention: () => ItineraryItem[];
  getStreak: (itemId: string) => number;
  
  // Goal integration
  generateFromGoal: (goal: Goal) => Promise<void>;
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
      } as ItineraryItem;
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
      const [goalId, ...criteriaParts] = id.split('-');
      const criteriaText = criteriaParts.join('-');

      const docRef = doc(db, 'itinerary', id);
      const docSnap = await getDoc(docRef);

      const newItem: Partial<ItineraryItem> = {
        id,
        notes: criteriaText,
        referenceId: goalId,
        schedule,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'pending',
        type: 'habit',
        createdBy: 'system',
        updatedBy: 'system'
      };

      if (!docSnap.exists()) {
        await setDoc(docRef, newItem);
        set(state => ({
          items: [...state.items, newItem as ItineraryItem],
        }));
      } else {
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
      }
    } catch (error) {
      console.error('Error updating item schedule:', error);
      throw error;
    }
  },

  completeItem: async (id: string, userId: string) => {
    try {
      const docRef = doc(db, 'itinerary', id);
      await updateDoc(docRef, {
        status: 'completed',
        updatedAt: new Date(),
        updatedBy: userId
      });
      set(state => ({
        items: state.items.map(item =>
          item.id === id
            ? { ...item, status: 'completed', updatedAt: new Date(), updatedBy: userId }
            : item
        ),
      }));
    } catch (error) {
      console.error('Error completing item:', error);
      throw error;
    }
  },

  clearAllItems: async () => {
    try {
      const batch = writeBatch(db);
      const items = get().items;
      items.forEach(item => {
        const docRef = doc(db, 'itinerary', item.id);
        batch.delete(docRef);
      });
      await batch.commit();
      set({ items: [] });
    } catch (error) {
      console.error('Error clearing items:', error);
      throw error;
    }
  },

  getStreak: (itemId: string) => {
    const items = get().items;
    const item = items.find(i => i.id === itemId);
    if (!item) return 0;
    
    let streak = 0;
    const today = new Date();
    let currentDate = startOfDay(today);
    
    while (true) {
      const completedOnDate = items.some(i => 
        i.id === itemId && 
        i.status === 'completed' && 
        i.updatedAt && 
        isSameDay(i.updatedAt, currentDate)
      );
      
      if (!completedOnDate) break;
      
      streak++;
      currentDate = addDays(currentDate, -1);
    }
    
    return streak;
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

        return schedules.some(schedule => {
          if (schedule.day !== dayOfWeek) return false;

          if (repeat === 'daily') return true;

          if (repeat === 'weekly') {
            if (!item.updatedAt) return true;
            const lastUpdate = startOfDay(item.updatedAt);
            const nextDue = addDays(lastUpdate, 7);
            return today >= nextDue;
          }

          if (repeat === 'monthly') {
            if (!item.updatedAt) return true;
            const lastUpdate = startOfDay(item.updatedAt);
            const nextDue = new Date(lastUpdate);
            nextDue.setMonth(nextDue.getMonth() + 1);
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
        
        return schedules.some(schedule => {
          if (schedule.day !== dayOfWeek) return false;

          if (repeat === 'daily') return true;

          if (repeat === 'weekly') {
            if (!item.updatedAt) return true;
            const lastUpdate = startOfDay(item.updatedAt);
            const nextDue = addDays(lastUpdate, 7);
            return isWithinInterval(date, { start: lastUpdate, end: nextDue });
          }

          if (repeat === 'monthly') {
            if (!item.updatedAt) return true;
            const lastUpdate = startOfDay(item.updatedAt);
            const nextDue = new Date(lastUpdate);
            nextDue.setMonth(nextDue.getMonth() + 1);
            return isWithinInterval(date, { start: lastUpdate, end: nextDue });
          }

          return false;
        });
      }

      return false;
    });
  },

  getUpcomingItems: (startDate: Date, endDate: Date) => {
    const { items } = get();
    const dayStart = startOfDay(startDate);
    const dayEnd = endOfDay(endDate);

    return items.filter(item => {
      if (item.status === 'completed') return false;

      if (item.dueDate) {
        return isWithinInterval(item.dueDate, { start: dayStart, end: dayEnd });
      }

      if (item.schedule) {
        const { schedules } = item.schedule;
        return schedules.some(schedule => {
          const scheduleDate = new Date(startDate);
          scheduleDate.setHours(parseInt(schedule.time.split(':')[0]), parseInt(schedule.time.split(':')[1]));
          return isWithinInterval(scheduleDate, { start: dayStart, end: dayEnd });
        });
      }

      return false;
    });
  },

  getNeedsAttention: () => {
    const { items } = get();
    const today = new Date();
    const todayStart = startOfDay(today);

    return items.filter(item => {
      if (item.status === 'completed') return false;

      if (item.dueDate && item.dueDate < todayStart) {
        return true;
      }

      if (item.schedule) {
        const { schedules, repeat } = item.schedule;
        const lastUpdate = item.updatedAt ? startOfDay(item.updatedAt) : null;

        if (!lastUpdate) return true;

        let nextDue = new Date(lastUpdate);
        switch (repeat) {
          case 'daily':
            nextDue = addDays(lastUpdate, 1);
            break;
          case 'weekly':
            nextDue = addDays(lastUpdate, 7);
            break;
          case 'monthly':
            nextDue.setMonth(nextDue.getMonth() + 1);
            break;
        }

        if (today >= nextDue) {
          return true;
        }
      }

      return false;
    });
  },

  generateFromGoal: async (goal: Goal) => {
    try {
      const { addItem } = get();
      
      const trackedCriteria = goal.successCriteria.filter(criteria => criteria.isTracked);
      
      for (const criteria of trackedCriteria) {
        const habitData: Omit<ItineraryItem, 'id' | 'createdAt' | 'updatedAt'> = {
          type: 'habit',
          referenceId: goal.id,
          notes: criteria.text,
          status: 'pending',
          createdBy: 'system',
          updatedBy: 'system',
          schedule: {
            startDate: new Date(),
            schedules: [{ day: new Date().getDay(), time: '09:00' }],
            repeat: criteria.timescale || 'weekly'
          }
        };

        await addItem(habitData);
      }
    } catch (error) {
      console.error('Error generating habits from goal:', error);
      throw error;
    }
  },
}));

export default useItineraryStore;
