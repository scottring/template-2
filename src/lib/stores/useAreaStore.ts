import { create } from 'zustand';
import { Area } from '@/types/models';
import { collection, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/firebase';

interface AreaStore {
  areas: Area[];
  setAreas: (areas: Area[]) => void;
  addArea: (area: Omit<Area, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateArea: (areaId: string, updates: Partial<Area>) => Promise<void>;
  deleteArea: (areaId: string) => Promise<void>;
}

export const useAreaStore = create<AreaStore>((set) => ({
  areas: [],
  setAreas: (areas) => set({ areas }),
  addArea: async (areaData) => {
    try {
      const newArea: Omit<Area, 'id'> = {
        ...areaData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const docRef = await addDoc(collection(db, 'areas'), newArea);
      const area = { ...newArea, id: docRef.id } as Area;
      
      set((state) => ({ areas: [...state.areas, area] }));
    } catch (error) {
      console.error('Error adding area:', error);
      throw error;
    }
  },
  updateArea: async (areaId, updates) => {
    try {
      const areaRef = doc(db, 'areas', areaId);
      const updatedArea = { ...updates, updatedAt: new Date() };
      await updateDoc(areaRef, updatedArea);
      
      set((state) => ({
        areas: state.areas.map((area) =>
          area.id === areaId ? { ...area, ...updatedArea } : area
        ),
      }));
    } catch (error) {
      console.error('Error updating area:', error);
      throw error;
    }
  },
  deleteArea: async (areaId) => {
    try {
      await deleteDoc(doc(db, 'areas', areaId));
      set((state) => ({
        areas: state.areas.filter((area) => area.id !== areaId),
      }));
    } catch (error) {
      console.error('Error deleting area:', error);
      throw error;
    }
  },
})); 