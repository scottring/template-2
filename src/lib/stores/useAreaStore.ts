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
  serverTimestamp
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
  migrateAreas: (householdId: string) => Promise<void>;
  
  // Area organization
  getSubAreas: (parentId: string) => Area[];
  getRootAreas: () => Area[];
}

const useAreaStore = create<AreaStore>((set, get) => ({
  areas: [],
  loading: false,
  error: null,

  migrateAreas: async (householdId: string) => {
    set({ loading: true, error: null });
    try {
      console.log('Starting area migration to household:', householdId);
      const areasRef = collection(db, 'areas');
      const allAreasQuery = query(areasRef);
      const snapshot = await getDocs(allAreasQuery);
      
      console.log(`Found ${snapshot.size} areas to migrate`);
      
      // First, migrate all areas to the new household
      for (const doc of snapshot.docs) {
        const data = doc.data();
        if (data.householdId !== householdId) {
          console.log(`Updating area ${doc.id} (${data.name}) with new householdId`);
          await updateDoc(doc.ref, {
            householdId,
            updatedAt: serverTimestamp()
          });
        }
      }

      // Then, update all goals to point to these areas
      const goalsRef = collection(db, 'goals');
      const goalsSnapshot = await getDocs(query(goalsRef, where('householdId', '==', householdId)));
      
      for (const goalDoc of goalsSnapshot.docs) {
        const data = goalDoc.data();
        if (data.areaId) {
          // Verify the area exists
          const areaDocRef = doc(db, 'areas', data.areaId);
          const areaDoc = await getDoc(areaDocRef);
          if (!areaDoc.exists()) {
            console.log(`Goal ${goalDoc.id} references non-existent area ${data.areaId}, removing reference`);
            await updateDoc(goalDoc.ref, {
              areaId: null,
              updatedAt: serverTimestamp()
            });
          }
        }
      }
      
      console.log('Migration complete, fetching updated areas');
      await get().fetchAreas(householdId);
    } catch (error) {
      console.error('Error migrating areas:', error);
      set({ error: 'Failed to migrate areas', loading: false });
    }
  },

  fetchAreas: async (householdId: string) => {
    set({ loading: true, error: null });
    try {
      console.log('Fetching areas for household:', householdId);
      const areasRef = collection(db, 'areas');
      
      // First, let's see all areas regardless of householdId
      const allAreasQuery = query(areasRef);
      const allAreasSnapshot = await getDocs(allAreasQuery);
      console.log('All areas in Firestore:', allAreasSnapshot.docs.map(doc => ({
        id: doc.id,
        householdId: doc.data().householdId,
        name: doc.data().name
      })));
      
      // Now query with the householdId filter
      const q = query(
        areasRef,
        where('householdId', '==', householdId),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      console.log('Areas matching current householdId:', snapshot.docs.map(doc => ({
        id: doc.id,
        householdId: doc.data().householdId,
        name: doc.data().name
      })));
      
      const areas = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate()
        } as Area;
      });
      
      console.log('Setting areas in store:', areas);
      set({ areas, loading: false });
    } catch (error) {
      console.error('Error fetching areas:', error);
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
        // Find goals associated with this area
        const goalsRef = collection(db, 'goals');
        const q = query(goalsRef, where('areaId', '==', areaId));
        const goalsSnapshot = await getDocs(q);
        
        // Delete each goal
        for (const goalDoc of goalsSnapshot.docs) {
          await deleteDoc(goalDoc.ref);
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