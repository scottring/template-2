import { create } from 'zustand';
import { Goal } from '@/types/models';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import useItineraryStore from './useItineraryStore';
import { ItineraryItem } from '@/types/models';

interface GoalStore {
  goals: Goal[];
  setGoals: (goals: Goal[]) => void;
  loadGoals: () => Promise<void>;
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateGoal: (goalId: string, updates: Partial<Goal>) => Promise<void>;
  deleteGoal: (goalId: string) => Promise<void>;
  subscribeToGoals: () => () => void;
}

export const useGoalStore = create<GoalStore>((set) => ({
  goals: [],
  setGoals: (goals) => set({ goals }),
  
  loadGoals: async () => {
    try {
      console.log('Starting to load goals...');
      const querySnapshot = await getDocs(collection(db, 'goals'));
      const goals = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
          targetDate: data.targetDate?.toDate(),
          startDate: data.startDate?.toDate(),
          successCriteria: data.successCriteria?.map((criteria: any) => ({
            text: criteria.text || '',
            isTracked: criteria.isTracked || false,
            timescale: criteria.timescale,
            nextOccurrence: criteria.nextOccurrence?.toDate()
          })) || [],
        } as Goal;
      });
      console.log('Loaded goals:', goals.map(g => ({ id: g.id, name: g.name })));
      set({ goals });
    } catch (error) {
      console.error('Error loading goals:', error);
      throw error;
    }
  },

  subscribeToGoals: () => {
    const q = query(collection(db, 'goals'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const goals = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
          targetDate: data.targetDate?.toDate(),
          startDate: data.startDate?.toDate(),
          successCriteria: data.successCriteria?.map((criteria: any) => ({
            text: criteria.text || '',
            isTracked: criteria.isTracked || false,
            timescale: criteria.timescale,
            nextOccurrence: criteria.nextOccurrence?.toDate()
          })) || [],
        } as Goal;
      });
      set({ goals });
    });
    return unsubscribe;
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
      return docRef.id; // Return the new goal's ID
    } catch (error) {
      console.error('Error adding goal:', error);
      throw error;
    }
  },

  updateGoal: async (goalId, updates) => {
    try {
      const goalRef = doc(db, 'goals', goalId);
      
      // Clean up the updates by removing undefined values
      const cleanedUpdates = Object.entries(updates).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, any>);

      // Add updatedAt
      const updatedGoal = { ...cleanedUpdates, updatedAt: new Date() };
      
      await updateDoc(goalRef, updatedGoal);
    } catch (error) {
      console.error('Error updating goal:', error);
      throw error;
    }
  },

  deleteGoal: async (goalId: string) => {
    try {
      // Delete from Firebase
      const docRef = doc(db, 'goals', goalId);
      await deleteDoc(docRef);

      // Delete associated itinerary items
      const itineraryStore = useItineraryStore.getState();
      const updatedItems = itineraryStore.items.filter((item: ItineraryItem) => 
        !(item.referenceId === goalId && item.type === 'habit')
      );

      // Update the itinerary store with just the filtered items
      useItineraryStore.setState({
        items: updatedItems
      });

      console.log(`Goal ${goalId} and associated items deleted successfully`);
    } catch (error) {
      console.error('Error deleting goal:', error);
      throw error;
    }
  }
}));

export default useGoalStore;
