import { create } from 'zustand';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { startOfWeek, addDays, parse, format } from 'date-fns';

interface PlanningSettings {
  weeklyPlanningDay: number; // 0-6 for Sunday-Saturday
  weeklyPlanningTime?: string; // HH:mm format
  autoScheduleWeeklyPlanning: boolean;
  defaultWeeklyMeetingDay?: number;
  defaultWeeklyMeetingTime?: string;
  reminderEnabled: boolean;
  reminderHoursBefore: number;
}

interface SettingsStore {
  settings: PlanningSettings;
  isLoading: boolean;
  error: string | null;
  loadSettings: (userId: string) => Promise<void>;
  saveSettings: (userId: string, settings: PlanningSettings) => Promise<void>;
  getNextPlanningDate: () => Date;
  getNextWeeklyMeetingDate: () => Date | null;
}

const defaultSettings: PlanningSettings = {
  weeklyPlanningDay: 0, // Sunday
  weeklyPlanningTime: '09:00',
  autoScheduleWeeklyPlanning: true,
  reminderEnabled: true,
  reminderHoursBefore: 24,
};

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: defaultSettings,
  isLoading: true,
  error: null,

  loadSettings: async (userId: string) => {
    try {
      set({ isLoading: true, error: null });
      const settingsDoc = await getDoc(doc(db, 'userSettings', userId));
      
      if (settingsDoc.exists()) {
        set({ settings: settingsDoc.data() as PlanningSettings });
      } else {
        // If no settings exist, save and use defaults
        await setDoc(doc(db, 'userSettings', userId), defaultSettings);
        set({ settings: defaultSettings });
      }
    } catch (error) {
      set({ error: 'Failed to load settings' });
      console.error('Error loading settings:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  saveSettings: async (userId: string, newSettings: PlanningSettings) => {
    try {
      set({ error: null });
      await setDoc(doc(db, 'userSettings', userId), newSettings);
      set({ settings: newSettings });
    } catch (error) {
      set({ error: 'Failed to save settings' });
      console.error('Error saving settings:', error);
    }
  },

  getNextPlanningDate: () => {
    const { settings } = get();
    const now = new Date();
    const currentWeekStart = startOfWeek(now);
    
    // Get the planning day this week
    let planningDate = addDays(currentWeekStart, settings.weeklyPlanningDay);
    
    // If planning time is set, add it to the date
    if (settings.weeklyPlanningTime) {
      const [hours, minutes] = settings.weeklyPlanningTime.split(':').map(Number);
      planningDate.setHours(hours, minutes, 0, 0);
    }

    // If this week's planning date has passed, get next week's
    if (planningDate < now) {
      planningDate = addDays(planningDate, 7);
    }

    return planningDate;
  },

  getNextWeeklyMeetingDate: () => {
    const { settings } = get();
    if (!settings.defaultWeeklyMeetingDay || !settings.defaultWeeklyMeetingTime) {
      return null;
    }

    const now = new Date();
    const currentWeekStart = startOfWeek(now);
    
    // Get the meeting day this week
    let meetingDate = addDays(currentWeekStart, settings.defaultWeeklyMeetingDay);
    
    // Add the meeting time
    const [hours, minutes] = settings.defaultWeeklyMeetingTime.split(':').map(Number);
    meetingDate.setHours(hours, minutes, 0, 0);

    // If this week's meeting has passed, get next week's
    if (meetingDate < now) {
      meetingDate = addDays(meetingDate, 7);
    }

    return meetingDate;
  },
})); 