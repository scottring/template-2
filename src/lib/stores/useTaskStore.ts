import { create } from 'zustand';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { Task, RecurrencePattern } from '@/types/models';
import { addDays, addWeeks, addMonths, addYears, isBefore } from 'date-fns';

interface TaskStore {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  
  // Task Management
  createTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>) => Promise<string>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  completeTask: (taskId: string, userId: string) => Promise<void>;
  
  // Task Queries
  getTasksByCategory: (category: Task['category']) => Task[];
  getTasksByAssignee: (userId: string) => Task[];
  getTasksDueThisWeek: () => Task[];
  getOverdueTasks: () => Task[];
  
  // Recurring Tasks
  createRecurringTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>, pattern: RecurrencePattern) => Promise<string>;
  generateNextOccurrence: (taskId: string) => Promise<void>;
  
  // Loading
  loadTasks: (householdId: string) => Promise<void>;
  subscribeToTasks: (householdId: string) => () => void;
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  isLoading: false,
  error: null,

  createTask: async (task) => {
    try {
      set({ isLoading: true, error: null });
      
      const taskRef = doc(collection(db, 'tasks'));
      const newTask: Task = {
        ...task,
        id: taskRef.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'TODO', // TODO: Get current user ID
        updatedBy: 'TODO', // TODO: Get current user ID
        status: 'pending',
        tags: task.tags || []
      };

      await setDoc(taskRef, newTask);
      set(state => ({ tasks: [...state.tasks, newTask] }));
      
      return taskRef.id;
    } catch (error) {
      set({ error: 'Failed to create task' });
      console.error('Error creating task:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  updateTask: async (taskId, updates) => {
    try {
      set({ isLoading: true, error: null });
      
      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, {
        ...updates,
        updatedAt: new Date(),
        updatedBy: 'TODO' // TODO: Get current user ID
      });

      set(state => ({
        tasks: state.tasks.map(task => 
          task.id === taskId ? { ...task, ...updates } : task
        )
      }));

    } catch (error) {
      set({ error: 'Failed to update task' });
      console.error('Error updating task:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteTask: async (taskId) => {
    try {
      set({ isLoading: true, error: null });
      
      await deleteDoc(doc(db, 'tasks', taskId));
      set(state => ({
        tasks: state.tasks.filter(task => task.id !== taskId)
      }));

    } catch (error) {
      set({ error: 'Failed to delete task' });
      console.error('Error deleting task:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  completeTask: async (taskId, userId) => {
    try {
      set({ isLoading: true, error: null });
      
      const task = get().tasks.find(t => t.id === taskId);
      if (!task) throw new Error('Task not found');

      // Update task status
      await updateDoc(doc(db, 'tasks', taskId), {
        status: 'completed',
        completedAt: new Date(),
        updatedAt: new Date(),
        updatedBy: userId
      });

      // If task is recurring, generate next occurrence
      if (task.recurrence) {
        await get().generateNextOccurrence(taskId);
      }

      set(state => ({
        tasks: state.tasks.map(t => 
          t.id === taskId 
            ? { 
                ...t, 
                status: 'completed', 
                completedAt: new Date() 
              } 
            : t
        )
      }));

    } catch (error) {
      set({ error: 'Failed to complete task' });
      console.error('Error completing task:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  getTasksByCategory: (category) => {
    return get().tasks.filter(task => task.category === category);
  },

  getTasksByAssignee: (userId) => {
    return get().tasks.filter(task => task.assignedTo.includes(userId));
  },

  getTasksDueThisWeek: () => {
    const now = new Date();
    const endOfWeek = addDays(now, 7);
    return get().tasks.filter(task => 
      task.dueDate && 
      isBefore(new Date(task.dueDate), endOfWeek) &&
      task.status === 'pending'
    );
  },

  getOverdueTasks: () => {
    const now = new Date();
    return get().tasks.filter(task => 
      task.dueDate && 
      isBefore(new Date(task.dueDate), now) &&
      task.status === 'pending'
    );
  },

  createRecurringTask: async (task, pattern) => {
    try {
      set({ isLoading: true, error: null });
      
      const taskRef = doc(collection(db, 'tasks'));
      const newTask: Task = {
        ...task,
        id: taskRef.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'TODO', // TODO: Get current user ID
        updatedBy: 'TODO', // TODO: Get current user ID
        status: 'pending',
        recurrence: pattern,
        tags: task.tags || []
      };

      await setDoc(taskRef, newTask);
      set(state => ({ tasks: [...state.tasks, newTask] }));
      
      return taskRef.id;
    } catch (error) {
      set({ error: 'Failed to create recurring task' });
      console.error('Error creating recurring task:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  generateNextOccurrence: async (taskId) => {
    const task = get().tasks.find(t => t.id === taskId);
    if (!task?.recurrence) return;

    try {
      set({ isLoading: true, error: null });
      
      // Calculate next due date based on recurrence pattern
      let nextDueDate = new Date();
      const { frequency, interval } = task.recurrence;

      switch (interval) {
        case 'daily':
          nextDueDate = addDays(new Date(task.dueDate!), frequency);
          break;
        case 'weekly':
          nextDueDate = addWeeks(new Date(task.dueDate!), frequency);
          break;
        case 'monthly':
          nextDueDate = addMonths(new Date(task.dueDate!), frequency);
          break;
        case 'yearly':
          nextDueDate = addYears(new Date(task.dueDate!), frequency);
          break;
      }

      // Create next occurrence
      const nextTaskRef = doc(collection(db, 'tasks'));
      const nextTask: Task = {
        ...task,
        id: nextTaskRef.id,
        status: 'pending',
        dueDate: nextDueDate,
        completedAt: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: task.createdBy,
        updatedBy: task.updatedBy
      };

      await setDoc(nextTaskRef, nextTask);
      set(state => ({ tasks: [...state.tasks, nextTask] }));

    } catch (error) {
      set({ error: 'Failed to generate next occurrence' });
      console.error('Error generating next occurrence:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  loadTasks: async (householdId) => {
    try {
      set({ isLoading: true, error: null });
      
      const tasksRef = collection(db, 'tasks');
      const q = query(
        tasksRef, 
        where('householdId', '==', householdId),
        orderBy('dueDate', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      const tasks = querySnapshot.docs.map(doc => doc.data() as Task);
      
      set({ tasks });

    } catch (error) {
      set({ error: 'Failed to load tasks' });
      console.error('Error loading tasks:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  subscribeToTasks: (householdId) => {
    const q = query(
      collection(db, 'tasks'),
      where('householdId', '==', householdId),
      orderBy('dueDate', 'asc')
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const tasks = querySnapshot.docs.map(doc => doc.data() as Task);
        set({ tasks });
      },
      (error) => {
        set({ error: 'Failed to subscribe to tasks' });
        console.error('Error subscribing to tasks:', error);
      }
    );

    return unsubscribe;
  }
})); 