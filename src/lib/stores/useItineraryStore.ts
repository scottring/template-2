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
  clearAllItems: () => void;
  
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
          count: completed ? streak.count + 1 : 0,
          lastCompletedAt: completed ? new Date() : streak.lastCompletedAt
        };
        set((state) => ({
          streaks: { ...state.streaks, [id]: newStreak }
        }));

        // Update progress
        const progress = state.progress[id] || { completed: 0, total: 0, lastUpdatedAt: new Date() };
        const newProgress = {
          ...progress,
          completed: completed ? progress.completed + 1 : progress.completed,
          lastUpdatedAt: new Date()
        };
        set((state) => ({
          progress: { ...state.progress, [id]: newProgress }
        }));
      },

      // Goal Integration
      generateFromGoal: (goal) => {
        console.log('Generating habits for goal:', { id: goal.id, name: goal.name });
        const trackedCriteria = goal.successCriteria.filter(c => c.isTracked && c.timescale);
        console.log('Tracked criteria:', trackedCriteria);

        // First, remove any existing habits for this goal
        set((state) => ({
          items: state.items.filter((item) => 
            !(item.referenceId === goal.id && item.type === 'habit')
          )
        }));

        // Then create new habits
        trackedCriteria.forEach(criteria => {
          // Create a unique ID that includes both goal ID and criteria text
          const itemId = `${goal.id}-${criteria.text}`;

          const item: ItineraryItem = {
            id: itemId,
            type: 'habit',
            referenceId: goal.id, // This is crucial - it links the habit to the goal
            status: 'pending',
            notes: criteria.text,
            timescale: criteria.timescale
          };

          console.log('Creating habit:', { 
            id: item.id, 
            referenceId: item.referenceId,
            notes: item.notes,
            timescale: item.timescale
          });

          get().addItem(item);
          
          // Initialize progress tracking
          set((state) => ({
            progress: {
              ...state.progress,
              [item.id]: {
                completed: 0,
                total: getDefaultTotal(criteria.timescale!),
                lastUpdatedAt: new Date()
              }
            }
          }));
        });
      },

      updateFromCriteria: (goalId, criteria) => {
        console.log('Updating criteria for goal:', goalId);
        
        // Remove old items for this goal
        set((state) => ({
          items: state.items.filter((item) => 
            !(item.referenceId === goalId && item.type === 'habit')
          )
        }));

        // Generate new items
        criteria.filter(c => c.isTracked && c.timescale).forEach(c => {
          const itemId = `${goalId}-${c.text}`;
          
          const item: ItineraryItem = {
            id: itemId,
            type: 'habit',
            referenceId: goalId, // Ensure referenceId is set
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
        });
      },

      // Queries
      getTodayItems: (date = new Date()) => {
        const state = get();
        return state.items.filter((item) => {
          // For habits, check if they need to be done today based on timescale
          if (item.type === 'habit') {
            const progress = state.progress[item.id];
            if (!progress) return false;
            
            // Check if the item needs to be done today based on its timescale
            const lastUpdate = new Date(progress.lastUpdatedAt);
            const today = startOfDay(date);
            const daysSinceLastUpdate = Math.floor(
              (today.getTime() - startOfDay(lastUpdate).getTime()) / (1000 * 60 * 60 * 24)
            );

            // If it's been completed today, don't show it
            if (isSameDay(lastUpdate, today) && progress.completed >= progress.total) {
              return false;
            }

            // Check based on timescale
            switch (item.timescale) {
              case 'daily':
                return daysSinceLastUpdate >= 1 || progress.completed < progress.total;
              case 'weekly':
                return daysSinceLastUpdate >= 7 || progress.completed < progress.total;
              case 'monthly':
                return daysSinceLastUpdate >= 30 || progress.completed < progress.total;
              default:
                return false;
            }
          }

          // For tasks, check the due date
          return item.type === 'task' && item.dueDate && isSameDay(date, item.dueDate);
        });
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

      clearAllItems: () => {
        set((state) => ({
          items: [],
          streaks: {},
          progress: {}
        }));
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
