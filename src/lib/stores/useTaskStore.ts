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
  onSnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { Task, TaskCategory, Goal, SuccessCriteria } from '@/types/models';
import useGoalStore from '@/lib/stores/useGoalStore';

interface TaskStore {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  
  // Core task operations
  fetchTasks: (householdId: string) => Promise<void>;
  addTask: (task: Partial<Task>) => Promise<void>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  completeTask: (taskId: string, userId: string) => Promise<void>;
  
  // Task filtering and organization
  getTasksByCategory: (category: TaskCategory) => Task[];
  getTasksByAssignee: (userId: string) => Task[];
  getOverdueTasks: () => Task[];
  getUpcomingTasks: (days: number) => Task[];
}

const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  loading: false,
  error: null,

  fetchTasks: async (householdId: string) => {
    set({ loading: true, error: null });
    try {
      const q = query(
        collection(db, 'tasks'),
        where('householdId', '==', householdId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const tasks = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Task));
      set({ tasks, loading: false });
    } catch (error) {
      set({ error: 'Failed to fetch tasks', loading: false });
    }
  },

  addTask: async (task: Partial<Task>) => {
    set({ loading: true, error: null });
    try {
      const docRef = await addDoc(collection(db, 'tasks'), {
        ...task,
        checklist: [],
        notes: [],
        createdAt: new Date(),
        updatedAt: new Date()
      });
      const newTask = { ...task, id: docRef.id } as Task;
      set(state => ({ tasks: [newTask, ...state.tasks], loading: false }));
    } catch (error) {
      set({ error: 'Failed to add task', loading: false });
    }
  },

  updateTask: async (taskId: string, updates: Partial<Task>) => {
    set({ loading: true, error: null });
    try {
      await updateDoc(doc(db, 'tasks', taskId), {
        ...updates,
        updatedAt: new Date()
      });
      set(state => ({
        tasks: state.tasks.map(task => 
          task.id === taskId ? { ...task, ...updates } : task
        ),
        loading: false
      }));
    } catch (error) {
      set({ error: 'Failed to update task', loading: false });
    }
  },

  deleteTask: async (taskId: string) => {
    try {
      set({ loading: true, error: null });
      
      // Delete from Firebase
      await deleteDoc(doc(db, 'tasks', taskId));

      // Get the task to check if it's linked to a goal
      const task = get().tasks.find(t => t.id === taskId);
      
      // If task is linked to a goal, update the goal's success criteria
      if (task?.goalId && task?.criteriaId) {
        const goalStore = useGoalStore.getState();
        const goal = goalStore.goals.find((g: Goal) => g.id === task.goalId);
        
        if (goal) {
          const updatedCriteria = goal.successCriteria?.map((c: SuccessCriteria) => {
            if (c.id === task.criteriaId) {
              return {
                ...c,
                tasks: (c.tasks || []).filter((t: { id: string }) => t.id !== taskId)
              };
            }
            return c;
          });

          await goalStore.updateGoal(goal.id, {
            ...goal,
            successCriteria: updatedCriteria
          });
        }
      }

      // Update local state
      set(state => ({
        tasks: state.tasks.filter(task => task.id !== taskId),
        loading: false
      }));

    } catch (error) {
      set({ error: 'Failed to delete task', loading: false });
      console.error('Error deleting task:', error);
      throw error;
    }
  },

  completeTask: async (taskId: string, userId: string) => {
    const updates: Partial<Task> = {
      status: 'completed',
      completedAt: new Date(),
      updatedBy: userId,
      updatedAt: new Date()
    };
    await get().updateTask(taskId, updates);
  },

  getTasksByCategory: (category: TaskCategory) => {
    return get().tasks.filter(task => task.category === category);
  },

  getTasksByAssignee: (userId: string) => {
    return get().tasks.filter(task => task.assignedTo.includes(userId));
  },

  getOverdueTasks: () => {
    const now = new Date();
    return get().tasks.filter(task => 
      task.dueDate && new Date(task.dueDate) < now && task.status !== 'completed'
    );
  },

  getUpcomingTasks: (days: number) => {
    const now = new Date();
    const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    return get().tasks.filter(task =>
      task.dueDate && 
      new Date(task.dueDate) >= now &&
      new Date(task.dueDate) <= future &&
      task.status !== 'completed'
    );
  }
}));

export default useTaskStore; 