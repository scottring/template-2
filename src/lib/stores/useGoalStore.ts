import { create } from 'zustand';
import { Goal } from '@/types/models';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebase';

interface GoalStore {
  goals: Goal[];
  setGoals: (goals: Goal[]) => void;
  loadGoals: () => Promise<void>;
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateGoal: (goalId: string, updates: Partial<Goal>) => Promise<void>;
  deleteGoal: (goalId: string) => Promise<void>;
}

export const useGoalStore = create<GoalStore>((set) => ({
  goals: [],
  setGoals: (goals) => set({ goals }),
  loadGoals: async () => {
    try {
      console.log('Starting to load goals...');
      const querySnapshot = await getDocs(collection(db, 'goals'));
      const goals = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Goal));
      console.log('Loaded goals:', goals.map(g => ({ id: g.id, name: g.name })));
      set({ goals });
    } catch (error) {
      console.error('Error loading goals:', error);
      throw error;
    }
  },
  addGoal: async (goalData) => {
    try {
      // Clean up successCriteria by removing undefined values
      const cleanedSuccessCriteria = goalData.successCriteria.map(criteria => ({
        text: criteria.text || '',
        isTracked: criteria.isTracked || false,
        ...(criteria.timescale && { timescale: criteria.timescale }),
        ...(criteria.nextOccurrence && { nextOccurrence: criteria.nextOccurrence })
      }));

      const newGoal: Omit<Goal, 'id'> = {
        ...goalData,
        successCriteria: cleanedSuccessCriteria,
        progress: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const docRef = await addDoc(collection(db, 'goals'), newGoal);
      const goal = { ...newGoal, id: docRef.id } as Goal;
      
      set((state) => ({ goals: [...state.goals, goal] }));
      return docRef.id; // Return the new goal's ID
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
