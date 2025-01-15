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
  onSnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { Resource, ResourceHistory } from '@/types/models';

interface ResourceStore {
  resources: Resource[];
  isLoading: boolean;
  error: string | null;
  
  // Resource Management
  createResource: (resource: Omit<Resource, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'history'>) => Promise<string>;
  updateResource: (resourceId: string, updates: Partial<Resource>) => Promise<void>;
  deleteResource: (resourceId: string) => Promise<void>;
  
  // Value Management
  updateValue: (resourceId: string, newValue: number, notes?: string) => Promise<void>;
  adjustValue: (resourceId: string, adjustment: number, notes?: string) => Promise<void>;
  
  // Queries
  getResourcesByType: (type: Resource['type']) => Resource[];
  getResourcesByCategory: (category: string) => Resource[];
  getLowInventory: () => Resource[];
  getResourceHistory: (resourceId: string) => ResourceHistory[];
  
  // Loading
  loadResources: (householdId: string) => Promise<void>;
  subscribeToResources: (householdId: string) => () => void;
}

export const useResourceStore = create<ResourceStore>((set, get) => ({
  resources: [],
  isLoading: false,
  error: null,

  createResource: async (resource) => {
    try {
      set({ isLoading: true, error: null });
      
      const resourceRef = doc(collection(db, 'resources'));
      const newResource: Resource = {
        ...resource,
        id: resourceRef.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'TODO', // TODO: Get current user ID
        updatedBy: 'TODO', // TODO: Get current user ID
        history: []
      };

      await setDoc(resourceRef, newResource);
      set(state => ({ resources: [...state.resources, newResource] }));
      
      return resourceRef.id;
    } catch (error) {
      set({ error: 'Failed to create resource' });
      console.error('Error creating resource:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  updateResource: async (resourceId, updates) => {
    try {
      set({ isLoading: true, error: null });
      
      const resourceRef = doc(db, 'resources', resourceId);
      await updateDoc(resourceRef, {
        ...updates,
        updatedAt: new Date(),
        updatedBy: 'TODO' // TODO: Get current user ID
      });

      set(state => ({
        resources: state.resources.map(r => 
          r.id === resourceId ? { ...r, ...updates } : r
        )
      }));

    } catch (error) {
      set({ error: 'Failed to update resource' });
      console.error('Error updating resource:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteResource: async (resourceId) => {
    try {
      set({ isLoading: true, error: null });
      
      await deleteDoc(doc(db, 'resources', resourceId));
      set(state => ({
        resources: state.resources.filter(r => r.id !== resourceId)
      }));

    } catch (error) {
      set({ error: 'Failed to delete resource' });
      console.error('Error deleting resource:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  updateValue: async (resourceId, newValue, notes) => {
    try {
      set({ isLoading: true, error: null });
      
      const resource = get().resources.find(r => r.id === resourceId);
      if (!resource) throw new Error('Resource not found');

      const historyEntry: ResourceHistory = {
        id: Math.random().toString(36).substring(2, 9), // Simple ID generation
        previousValue: resource.value,
        newValue,
        date: new Date(),
        notes,
        updatedBy: 'TODO' // TODO: Get current user ID
      };

      const updatedHistory = [...resource.history, historyEntry];

      const resourceRef = doc(db, 'resources', resourceId);
      await updateDoc(resourceRef, {
        value: newValue,
        history: updatedHistory,
        updatedAt: new Date(),
        updatedBy: 'TODO' // TODO: Get current user ID
      });

      set(state => ({
        resources: state.resources.map(r => 
          r.id === resourceId 
            ? { ...r, value: newValue, history: updatedHistory }
            : r
        )
      }));

    } catch (error) {
      set({ error: 'Failed to update resource value' });
      console.error('Error updating resource value:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  adjustValue: async (resourceId, adjustment, notes) => {
    try {
      const resource = get().resources.find(r => r.id === resourceId);
      if (!resource) throw new Error('Resource not found');

      const newValue = resource.value + adjustment;
      await get().updateValue(resourceId, newValue, notes);

    } catch (error) {
      set({ error: 'Failed to adjust resource value' });
      console.error('Error adjusting resource value:', error);
      throw error;
    }
  },

  getResourcesByType: (type) => {
    return get().resources.filter(r => r.type === type);
  },

  getResourcesByCategory: (category) => {
    return get().resources.filter(r => r.category === category);
  },

  getLowInventory: () => {
    return get().resources.filter(r => 
      r.type === 'inventory' && 
      r.threshold !== undefined && 
      r.value <= r.threshold
    );
  },

  getResourceHistory: (resourceId) => {
    const resource = get().resources.find(r => r.id === resourceId);
    return resource?.history || [];
  },

  loadResources: async (householdId) => {
    try {
      set({ isLoading: true, error: null });
      
      const resourcesRef = collection(db, 'resources');
      const q = query(
        resourcesRef, 
        where('householdId', '==', householdId),
        orderBy('updatedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const resources = querySnapshot.docs.map(doc => doc.data() as Resource);
      
      set({ resources });

    } catch (error) {
      set({ error: 'Failed to load resources' });
      console.error('Error loading resources:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  subscribeToResources: (householdId) => {
    const q = query(
      collection(db, 'resources'),
      where('householdId', '==', householdId),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const resources = querySnapshot.docs.map(doc => doc.data() as Resource);
        set({ resources });
      },
      (error) => {
        set({ error: 'Failed to subscribe to resources' });
        console.error('Error subscribing to resources:', error);
      }
    );

    return unsubscribe;
  }
})); 