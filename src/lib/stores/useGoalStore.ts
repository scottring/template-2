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
import { toFirestoreDate, fromFirestoreDate, validateDate } from '@/lib/utils/dateUtils';
import { isValid } from 'date-fns';
import { db } from '@/lib/firebase/firebase';
import { Goal, Task } from '@/types/models';

interface GoalStore {
  goals: Goal[];
  loading: boolean;
  error: string | null;
  
  fetchGoals: (householdId: string) => Promise<void>;
  addGoal: (goal: Partial<Goal>) => Promise<string>;
  updateGoal: (goalId: string, updates: Partial<Goal>) => Promise<void>;
  deleteGoal: (goalId: string) => Promise<void>;
  completeGoal: (goalId: string) => Promise<void>;
  migrateGoals: (householdId: string) => Promise<void>;
  
  getGoalsByArea: (areaId: string) => Goal[];
  getGoalsByStatus: (status: Goal['status']) => Goal[];
  getUpcomingGoals: (days: number) => Goal[];
}

const convertFirestoreTimestamps = (data: DocumentData): Partial<Goal> => {
  const convertDate = (date: any): Date => {
    try {
      if (date instanceof Timestamp) {
        return date.toDate();
      }
      if (date instanceof Date) {
        return date;
      }
      if (typeof date === 'string') {
        const d = new Date(date);
        if (isValid(d)) return d;
      }
      console.log('Invalid date, using current date:', date);
      return new Date();
    } catch (e) {
      console.error('Error converting date:', date, e);
      return new Date();
    }
  };

  return {
    ...data,
    createdAt: convertDate(data.createdAt),
    updatedAt: convertDate(data.updatedAt),
    startDate: convertDate(data.startDate),
    targetDate: data.targetDate ? convertDate(data.targetDate) : undefined,
    steps: data.steps?.map((step: any) => ({
      ...step,
      nextOccurrence: convertDate(step.nextOccurrence),
      repeatEndDate: convertDate(step.repeatEndDate),
      tasks: (step.tasks || []).map((task: any) => ({
        ...task,
        dueDate: convertDate(task.dueDate)
      })),
      notes: step.notes || []
    })) || []
  };
};

const removeUndefined = (obj: any): any => {
  const result: any = {};
  Object.entries(obj).forEach(([key, value]) => {
    if (value !== undefined) {
      if (Array.isArray(value)) {
        result[key] = value.map(item => 
          typeof item === 'object' && item !== null ? removeUndefined(item) : item
        );
      } else if (typeof value === 'object' && value !== null) {
        result[key] = removeUndefined(value);
      } else {
        result[key] = value;
      }
    }
  });
  return result;
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
          console.log('Raw Firestore data:', {
            id: doc.id,
            ...data
          });
          
          const convertedData = convertFirestoreTimestamps(data);
          console.log('Converted data:', {
            id: doc.id,
            ...convertedData
          });
          
          // Check for required fields
          const goal = {
            ...convertedData,
            id: doc.id,
          };
          
          console.log('Final goal object:', goal);
          return goal;
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
      if (!goal.householdId) {
        throw new Error('householdId is required');
      }

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
            tasks: (step.tasks || []).map(task => {
              // Initialize dueDate if undefined
              const initialDueDate = task.dueDate || null;
              
              // Convert to Firestore timestamp if valid
              const cleanDueDate = initialDueDate && isValid(new Date(initialDueDate))
                ? Timestamp.fromDate(new Date(initialDueDate))
                : null;
              
              console.log('Task initialization:', {
                id: task.id,
                initialDueDate,
                cleanDueDate,
                isValid: initialDueDate ? isValid(new Date(initialDueDate)) : false
              });
              
              return {
                id: task.id || crypto.randomUUID(),
                text: task.text || '',
                status: task.status || 'pending',
                dueDate: cleanDueDate
              };
            }),
          notes: step.notes || [],
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
      console.log('Starting goal update for:', goalId);
      console.log('Raw updates:', updates);

      const cleanUpdates = {
        ...updates,
        updatedAt: serverTimestamp(),
        startDate: updates.startDate && isValid(new Date(updates.startDate)) 
          ? Timestamp.fromDate(new Date(updates.startDate)) 
          : undefined,
        targetDate: updates.targetDate && isValid(new Date(updates.targetDate))
          ? Timestamp.fromDate(new Date(updates.targetDate))
          : undefined,
        steps: updates.steps?.map(step => {
          console.log('Processing step:', step.id);
          return {
            ...step,
            tasks: (step.tasks || []).map(task => {
              const cleanDueDate = task.dueDate && isValid(new Date(task.dueDate))
                ? Timestamp.fromDate(new Date(task.dueDate))
                : null;
              
              console.log('Task date conversion:', {
                input: task.dueDate,
                output: cleanDueDate,
                isValid: task.dueDate ? isValid(new Date(task.dueDate)) : false
              });
              
              return {
                ...task,
                dueDate: cleanDueDate
              };
            }),
            nextOccurrence: step.nextOccurrence && isValid(new Date(step.nextOccurrence))
              ? Timestamp.fromDate(new Date(step.nextOccurrence))
              : undefined,
            repeatEndDate: step.repeatEndDate && isValid(new Date(step.repeatEndDate))
              ? Timestamp.fromDate(new Date(step.repeatEndDate))
              : undefined
          };
        })
      };
      
      const cleanUpdateData = removeUndefined(cleanUpdates);
      console.log('Clean update data:', cleanUpdateData);
      
      await updateDoc(doc(db, 'goals', goalId), cleanUpdateData);
      
      const docSnap = await getDoc(doc(db, 'goals', goalId));
      if (!docSnap.exists()) {
        throw new Error('Goal document not found');
      }
      
      const data = docSnap.data();
      if (data) {
        const updatedGoal = {
          ...convertFirestoreTimestamps(data),
          id: goalId
        } as Goal;
        
        set(state => ({
          goals: state.goals.map(g => 
            g.id === goalId ? updatedGoal : g
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

  completeGoal: async (goalId: string) => {
    set({ loading: true, error: null });
    try {
      await updateDoc(doc(db, 'goals', goalId), {
        status: 'completed',
        progress: 100,
        updatedAt: serverTimestamp()
      });
      set(state => ({
        goals: state.goals.map(goal => 
          goal.id === goalId ? {...goal, status: 'completed', progress: 100} : goal
        ),
        loading: false
      }));
    } catch (error) {
      console.error('Error completing goal:', error);
      set({ error: 'Failed to complete goal', loading: false });
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
