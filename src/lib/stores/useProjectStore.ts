import { create } from 'zustand';
import { Project } from '@/types/models';
import { collection, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/firebase';

interface ProjectStore {
  projects: Project[];
  setProjects: (projects: Project[]) => void;
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateProject: (projectId: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
}

export const useProjectStore = create<ProjectStore>((set) => ({
  projects: [],
  setProjects: (projects) => set({ projects }),
  addProject: async (projectData) => {
    try {
      const newProject: Omit<Project, 'id'> = {
        ...projectData,
        progress: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const docRef = await addDoc(collection(db, 'projects'), newProject);
      const project = { ...newProject, id: docRef.id } as Project;
      
      set((state) => ({ projects: [...state.projects, project] }));
    } catch (error) {
      console.error('Error adding project:', error);
      throw error;
    }
  },
  updateProject: async (projectId, updates) => {
    try {
      const projectRef = doc(db, 'projects', projectId);
      const updatedProject = { ...updates, updatedAt: new Date() };
      await updateDoc(projectRef, updatedProject);
      
      set((state) => ({
        projects: state.projects.map((project) =>
          project.id === projectId ? { ...project, ...updatedProject } : project
        ),
      }));
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  },
  deleteProject: async (projectId) => {
    try {
      await deleteDoc(doc(db, 'projects', projectId));
      set((state) => ({
        projects: state.projects.filter((project) => project.id !== projectId),
      }));
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  },
})); 