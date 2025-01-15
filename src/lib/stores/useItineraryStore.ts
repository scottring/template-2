import { create } from 'zustand';
import { ItineraryItem, Schedule, TimeScale, Goal, SuccessCriteria } from '@/types/models';
import { addDoc, collection, deleteDoc, doc, getDocs, query, updateDoc, where, getDoc, setDoc } from 'firebase/firestore';
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
  getUpcomingItems: (startDate: Date, endDate: Date) => ItineraryItem[];
  getNeedsAttention: () => ItineraryItem[];
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
      // Split the composite ID to get the goal ID and criteria text
      const [goalId, ...criteriaParts] = id.split('-');
      const criteriaText = criteriaParts.join('-');

      // First check if the document exists
      const docRef = doc(db, 'itinerary', id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        // If document doesn't exist, create it first
        await setDoc(docRef, {
          id,
          notes: criteriaText,
          referenceId: goalId,
          schedule,
          createdAt: new Date(),
          updatedAt: new Date(),
          status: 'pending',
          type: 'habit'
        });

        // Update local state
        set(state => ({
          items: [...state.items, {
            id,
            notes: criteriaText,
            referenceId: goalId,
            schedule,
            createdAt: new Date(),
            updatedAt: new Date(),
            status: 'pending',
            type: 'habit'
          }],
        }));
      } else {
        // Document exists, just update the schedule
        await updateDoc(docRef, {
          schedule,
          updatedAt: new Date(),
        });

        // Update local state
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

  getUpcomingItems: (startDate: Date, endDate: Date) => {
    const { items } = get();
    const dayStart = startOfDay(startDate);
    const dayEnd = endOfDay(endDate);

    return items.filter(item => {
      if (item.status === 'completed') return false;

      // Check due date if it exists
      if (item.dueDate) {
        return isWithinInterval(item.dueDate, { start: dayStart, end: dayEnd });
      }

      // Check schedule if it exists
      if (item.schedule) {
        const { schedules, repeat } = item.schedule;
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

      // Check for overdue items
      if (item.dueDate && item.dueDate < todayStart) {
        return true;
      }

      // Check for items with missed schedules
      if (item.schedule) {
        const { schedules, repeat } = item.schedule;
        const lastUpdate = item.updatedAt ? startOfDay(item.updatedAt) : null;

        if (!lastUpdate) return true; // Never updated items need attention

        // Calculate next due date based on repeat frequency
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
          case 'quarterly':
            nextDue.setMonth(nextDue.getMonth() + 3);
            break;
        }

        // If we're past the next due date, this item needs attention
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
      
      // Generate habits from tracked success criteria
      const trackedCriteria = goal.successCriteria.filter(criteria => criteria.isTracked);
      
      for (const criteria of trackedCriteria) {
        const habitData: Omit<ItineraryItem, 'id' | 'createdAt' | 'updatedAt'> = {
          type: 'habit',
          referenceId: goal.id,
          notes: criteria.text,
          status: 'pending',
          schedule: {
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
