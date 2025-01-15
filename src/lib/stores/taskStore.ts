import { create } from 'zustand';
import { Task, TaskCategory } from '@/types/models';
import { db } from '@/lib/firebase/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where, orderBy } from 'firebase/firestore';

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
  
  // Task assignment
  assignTask: (taskId: string, userIds: string[]) => Promise<void>;
  unassignTask: (taskId: string, userId: string) => Promise<void>;
  
  // Task checklist
  addChecklistItem: (taskId: string, text: string) => Promise<void>;
  toggleChecklistItem: (taskId: string, itemId: string, userId: string) => Promise<void>;
  
  // Task notes
  addNote: (taskId: string, text: string, type: 'comment' | 'update' | 'question', userId: string) => Promise<void>;
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
      const docRef = await addDoc(collection(db, 'tasks'), task);
      const newTask = { ...task, id: docRef.id } as Task;
      set(state => ({ tasks: [newTask, ...state.tasks], loading: false }));
    } catch (error) {
      set({ error: 'Failed to add task', loading: false });
    }
  },

  updateTask: async (taskId: string, updates: Partial<Task>) => {
    set({ loading: true, error: null });
    try {
      await updateDoc(doc(db, 'tasks', taskId), updates);
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
    set({ loading: true, error: null });
    try {
      await deleteDoc(doc(db, 'tasks', taskId));
      set(state => ({
        tasks: state.tasks.filter(task => task.id !== taskId),
        loading: false
      }));
    } catch (error) {
      set({ error: 'Failed to delete task', loading: false });
    }
  },

  completeTask: async (taskId: string, userId: string) => {
    const updates: Partial<Task> = {
      status: 'completed' as const,
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
  },

  assignTask: async (taskId: string, userIds: string[]) => {
    await get().updateTask(taskId, { assignedTo: userIds });
  },

  unassignTask: async (taskId: string, userId: string) => {
    const task = get().tasks.find(t => t.id === taskId);
    if (task) {
      const newAssignees = task.assignedTo.filter(id => id !== userId);
      await get().updateTask(taskId, { assignedTo: newAssignees });
    }
  },

  addChecklistItem: async (taskId: string, text: string) => {
    const task = get().tasks.find(t => t.id === taskId);
    if (task) {
      const newItem = {
        id: crypto.randomUUID(),
        text,
        completed: false
      };
      const checklist = [...(task.checklist || []), newItem];
      await get().updateTask(taskId, { checklist });
    }
  },

  toggleChecklistItem: async (taskId: string, itemId: string, userId: string) => {
    const task = get().tasks.find(t => t.id === taskId);
    if (task && task.checklist) {
      const updatedChecklist = task.checklist.map(item =>
        item.id === itemId
          ? {
              ...item,
              completed: !item.completed,
              completedAt: !item.completed ? new Date() : undefined,
              completedBy: !item.completed ? userId : undefined
            }
          : item
      );
      await get().updateTask(taskId, { checklist: updatedChecklist });
    }
  },

  addNote: async (taskId: string, text: string, type: 'comment' | 'update' | 'question', userId: string) => {
    const task = get().tasks.find(t => t.id === taskId);
    if (task) {
      const newNote = {
        id: crypto.randomUUID(),
        text,
        type,
        createdAt: new Date(),
        createdBy: userId
      };
      const notes = [...(task.notes || []), newNote];
      await get().updateTask(taskId, { notes });
    }
  }
}));

export default useTaskStore; 