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
  orderBy,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { Goal, Task } from '@/types/models';

interface GoalStore {
  goals: Goal[];
  loading: boolean;
  error: string | null;
  
  // Core goal operations
  fetchGoals: (householdId: string) => Promise<void>;
  addGoal: (goal: Partial<Goal>) => Promise<string>;
  updateGoal: (goalId: string, updates: Partial<Goal>) => Promise<void>;
  deleteGoal: (goalId: string) => Promise<void>;
  migrateGoals: (householdId: string) => Promise<void>;
  
  // Goal organization
  getGoalsByArea: (areaId: string) => Goal[];
  getGoalsByStatus: (status: Goal['status']) => Goal[];
  getUpcomingGoals: (days: number) => Goal[];
}

const useGoalStore = create<GoalStore>((set, get) => ({
  goals: [],
  loading: false,
  error: null,

  migrateGoals: async (householdId: string) => {
    set({ loading: true, error: null });
    try {
      console.log('Starting goal migration to household:', householdId);
      const goalsRef = collection(db, 'goals');
      const allGoalsQuery = query(goalsRef);
      const snapshot = await getDocs(allGoalsQuery);
      
      console.log(`Found ${snapshot.size} goals to migrate`);
      
      for (const doc of snapshot.docs) {
        const data = doc.data();
        if (data.householdId !== householdId) {
          console.log(`Updating goal ${doc.id} (${data.name}) with new householdId`);
          await updateDoc(doc.ref, {
            householdId,
            updatedAt: serverTimestamp()
          });
        }
      }
      
      console.log('Migration complete, fetching updated goals');
      await get().fetchGoals(householdId);
    } catch (error) {
      console.error('Error migrating goals:', error);
      set({ error: 'Failed to migrate goals', loading: false });
    }
  },

  fetchGoals: async (householdId: string) => {
    set({ loading: true, error: null });
    try {
      console.log('Fetching goals for household:', householdId);
      const goalsRef = collection(db, 'goals');
      
      // First, let's see all goals regardless of householdId
      const allGoalsQuery = query(goalsRef);
      const allGoalsSnapshot = await getDocs(allGoalsQuery);
      console.log('All goals in Firestore:', allGoalsSnapshot.docs.map(doc => ({
        id: doc.id,
        householdId: doc.data().householdId,
        name: doc.data().name
      })));
      
      // Now query with the householdId filter
      const q = query(
        goalsRef,
        where('householdId', '==', householdId),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      console.log('Goals matching current householdId:', snapshot.docs.map(doc => ({
        id: doc.id,
        householdId: doc.data().householdId,
        name: doc.data().name
      })));
      
      const goals = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
          startDate: data.startDate?.toDate(),
          targetDate: data.targetDate?.toDate(),
          successCriteria: data.successCriteria?.map((c: any) => ({
            ...c,
            nextOccurrence: c.nextOccurrence?.toDate()
          })) || []
        } as Goal;
      });
      
      console.log('Setting goals in store:', goals);
      set({ goals, loading: false });
    } catch (error) {
      console.error('Error fetching goals:', error);
      set({ error: 'Failed to fetch goals', loading: false });
    }
  },

  addGoal: async (goal: Partial<Goal>) => {
    set({ loading: true, error: null });
    try {
      console.log('Adding goal:', goal);
      const docRef = await addDoc(collection(db, 'goals'), {
        ...goal,
        successCriteria: goal.successCriteria?.map(c => ({
          ...c,
          nextOccurrence: c.nextOccurrence ? Timestamp.fromDate(c.nextOccurrence) : null
        })) || [],
        startDate: Timestamp.fromDate(goal.startDate as Date),
        targetDate: Timestamp.fromDate(goal.targetDate as Date),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      console.log('Goal added with ID:', docRef.id);
      
      // Get the actual document to get server timestamps
      const docSnap = await getDoc(docRef);
      const data = docSnap.data();
      
      const newGoal = {
        ...goal,
        id: docRef.id,
        createdAt: data?.createdAt?.toDate() || new Date(),
        updatedAt: data?.updatedAt?.toDate() || new Date()
      } as Goal;
      
      set(state => ({ goals: [newGoal, ...state.goals], loading: false }));
      return docRef.id;
    } catch (error) {
      console.error('Error adding goal:', error);
      set({ error: 'Failed to add goal', loading: false });
      throw error;
    }
  },

  updateGoal: async (goalId: string, updates: Partial<Goal>) => {
    set({ loading: true, error: null });
    try {
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp()
      };
      
      if (updates.startDate) {
        updateData.startDate = Timestamp.fromDate(updates.startDate);
      }
      if (updates.targetDate) {
        updateData.targetDate = Timestamp.fromDate(updates.targetDate);
      }
      if (updates.successCriteria) {
        updateData.successCriteria = updates.successCriteria.map(c => ({
          ...c,
          nextOccurrence: c.nextOccurrence ? Timestamp.fromDate(c.nextOccurrence) : null
        }));
      }
      
      await updateDoc(doc(db, 'goals', goalId), updateData);
      
      // Get the updated document to get server timestamp
      const docSnap = await getDoc(doc(db, 'goals', goalId));
      const data = docSnap.data();
      
      set(state => ({
        goals: state.goals.map(goal => 
          goal.id === goalId ? {
            ...goal,
            ...updates,
            updatedAt: data?.updatedAt?.toDate() || new Date()
          } : goal
        ),
        loading: false
      }));
    } catch (error) {
      console.error('Error updating goal:', error);
      set({ error: 'Failed to update goal', loading: false });
    }
  },

  deleteGoal: async (goalId: string) => {
    set({ loading: true, error: null });
    try {
      await deleteDoc(doc(db, 'goals', goalId));
      set(state => ({
        goals: state.goals.filter(goal => goal.id !== goalId),
        loading: false
      }));
    } catch (error) {
      console.error('Error deleting goal:', error);
      set({ error: 'Failed to delete goal', loading: false });
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
    const future = new Date();
    future.setDate(future.getDate() + days);
    return get().goals.filter(goal => {
      const targetDate = goal.targetDate;
      return targetDate >= now && targetDate <= future;
    });
  }
}));

export default useGoalStore;
