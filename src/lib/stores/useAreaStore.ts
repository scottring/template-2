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
  orderBy
} from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { Area, Goal } from '@/types/models';
import useGoalStore from '@/lib/stores/useGoalStore';

interface AreaStore {
  areas: Area[];
  loading: boolean;
  error: string | null;
  
  // Core area operations
  fetchAreas: (householdId: string) => Promise<void>;
  addArea: (area: Partial<Area>) => Promise<void>;
  updateArea: (areaId: string, updates: Partial<Area>) => Promise<void>;
  deleteArea: (areaId: string) => Promise<void>;
  
  // Area organization
  getSubAreas: (parentId: string) => Area[];
  getRootAreas: () => Area[];
}

const useAreaStore = create<AreaStore>((set, get) => ({
  areas: [],
  loading: false,
  error: null,

  fetchAreas: async (householdId: string) => {
    set({ loading: true, error: null });
    try {
      const q = query(
        collection(db, 'areas'),
        where('householdId', '==', householdId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const areas = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Area));
      set({ areas, loading: false });
    } catch (error) {
      set({ error: 'Failed to fetch areas', loading: false });
    }
  },

  addArea: async (area: Partial<Area>) => {
    set({ loading: true, error: null });
    try {
      const docRef = await addDoc(collection(db, 'areas'), {
        ...area,
        goals: [],
        createdAt: new Date(),
        updatedAt: new Date()
      });
      const newArea = { ...area, id: docRef.id } as Area;
      set(state => ({ areas: [newArea, ...state.areas], loading: false }));
    } catch (error) {
      set({ error: 'Failed to add area', loading: false });
    }
  },

  updateArea: async (areaId: string, updates: Partial<Area>) => {
    set({ loading: true, error: null });
    try {
      await updateDoc(doc(db, 'areas', areaId), {
        ...updates,
        updatedAt: new Date()
      });
      set(state => ({
        areas: state.areas.map(area => 
          area.id === areaId ? { ...area, ...updates } : area
        ),
        loading: false
      }));
    } catch (error) {
      set({ error: 'Failed to update area', loading: false });
    }
  },

  deleteArea: async (areaId: string) => {
    try {
      set({ loading: true, error: null });
      
      // Get the area to check for goals
      const area = get().areas.find(a => a.id === areaId);
      
      if (area) {
        // Delete all goals associated with this area
        const goalStore = useGoalStore.getState();
        const goals = goalStore.goals.filter((g: Goal) => g.areaId === areaId);
        
        // Delete each goal (which will trigger task cleanup in the goal store)
        for (const goal of goals) {
          await goalStore.deleteGoal(goal.id);
        }
        
        // Delete the area from Firebase
        await deleteDoc(doc(db, 'areas', areaId));
        
        // Update local state
        set(state => ({
          areas: state.areas.filter(area => area.id !== areaId),
          loading: false
        }));
      }
    } catch (error) {
      set({ error: 'Failed to delete area', loading: false });
      console.error('Error deleting area:', error);
      throw error;
    }
  },

  getSubAreas: (parentId: string) => {
    return get().areas.filter(area => area.parentId === parentId);
  },

  getRootAreas: () => {
    return get().areas.filter(area => !area.parentId);
  }
}));

export default useAreaStore; 