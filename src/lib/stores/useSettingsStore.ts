import { create } from 'zustand';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc,
  query, 
  where,
  onSnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { MemberPreferences, NotificationPreferences } from '@/types/models';
import { addDays, addWeeks, startOfWeek, setHours, setMinutes } from 'date-fns';

interface Settings {
  weeklyPlanningDay: number; // 0-6 for Sunday-Saturday
  weeklyPlanningTime: string; // HH:mm format
  autoScheduleWeeklyPlanning: boolean;
  reminderEnabled: boolean;
  reminderHoursBefore: number;
  defaultWeeklyMeetingDay: number | null; // 0-6 for Sunday-Saturday
  defaultWeeklyMeetingTime: string | null; // HH:mm format
  colorScheme: string;
  defaultView: 'day' | 'week' | 'month';
  notifications: NotificationPreferences;
}

interface SettingsStore {
  settings: Settings | null;
  isLoading: boolean;
  error: string | null;
  
  // Settings Management
  loadSettings: (userId: string) => Promise<void>;
  saveSettings: (userId: string, settings: Settings) => Promise<void>;
  resetSettings: () => Promise<void>;
  
  // Calculations
  getNextPlanningSession: () => Date;
  getNextTeamMeeting: () => Date;
  
  // Subscriptions
  subscribeToSettings: (userId: string) => () => void;
}

const defaultSettings: Settings = {
  weeklyPlanningDay: 0, // Sunday
  weeklyPlanningTime: '09:00',
  autoScheduleWeeklyPlanning: true,
  reminderEnabled: true,
  reminderHoursBefore: 24,
  defaultWeeklyMeetingDay: null,
  defaultWeeklyMeetingTime: null,
  colorScheme: 'system',
  defaultView: 'week',
  notifications: {
    taskReminders: true,
    planningReminders: true,
    inventoryAlerts: true,
    taskAssignments: true,
    reminderHoursBefore: 24
  }
};

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: null,
  isLoading: false,
  error: null,

  loadSettings: async (userId) => {
    try {
      set({ isLoading: true, error: null });
      
      const settingsRef = doc(db, 'settings', userId);
      const settingsDoc = await getDoc(settingsRef);
      
      if (settingsDoc.exists()) {
        set({ settings: settingsDoc.data() as Settings });
      } else {
        // Initialize with default settings
        await setDoc(settingsRef, defaultSettings);
        set({ settings: defaultSettings });
      }

    } catch (error) {
      set({ error: 'Failed to load settings' });
      console.error('Error loading settings:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  saveSettings: async (userId, settings) => {
    try {
      set({ isLoading: true, error: null });
      
      // Convert undefined values to null for Firestore
      const firestoreSettings = {
        ...settings,
        defaultWeeklyMeetingDay: settings.defaultWeeklyMeetingDay ?? null,
        defaultWeeklyMeetingTime: settings.defaultWeeklyMeetingTime ?? null,
      };
      
      const settingsRef = doc(db, 'settings', userId);
      await updateDoc(settingsRef, firestoreSettings);
      
      set({ settings });

    } catch (error) {
      set({ error: 'Failed to update settings' });
      console.error('Error updating settings:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  resetSettings: async () => {
    try {
      set({ isLoading: true, error: null });
      
      const userId = 'TODO'; // TODO: Get current user ID
      const settingsRef = doc(db, 'settings', userId);
      await setDoc(settingsRef, defaultSettings);
      
      set({ settings: defaultSettings });

    } catch (error) {
      set({ error: 'Failed to reset settings' });
      console.error('Error resetting settings:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  getNextPlanningSession: () => {
    const { settings } = get();
    if (!settings) return new Date();

    const now = new Date();
    const currentWeek = startOfWeek(now);
    
    // Get the next planning day this week
    let nextSession = addDays(currentWeek, settings.weeklyPlanningDay);
    const [hours, minutes] = settings.weeklyPlanningTime.split(':').map(Number);
    nextSession = setHours(setMinutes(nextSession, minutes), hours);
    
    // If the next session is in the past, move to next week
    if (nextSession < now) {
      nextSession = addWeeks(nextSession, 1);
    }
    
    return nextSession;
  },

  getNextTeamMeeting: () => {
    const { settings } = get();
    if (!settings || !settings.defaultWeeklyMeetingDay || !settings.defaultWeeklyMeetingTime) {
      return new Date();
    }

    const now = new Date();
    const currentWeek = startOfWeek(now);
    
    // Get the next meeting day this week
    let nextMeeting = addDays(currentWeek, settings.defaultWeeklyMeetingDay);
    const [hours, minutes] = settings.defaultWeeklyMeetingTime.split(':').map(Number);
    nextMeeting = setHours(setMinutes(nextMeeting, minutes), hours);
    
    // If the next meeting is in the past, move to next week
    if (nextMeeting < now) {
      nextMeeting = addWeeks(nextMeeting, 1);
    }
    
    return nextMeeting;
  },

  subscribeToSettings: (userId) => {
    const settingsRef = doc(db, 'settings', userId);

    const unsubscribe = onSnapshot(
      settingsRef,
      (doc) => {
        if (doc.exists()) {
          set({ settings: doc.data() as Settings });
        }
      },
      (error) => {
        set({ error: 'Failed to subscribe to settings' });
        console.error('Error subscribing to settings:', error);
      }
    );

    return unsubscribe;
  }
})); 