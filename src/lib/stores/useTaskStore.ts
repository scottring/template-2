import { create } from 'zustand';
import { Task } from '@/types/models';
import { collection, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/firebase';

interface TaskStore {
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  toggleTaskCompletion: (taskId: string) => Promise<void>;
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  setTasks: (tasks) => set({ tasks }),
  addTask: async (taskData) => {
    try {
      const newTask: Omit<Task, 'id'> = {
        ...taskData,
        isCompleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const docRef = await addDoc(collection(db, 'tasks'), newTask);
      const task = { ...newTask, id: docRef.id } as Task;
      
      set((state) => ({ tasks: [...state.tasks, task] }));
    } catch (error) {
      console.error('Error adding task:', error);
      throw error;
    }
  },
  updateTask: async (taskId, updates) => {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      const updatedTask = { ...updates, updatedAt: new Date() };
      await updateDoc(taskRef, updatedTask);
      
      set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === taskId ? { ...task, ...updatedTask } : task
        ),
      }));
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  },
  deleteTask: async (taskId) => {
    try {
      await deleteDoc(doc(db, 'tasks', taskId));
      set((state) => ({
        tasks: state.tasks.filter((task) => task.id !== taskId),
      }));
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  },
  toggleTaskCompletion: async (taskId) => {
    try {
      const task = get().tasks.find((t) => t.id === taskId);
      if (!task) return;

      const taskRef = doc(db, 'tasks', taskId);
      const updatedTask = { isCompleted: !task.isCompleted, updatedAt: new Date() };
      await updateDoc(taskRef, updatedTask);
      
      set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === taskId ? { ...t, ...updatedTask } : t
        ),
      }));
    } catch (error) {
      console.error('Error toggling task completion:', error);
      throw error;
    }
  },
})); 