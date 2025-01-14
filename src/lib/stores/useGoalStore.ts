import { create } from 'zustand';
import { Goal } from '@/types/models';
import { collection, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/firebase';

interface GoalStore {
  goals: Goal[];
  setGoals: (goals: Goal[]) => void;
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateGoal: (goalId: string, updates: Partial<Goal>) => Promise<void>;
  deleteGoal: (goalId: string) => Promise<void>;
}

export const useGoalStore = create<GoalStore>((set) => ({
  goals: [],
  setGoals: (goals) => set({ goals }),
  addGoal: async (goalData) => {
    try {
      const newGoal: Omit<Goal, 'id'> = {
        ...goalData,
        progress: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const docRef = await addDoc(collection(db, 'goals'), newGoal);
      const goal = { ...newGoal, id: docRef.id } as Goal;
      
      set((state) => ({ goals: [...state.goals, goal] }));
    } catch (error) {
      console.error('Error adding goal:', error);
      throw error;
    }
  },
  updateGoal: async (goalId, updates) => {
    try {
      const goalRef = doc(db, 'goals', goalId);
      const updatedGoal = { ...updates, updatedAt: new Date() };
      await updateDoc(goalRef, updatedGoal);
      
      set((state) => ({
        goals: state.goals.map((goal) =>
          goal.id === goalId ? { ...goal, ...updatedGoal } : goal
        ),
      }));
    } catch (error) {
      console.error('Error updating goal:', error);
      throw error;
    }
  },
  deleteGoal: async (goalId) => {
    try {
      await deleteDoc(doc(db, 'goals', goalId));
      set((state) => ({
        goals: state.goals.filter((goal) => goal.id !== goalId),
      }));
    } catch (error) {
      console.error('Error deleting goal:', error);
      throw error;
    }
  },
})); 