import { create } from 'zustand';
import { 
  collection, 
  doc, 
  addDoc,
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  where,
  orderBy
} from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { Goal, Task } from '@/types/models';
import useTaskStore from '@/lib/stores/useTaskStore';

interface GoalStore {
  goals: Goal[];
  loading: boolean;
  error: string | null;
  
  // Core goal operations
  fetchGoals: (householdId: string) => Promise<void>;
  addGoal: (goal: Partial<Goal>) => Promise<void>;
  updateGoal: (goalId: string, updates: Partial<Goal>) => Promise<void>;
  deleteGoal: (goalId: string) => Promise<void>;
  
  // Goal organization
  getGoalsByArea: (areaId: string) => Goal[];
  getGoalsByStatus: (status: Goal['status']) => Goal[];
  getUpcomingGoals: (days: number) => Goal[];
}

const useGoalStore = create<GoalStore>((set, get) => ({
  goals: [],
  loading: false,
  error: null,

  fetchGoals: async (householdId: string) => {
    set({ loading: true, error: null });
    try {
      const q = query(
        collection(db, 'goals'),
        where('householdId', '==', householdId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const goals = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Goal));
      set({ goals, loading: false });
    } catch (error) {
      set({ error: 'Failed to fetch goals', loading: false });
    }
  },

  addGoal: async (goal: Partial<Goal>) => {
    set({ loading: true, error: null });
    try {
      const docRef = await addDoc(collection(db, 'goals'), {
        ...goal,
        successCriteria: [],
        createdAt: new Date(),
        updatedAt: new Date()
      });
      const newGoal = { ...goal, id: docRef.id } as Goal;
      set(state => ({ goals: [newGoal, ...state.goals], loading: false }));
    } catch (error) {
      set({ error: 'Failed to add goal', loading: false });
    }
  },

  updateGoal: async (goalId: string, updates: Partial<Goal>) => {
    set({ loading: true, error: null });
    try {
      await updateDoc(doc(db, 'goals', goalId), {
        ...updates,
        updatedAt: new Date()
      });
      set(state => ({
        goals: state.goals.map(goal => 
          goal.id === goalId ? { ...goal, ...updates } : goal
        ),
        loading: false
      }));
    } catch (error) {
      set({ error: 'Failed to update goal', loading: false });
    }
  },

  deleteGoal: async (goalId: string) => {
    try {
      set({ loading: true, error: null });
      
      // Get the goal to check for tasks
      const goal = get().goals.find(g => g.id === goalId);
      
      if (goal) {
        // Delete all tasks associated with this goal
        const taskStore = useTaskStore.getState();
        const tasks = taskStore.tasks.filter((t: Task) => t.goalId === goalId);
        
        // Delete each task
        for (const task of tasks) {
          await taskStore.deleteTask(task.id);
        }
        
        // Delete the goal from Firebase
        await deleteDoc(doc(db, 'goals', goalId));
        
        // Update local state
        set(state => ({
          goals: state.goals.filter(goal => goal.id !== goalId),
          loading: false
        }));
      }
    } catch (error) {
      set({ error: 'Failed to delete goal', loading: false });
      console.error('Error deleting goal:', error);
      throw error;
    }
  },

  getGoalsByArea: (areaId: string) => {
    return get().goals.filter(goal => goal.areaId === areaId);
  },

  getGoalsByStatus: (status: Goal['status']) => {
    return get().goals.filter(goal => goal.status === status);
  },

  getUpcomingGoals: (days: number) => {
    const now = new Date();
    const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    return get().goals.filter(goal =>
      goal.targetDate && 
      new Date(goal.targetDate) >= now &&
      new Date(goal.targetDate) <= future &&
      goal.status !== 'completed'
    );
  }
}));

export default useGoalStore;
