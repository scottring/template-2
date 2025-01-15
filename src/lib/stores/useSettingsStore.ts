import { create } from 'zustand';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  onSnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { NotificationPreferences } from '@/types/models';

interface Settings {
  notifications: NotificationPreferences;
  defaultView: 'day' | 'week' | 'month';
  colorScheme: 'system' | 'light' | 'dark';
}

interface SettingsStore {
  settings: Settings | null;
  isLoading: boolean;
  error: string | null;
  
  // Settings Management
  loadSettings: (userId: string) => Promise<void>;
  updateSettings: (updates: Partial<Settings>) => Promise<void>;
  resetSettings: () => Promise<void>;
  
  // Subscriptions
  subscribeToSettings: (userId: string) => () => void;
}

const defaultSettings: Settings = {
  notifications: {
    taskReminders: true,
    planningReminders: false,
    inventoryAlerts: false,
    taskAssignments: true,
    reminderHoursBefore: 24
  },
  defaultView: 'week',
  colorScheme: 'system'
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

  updateSettings: async (updates) => {
    try {
      set({ isLoading: true, error: null });
      
      const { settings } = get();
      if (!settings) throw new Error('Settings not loaded');

      const updatedSettings = { ...settings, ...updates };
      const userId = 'TODO'; // TODO: Get current user ID
      
      const settingsRef = doc(db, 'settings', userId);
      await updateDoc(settingsRef, updates);
      
      set({ settings: updatedSettings });

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