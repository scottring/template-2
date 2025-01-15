import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  ItineraryItem as BaseItineraryItem, 
  Goal, 
  SuccessCriteria, 
  TimeScale,
  Habit 
} from '@/types/models';
import { 
  startOfDay, 
  endOfDay, 
  addDays, 
  isSameDay,
  isWithinInterval 
} from 'date-fns';

// Extend ItineraryItem to include additional fields we need
interface ItineraryItem extends BaseItineraryItem {
  dueDate?: Date;
  timescale?: TimeScale;
}

interface StreakData {
  count: number;
  lastCompletedAt: Date | null;
}

interface ItemProgress {
  completed: number;
  total: number;
  lastUpdatedAt: Date;
}

interface HabitWithProgress {
  id: string;
  name: string;
  description: string;
  referenceId: string;
  frequency: {
    type: 'daily' | 'weekly' | 'monthly';
    value: number;
  };
  progress: ItemProgress;
  streak: number;
  assignedTo: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface ItineraryState {
  items: ItineraryItem[];
  streaks: Record<string, StreakData>;
  progress: Record<string, ItemProgress>;
  
  // Actions
  addItem: (item: ItineraryItem) => void;
  updateItem: (id: string, updates: Partial<ItineraryItem>) => void;
  removeItem: (id: string) => void;
  completeItem: (id: string, completed: boolean) => void;
  clearAllItems: (shouldRegenerate?: boolean) => void;
  
  // Goal Integration
  generateFromGoal: (goal: Goal) => void;
  updateFromCriteria: (goalId: string, criteria: SuccessCriteria[]) => void;
  
  // Queries
  getTodayItems: (date?: Date) => ItineraryItem[];
  getActiveHabits: () => HabitWithProgress[];
  getUpcomingItems: (startDate: Date, endDate: Date) => ItineraryItem[];
  getNeedsAttention: () => ItineraryItem[];
  
  // Streak Management
  getStreak: (itemId: string) => number;
  checkStreaks: () => void;
  
  // Progress Management
  getProgress: (itemId: string) => ItemProgress | null;
  syncProgress: (goalId: string) => void;

  regenerateAllItems: () => Promise<void>;

  updateItemSchedule: (itemId: string, schedule: ItineraryItem['schedule']) => void;
}

const useItineraryStore = create<ItineraryState>()(
  persist(
    (set, get) => ({
      items: [],
      streaks: {},
      progress: {},

      // Basic CRUD
      addItem: (item) => set((state) => ({
        items: [...state.items, item]
      })),

      updateItem: (id, updates) => set((state) => ({
        items: state.items.map((item) =>
          item.id === id ? { ...item, ...updates } : item
        )
      })),

      removeItem: (id) => set((state) => ({
        items: state.items.filter((item) => item.id !== id)
      })),

      // Completion & Streaks
      completeItem: (id, completed) => {
        const state = get();
        const item = state.items.find((i) => i.id === id);
        if (!item) return;

        // Update item status
        state.updateItem(id, { 
          status: completed ? 'completed' : 'pending' 
        });

        // Update streak
        const streak = state.streaks[id] || { count: 0, lastCompletedAt: null };
        const newStreak = {
          count: completed ? streak.count + 1 : Math.max(0, streak.count - 1),
          lastCompletedAt: completed ? new Date() : streak.lastCompletedAt
        };
        set((state) => ({
          streaks: { ...state.streaks, [id]: newStreak }
        }));

        // Update progress
        const progress = state.progress[id] || { completed: 0, total: 0, lastUpdatedAt: new Date() };
        const newProgress = {
          ...progress,
          completed: completed 
            ? progress.completed + 1 
            : Math.max(0, progress.completed - 1),
          lastUpdatedAt: new Date()
        };
        set((state) => ({
          progress: { ...state.progress, [id]: newProgress }
        }));

        console.log(`Item ${id} ${completed ? 'completed' : 'uncompleted'}:`, {
          newStreak,
          newProgress
        });
      },

      // Goal Integration
      generateFromGoal: (goal) => {
        console.log('Generating habits for goal:', { id: goal.id, name: goal.name });
        const trackedCriteria = goal.successCriteria.filter(c => c.isTracked && c.timescale);
        console.log('Tracked criteria:', trackedCriteria);

        // First, preserve any existing progress and streak data for this goal's habits
        const state = get();
        const existingItems = state.items.filter(item => 
          item.referenceId === goal.id && item.type === 'habit'
        );
        const existingProgress: Record<string, ItemProgress> = {};
        const existingStreaks: Record<string, StreakData> = {};

        existingItems.forEach(item => {
          if (state.progress[item.id]) {
            existingProgress[item.id] = state.progress[item.id];
          }
          if (state.streaks[item.id]) {
            existingStreaks[item.id] = state.streaks[item.id];
          }
        });

        // Remove existing habits for this goal
        set((state) => ({
          items: state.items.filter((item) => 
            !(item.referenceId === goal.id && item.type === 'habit')
          )
        }));

        // Then create new habits
        trackedCriteria.forEach(criteria => {
          // Extract frequency from criteria text (e.g., "Walk 3 times per week")
          const frequencyMatch = criteria.text.match(/(\d+)\s+times?\s+per\s+(day|week|month|quarter|year)/i);
          let targetTotal = 1; // Default to 1 if no frequency specified

          if (frequencyMatch) {
            const [_, count, period] = frequencyMatch;
            targetTotal = parseInt(count);
            console.log(`Extracted frequency: ${targetTotal} times per ${period}`);
          } else {
            // If no explicit frequency, use default based on timescale
            targetTotal = getDefaultTotal(criteria.timescale!);
          }

          // Create a unique ID that includes both goal ID and criteria text
          const itemId = `${goal.id}-${criteria.text}`;

          // Check if this habit already exists
          const existingItem = state.items.find(item => 
            item.id === itemId && item.type === 'habit'
          );

          // If the habit already exists, skip creating it
          if (existingItem) {
            console.log('Habit already exists:', itemId);
            return;
          }

          const item: ItineraryItem = {
            id: itemId,
            type: 'habit',
            referenceId: goal.id,
            status: 'pending',
            notes: criteria.text,
            timescale: criteria.timescale,
            dueDate: criteria.nextOccurrence
          };

          console.log('Creating habit:', { 
            id: item.id, 
            referenceId: item.referenceId,
            notes: item.notes,
            timescale: item.timescale,
            targetTotal,
            dueDate: item.dueDate
          });

          get().addItem(item);
          
          // Restore existing progress and streak data or initialize new ones
          set((state) => ({
            progress: {
              ...state.progress,
              [item.id]: existingProgress[item.id] || {
                completed: 0,
                total: targetTotal,
                lastUpdatedAt: new Date()
              }
            },
            streaks: {
              ...state.streaks,
              [item.id]: existingStreaks[item.id] || {
                count: 0,
                lastCompletedAt: null
              }
            }
          }));
        });
      },

      updateFromCriteria: (goalId, criteria) => {
        console.log('Updating criteria for goal:', goalId);
        
        // Get current state
        const state = get();
        
        // First, preserve any existing progress and streak data
        const existingItems = state.items.filter(item => 
          item.referenceId === goalId && item.type === 'habit'
        );
        const existingProgress: Record<string, ItemProgress> = {};
        const existingStreaks: Record<string, StreakData> = {};

        existingItems.forEach(item => {
          if (state.progress[item.id]) {
            existingProgress[item.id] = state.progress[item.id];
          }
          if (state.streaks[item.id]) {
            existingStreaks[item.id] = state.streaks[item.id];
          }
        });

        // Remove old items for this goal
        set((state) => ({
          items: state.items.filter((item) => 
            !(item.referenceId === goalId && item.type === 'habit')
          )
        }));

        // Generate new items
        criteria.filter(c => c.isTracked && c.timescale).forEach(c => {
          const itemId = `${goalId}-${c.text}`;
          
          // Check if this habit already exists
          const existingItem = state.items.find(item => 
            item.id === itemId && item.type === 'habit'
          );

          // If the habit already exists, skip creating it
          if (existingItem) {
            console.log('Habit already exists:', itemId);
            return;
          }

          const item: ItineraryItem = {
            id: itemId,
            type: 'habit',
            referenceId: goalId,
            status: 'pending',
            notes: c.text,
            timescale: c.timescale
          };

          console.log('Creating habit from criteria:', {
            id: item.id,
            referenceId: item.referenceId,
            notes: item.notes,
            timescale: item.timescale
          });

          get().addItem(item);

          // Restore existing progress and streak data or initialize new ones
          set((state) => ({
            progress: {
              ...state.progress,
              [item.id]: existingProgress[item.id] || {
                completed: 0,
                total: getDefaultTotal(c.timescale!),
                lastUpdatedAt: new Date()
              }
            },
            streaks: {
              ...state.streaks,
              [item.id]: existingStreaks[item.id] || {
                count: 0,
                lastCompletedAt: null
              }
            }
          }));
        });
      },

      // Queries
      getTodayItems: (date = new Date()) => {
        const state = get();
        const dayStart = startOfDay(date);
        const dayEnd = endOfDay(date);
        const dayOfWeek = date.getDay();

        return state.items.filter(item => {
          // For habits with specific schedules
          if (item.type === 'habit' && item.schedule) {
            // Check if this day is in the schedule
            if (!item.schedule.days.includes(dayOfWeek)) {
              return false;
            }

            const progress = state.progress[item.id];
            if (!progress) return false;

            // If already completed today, don't show
            if (progress.lastUpdatedAt && isSameDay(progress.lastUpdatedAt, date)) {
              const isCompleted = state.items.find(i => i.id === item.id)?.status === 'completed';
              if (isCompleted) return false;
            }

            return true;
          }
          
          // For habits without specific schedules (legacy support)
          if (item.type === 'habit' && !item.schedule) {
            const progress = state.progress[item.id];
            if (!progress) return false;

            // If already completed today, don't show
            if (progress.lastUpdatedAt && isSameDay(progress.lastUpdatedAt, date)) {
              const isCompleted = state.items.find(i => i.id === item.id)?.status === 'completed';
              if (isCompleted) return false;
            }

            // Check if this habit should be shown on this date based on timescale
            switch (item.timescale) {
              case 'daily':
                return true;
              case 'weekly':
                // Show on the same day of week as when it was created
                const createdDay = new Date(item.id.split('-')[0]).getDay();
                return date.getDay() === createdDay;
              case 'monthly':
                // Show on the same date of month as when it was created
                const createdDate = new Date(item.id.split('-')[0]).getDate();
                return date.getDate() === createdDate;
              case 'quarterly':
                // Show on the first day of each quarter
                const month = date.getMonth();
                return date.getDate() === 1 && (month % 3 === 0);
              case 'yearly':
                // Show on January 1st
                return date.getMonth() === 0 && date.getDate() === 1;
              default:
                return false;
            }
          }

          // For tasks and events, check if they're due on this date
          if (item.dueDate) {
            return isWithinInterval(item.dueDate, { start: dayStart, end: dayEnd });
          }

          return false;
        }).sort((a, b) => {
          // Sort by scheduled time if available
          const timeA = a.schedule?.time || '23:59';
          const timeB = b.schedule?.time || '23:59';
          return timeA.localeCompare(timeB);
        });
      },

      updateItemSchedule: (itemId: string, schedule: ItineraryItem['schedule']) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === itemId ? { ...item, schedule } : item
          ),
        }));
      },

      getActiveHabits: () => {
        const state = get();
        const habits: HabitWithProgress[] = state.items
          .filter((item): item is ItineraryItem & { type: 'habit' } => 
            item.type === 'habit'
          )
          .map((item) => {
            const progress = state.progress[item.id] || {
              completed: 0,
              total: 0,
              lastUpdatedAt: new Date()
            };

            return {
              id: item.id,
              name: item.notes || '',
              description: '',
              referenceId: item.referenceId,
              frequency: {
                type: (item.timescale === 'daily' || item.timescale === 'weekly' || item.timescale === 'monthly' 
                  ? item.timescale 
                  : 'daily') as 'daily' | 'weekly' | 'monthly',
                value: 1
              },
              progress,
              streak: state.streaks[item.id]?.count || 0,
              assignedTo: [],
              createdAt: new Date(),
              updatedAt: new Date()
            };
          });
        
        return habits;
      },

      getUpcomingItems: (startDate, endDate) => {
        return get().items.filter((item) => {
          if (!item.dueDate) return false;
          return isWithinInterval(item.dueDate, { start: startDate, end: endDate });
        });
      },

      getNeedsAttention: () => {
        const state = get();
        return state.items.filter((item) => {
          const streak = state.streaks[item.id];
          const progress = state.progress[item.id];

          // Check for broken streaks
          if (streak && streak.lastCompletedAt) {
            // Convert string date to Date object if needed
            const lastCompletedDate = streak.lastCompletedAt instanceof Date 
              ? streak.lastCompletedAt 
              : new Date(streak.lastCompletedAt);

            const daysSinceLastCompletion = Math.floor(
              (new Date().getTime() - lastCompletedDate.getTime()) / 
              (1000 * 60 * 60 * 24)
            );
            if (daysSinceLastCompletion > 1) return true;
          }

          // Check for behind schedule
          if (progress) {
            // Convert string date to Date object if needed
            const lastUpdatedDate = progress.lastUpdatedAt instanceof Date
              ? progress.lastUpdatedAt
              : new Date(progress.lastUpdatedAt);

            const isSignificantlyBehind = 
              progress.completed / progress.total < 0.5 &&
              lastUpdatedDate < addDays(new Date(), -1);
            if (isSignificantlyBehind) return true;
          }

          return false;
        });
      },

      // Streak Management
      getStreak: (itemId) => get().streaks[itemId]?.count || 0,

      checkStreaks: () => {
        const state = get();
        Object.entries(state.streaks).forEach(([itemId, streak]) => {
          if (!streak.lastCompletedAt) return;

          const daysSinceLastCompletion = Math.floor(
            (new Date().getTime() - streak.lastCompletedAt.getTime()) / 
            (1000 * 60 * 60 * 24)
          );

          if (daysSinceLastCompletion > 1) {
            set((state) => ({
              streaks: {
                ...state.streaks,
                [itemId]: { count: 0, lastCompletedAt: streak.lastCompletedAt }
              }
            }));
          }
        });
      },

      // Progress Management
      getProgress: (itemId) => get().progress[itemId] || null,

      syncProgress: (goalId) => {
        const state = get();
        const items = state.items.filter(
          (item) => item.referenceId === goalId
        );

        items.forEach((item) => {
          const progress = state.progress[item.id];
          if (!progress) return;

          // TODO: Sync with goal's success criteria progress
        });
      },

      clearAllItems: (shouldRegenerate = false) => {
        set((state) => ({
          items: [],
          streaks: {},
          progress: {}
        }));

        if (shouldRegenerate) {
          // Import dynamically to avoid circular dependency
          import('./useGoalStore').then(({ useGoalStore }) => {
            const goals = useGoalStore.getState().goals;
            console.log('Regenerating items from goals:', goals.map(g => g.name));
            goals.forEach(goal => {
              get().generateFromGoal(goal);
            });
          });
        }
      },

      regenerateAllItems: async () => {
        // First clear everything
        set((state) => ({
          items: [],
          streaks: {},
          progress: {}
        }));

        // Import dynamically to avoid circular dependency
        const { useGoalStore } = await import('./useGoalStore');
        const goals = useGoalStore.getState().goals;
        
        console.log('Regenerating all items from goals:', goals.map(g => g.name));
        
        // Generate items for each goal
        goals.forEach(goal => {
          get().generateFromGoal(goal);
        });
      }
    }),
    {
      name: 'itinerary-store'
    }
  )
);

// Helper function to get default total based on timescale
function getDefaultTotal(timescale: TimeScale): number {
  switch (timescale) {
    case 'daily': return 1;
    case 'weekly': return 7;
    case 'monthly': return 30;
    case 'quarterly': return 90;
    case 'yearly': return 365;
    default: return 1;
  }
}

export default useItineraryStore;
