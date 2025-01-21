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
  serverTimestamp,
  DocumentData
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

const convertFirestoreTimestamps = (data: DocumentData): Partial<Goal> => {
  return {
    ...data,
    createdAt: data.createdAt?.toDate(),
    updatedAt: data.updatedAt?.toDate(),
    startDate: data.startDate?.toDate(),
    targetDate: data.targetDate?.toDate(),
    steps: data.steps?.map((step: any) => ({
      ...step,
      nextOccurrence: step.nextOccurrence?.toDate(),
      repeatEndDate: step.repeatEndDate?.toDate(),
      tasks: step.tasks || [],
      notes: step.notes || []
    })) || []
  };
};

const useGoalStore = create<GoalStore>((set, get) => ({
  goals: [],
  loading: false,
  error: null,

  fetchGoals: async (householdId: string) => {
    console.log('Fetching goals for household:', householdId);
    set({ loading: true, error: null });
    try {
      const goalsRef = collection(db, 'goals');
      console.log('Created goals collection reference');
      
      const q = query(
        goalsRef,
        where('householdId', '==', householdId),
        orderBy('createdAt', 'desc')
      );
      console.log('Created query:', {
        collection: 'goals',
        householdId,
        orderBy: 'createdAt'
      });
      
      try {
        const snapshot = await getDocs(q);
        console.log(`Found ${snapshot.size} goals`);
        
        const goals = snapshot.docs.map(doc => {
          const data = doc.data();
          console.log('Processing goal:', {
            id: doc.id,
            name: data.name,
            status: data.status,
            criteria: data.successCriteria?.length || 0,
            householdId: data.householdId
          });
          return {
            ...convertFirestoreTimestamps(data),
            id: doc.id,
          };
        }) as Goal[];
        
        console.log('Setting goals in store:', {
          count: goals.length,
          statuses: goals.map(g => g.status),
          householdIds: goals.map(g => g.householdId)
        });
        set({ goals, loading: false });
      } catch (queryError) {
        console.error('Error executing query:', queryError);
        set({ error: 'Failed to execute goals query', loading: false });
        throw queryError;
      }
    } catch (error) {
      console.error('Error in fetchGoals:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to fetch goals', loading: false });
      throw error;
    }
  },

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

  addGoal: async (goal: Partial<Goal>) => {
    set({ loading: true, error: null });
    try {
      // Ensure we have required fields
      if (!goal.householdId) {
        throw new Error('householdId is required');
      }

      // Clean and validate all fields before sending to Firestore
      const cleanGoal = {
        householdId: goal.householdId,
        name: goal.name || '',
        description: goal.description || '',
        goalType: goal.goalType || 'Project',
        areaId: goal.areaId || '',
        assignedTo: goal.assignedTo || [],
        status: goal.status || 'not_started',
        progress: goal.progress || 0,
        startDate: goal.startDate ? Timestamp.fromDate(goal.startDate) : Timestamp.fromDate(new Date()),
        targetDate: goal.targetDate ? Timestamp.fromDate(goal.targetDate) : null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        steps: (goal.steps || []).map(step => ({
          id: step.id || crypto.randomUUID(),
          text: step.text || '',
          stepType: step.stepType || 'Tangible',
          isTracked: Boolean(step.isTracked),
          tasks: (step.tasks || []).map(task => ({
            id: task.id || crypto.randomUUID(),
            text: task.text || '',
            completed: Boolean(task.completed)
          })),
          notes: (step.notes || []).map(note => ({
            id: note.id || crypto.randomUUID(),
            text: note.text || '',
            timestamp: note.timestamp ? Timestamp.fromDate(note.timestamp) : serverTimestamp()
          })),
          selectedDays: step.selectedDays || [],
          scheduledTimes: step.scheduledTimes || {},
          frequency: step.frequency || 1,
          timescale: step.timescale || 'weekly',
          nextOccurrence: step.nextOccurrence ? Timestamp.fromDate(step.nextOccurrence) : null,
          repeatEndDate: step.repeatEndDate ? Timestamp.fromDate(step.repeatEndDate) : null
        }))
      };

      console.log('Adding goal with data:', cleanGoal);
      const docRef = await addDoc(collection(db, 'goals'), cleanGoal);
      
      const docSnap = await getDoc(docRef);
      const data = docSnap.data();
      
      if (data) {
        const newGoal = {
          ...convertFirestoreTimestamps(data),
          id: docRef.id,
        } as Goal;
        
        set(state => ({ goals: [newGoal, ...state.goals], loading: false }));
        return docRef.id;
      }
      throw new Error('Failed to create goal document');
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
        updatedAt: serverTimestamp(),
        startDate: updates.startDate ? Timestamp.fromDate(updates.startDate) : undefined,
        targetDate: updates.targetDate ? Timestamp.fromDate(updates.targetDate) : undefined,
        steps: updates.steps?.map(step => ({
          id: step.id,
          text: step.text || '',
          stepType: step.stepType || 'Tangible',
          isTracked: Boolean(step.isTracked),
          tasks: (step.tasks || []).map(task => ({
            id: task.id,
            text: task.text || '',
            completed: Boolean(task.completed)
          })),
          notes: (step.notes || []).map(note => ({
            id: note.id,
            text: note.text || '',
            timestamp: note.timestamp ? Timestamp.fromDate(note.timestamp) : serverTimestamp()
          })),
          selectedDays: step.selectedDays || [],
          scheduledTimes: step.scheduledTimes || {},
          frequency: step.frequency || 1,
          timescale: step.timescale || 'weekly',
          nextOccurrence: step.nextOccurrence ? Timestamp.fromDate(step.nextOccurrence) : null,
          repeatEndDate: step.repeatEndDate ? Timestamp.fromDate(step.repeatEndDate) : null
        }))
      };
      
      console.log('Updating goal with data:', updateData);
      await updateDoc(doc(db, 'goals', goalId), updateData);
      const docSnap = await getDoc(doc(db, 'goals', goalId));
      const data = docSnap.data();
      
      if (data) {
        set(state => ({
          goals: state.goals.map(goal => 
            goal.id === goalId ? {
              ...goal,
              ...convertFirestoreTimestamps(data),
              id: goalId
            } : goal
          ),
          loading: false
        }));
      }
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
      return targetDate && targetDate >= now && targetDate <= future;
    });
  }
}));

export default useGoalStore;
