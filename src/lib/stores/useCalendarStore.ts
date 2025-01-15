import { create } from 'zustand';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { CalendarEvent, RecurrenceRule } from '@/types/models';
import {
  addDays,
  addWeeks,
  addMonths,
  addYears,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  eachYearOfInterval,
  isSameDay,
  isWithinInterval,
  startOfDay,
  endOfDay,
} from 'date-fns';

interface CalendarStore {
  events: CalendarEvent[];
  isLoading: boolean;
  error: string | null;
  
  // Event Management
  loadEvents: (userId: string, householdId: string, start: Date, end: Date) => Promise<void>;
  createEvent: (event: Omit<CalendarEvent, 'id'>) => Promise<string>;
  updateEvent: (eventId: string, event: Partial<CalendarEvent>) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
  
  // Recurring Events
  generateRecurringInstances: (event: CalendarEvent, start: Date, end: Date) => CalendarEvent[];
  
  // Subscriptions
  subscribeToEvents: (userId: string, householdId: string) => () => void;
}

export const useCalendarStore = create<CalendarStore>((set, get) => ({
  events: [],
  isLoading: false,
  error: null,

  loadEvents: async (userId, householdId, start, end) => {
    try {
      set({ isLoading: true, error: null });
      
      const eventsRef = collection(db, 'events');
      const q = query(
        eventsRef,
        where('householdId', '==', householdId),
        where('start', '>=', Timestamp.fromDate(start)),
        where('end', '<=', Timestamp.fromDate(end))
      );
      
      const snapshot = await getDocs(q);
      const events = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        start: doc.data().start.toDate(),
        end: doc.data().end.toDate(),
      })) as CalendarEvent[];

      // Generate recurring instances
      const allEvents = events.flatMap(event => {
        if (event.recurrence) {
          return get().generateRecurringInstances(event, start, end);
        }
        return [event];
      });
      
      set({ events: allEvents });

    } catch (error) {
      set({ error: 'Failed to load events' });
      console.error('Error loading events:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  createEvent: async (event) => {
    try {
      set({ isLoading: true, error: null });
      
      const eventsRef = collection(db, 'events');
      const docRef = doc(eventsRef);
      
      await setDoc(docRef, {
        ...event,
        start: Timestamp.fromDate(event.start),
        end: Timestamp.fromDate(event.end),
      });
      
      return docRef.id;

    } catch (error) {
      set({ error: 'Failed to create event' });
      console.error('Error creating event:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  updateEvent: async (eventId, event) => {
    try {
      set({ isLoading: true, error: null });
      
      const eventRef = doc(db, 'events', eventId);
      const updates = {
        ...event,
        start: event.start ? Timestamp.fromDate(event.start) : undefined,
        end: event.end ? Timestamp.fromDate(event.end) : undefined,
      };
      
      await updateDoc(eventRef, updates);

    } catch (error) {
      set({ error: 'Failed to update event' });
      console.error('Error updating event:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteEvent: async (eventId) => {
    try {
      set({ isLoading: true, error: null });
      
      const eventRef = doc(db, 'events', eventId);
      await deleteDoc(eventRef);

    } catch (error) {
      set({ error: 'Failed to delete event' });
      console.error('Error deleting event:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  generateRecurringInstances: (event, start, end) => {
    if (!event.recurrence) return [event];

    const instances: CalendarEvent[] = [];
    const rule = event.recurrence;
    let current = event.start;
    let count = 0;

    while (current <= end && (!rule.count || count < rule.count) && (!rule.endDate || current <= rule.endDate)) {
      // Skip if this date is in exceptions
      if (!rule.exceptions?.some(date => isSameDay(date, current))) {
        // For weekly recurrence, check if this day of week is included
        if (rule.frequency === 'weekly' && rule.daysOfWeek) {
          const dayOfWeek = current.getDay();
          if (rule.daysOfWeek.includes(dayOfWeek)) {
            instances.push({
              ...event,
              id: `${event.id}-${count}`,
              start: current,
              end: new Date(current.getTime() + (event.end.getTime() - event.start.getTime())),
              parentEventId: event.id,
            });
          }
        } else {
          instances.push({
            ...event,
            id: `${event.id}-${count}`,
            start: current,
            end: new Date(current.getTime() + (event.end.getTime() - event.start.getTime())),
            parentEventId: event.id,
          });
        }
      }

      // Move to next occurrence based on frequency and interval
      switch (rule.frequency) {
        case 'daily':
          current = addDays(current, rule.interval || 1);
          break;
        case 'weekly':
          current = addWeeks(current, rule.interval || 1);
          break;
        case 'monthly':
          current = addMonths(current, rule.interval || 1);
          break;
        case 'yearly':
          current = addYears(current, rule.interval || 1);
          break;
      }

      count++;
    }

    return instances;
  },

  subscribeToEvents: (userId, householdId) => {
    const eventsRef = collection(db, 'events');
    const q = query(
      eventsRef,
      where('householdId', '==', householdId)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const events = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          start: doc.data().start.toDate(),
          end: doc.data().end.toDate(),
        })) as CalendarEvent[];

        set({ events });
      },
      (error) => {
        set({ error: 'Failed to subscribe to events' });
        console.error('Error subscribing to events:', error);
      }
    );

    return unsubscribe;
  },
})); 