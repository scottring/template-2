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
import { MealPlan, Meal, GroceryItem } from '@/types/models';
import { startOfWeek as dateStartOfWeek, endOfWeek as dateEndOfWeek } from 'date-fns';

interface MealPlanStore {
  mealPlans: MealPlan[];
  isLoading: boolean;
  error: string | null;
  
  // Meal Plan Management
  createMealPlan: (mealPlan: Omit<MealPlan, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>) => Promise<string>;
  updateMealPlan: (mealPlanId: string, updates: Partial<MealPlan>) => Promise<void>;
  deleteMealPlan: (mealPlanId: string) => Promise<void>;
  
  // Meal Management
  addMeal: (mealPlanId: string, meal: Meal) => Promise<void>;
  updateMeal: (mealPlanId: string, mealIndex: number, updates: Partial<Meal>) => Promise<void>;
  removeMeal: (mealPlanId: string, mealIndex: number) => Promise<void>;
  
  // Grocery List Management
  addGroceryItem: (mealPlanId: string, item: Omit<GroceryItem, 'id'>) => Promise<void>;
  updateGroceryItem: (mealPlanId: string, itemId: string, updates: Partial<GroceryItem>) => Promise<void>;
  removeGroceryItem: (mealPlanId: string, itemId: string) => Promise<void>;
  markGroceryItemPurchased: (mealPlanId: string, itemId: string, userId: string) => Promise<void>;
  
  // Queries
  getCurrentWeekMealPlan: () => MealPlan | undefined;
  getMealPlanByDate: (date: Date) => MealPlan | undefined;
  getGroceryList: (mealPlanId: string) => GroceryItem[];
  getUnpurchasedGroceryItems: (mealPlanId: string) => GroceryItem[];
  
  // Loading
  loadMealPlans: (householdId: string) => Promise<void>;
  subscribeToMealPlans: (householdId: string) => () => void;
}

export const useMealPlanStore = create<MealPlanStore>((set, get) => ({
  mealPlans: [],
  isLoading: false,
  error: null,

  createMealPlan: async (mealPlan) => {
    try {
      set({ isLoading: true, error: null });
      
      const mealPlanRef = doc(collection(db, 'mealPlans'));
      const newMealPlan: MealPlan = {
        ...mealPlan,
        id: mealPlanRef.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'TODO', // TODO: Get current user ID
        updatedBy: 'TODO', // TODO: Get current user ID
      };

      await setDoc(mealPlanRef, newMealPlan);
      set(state => ({ mealPlans: [...state.mealPlans, newMealPlan] }));
      
      return mealPlanRef.id;
    } catch (error) {
      set({ error: 'Failed to create meal plan' });
      console.error('Error creating meal plan:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  updateMealPlan: async (mealPlanId, updates) => {
    try {
      set({ isLoading: true, error: null });
      
      const mealPlanRef = doc(db, 'mealPlans', mealPlanId);
      await updateDoc(mealPlanRef, {
        ...updates,
        updatedAt: new Date(),
        updatedBy: 'TODO' // TODO: Get current user ID
      });

      set(state => ({
        mealPlans: state.mealPlans.map(mp => 
          mp.id === mealPlanId ? { ...mp, ...updates } : mp
        )
      }));

    } catch (error) {
      set({ error: 'Failed to update meal plan' });
      console.error('Error updating meal plan:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteMealPlan: async (mealPlanId) => {
    try {
      set({ isLoading: true, error: null });
      
      await deleteDoc(doc(db, 'mealPlans', mealPlanId));
      set(state => ({
        mealPlans: state.mealPlans.filter(mp => mp.id !== mealPlanId)
      }));

    } catch (error) {
      set({ error: 'Failed to delete meal plan' });
      console.error('Error deleting meal plan:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  addMeal: async (mealPlanId, meal) => {
    try {
      set({ isLoading: true, error: null });
      
      const mealPlan = get().mealPlans.find(mp => mp.id === mealPlanId);
      if (!mealPlan) throw new Error('Meal plan not found');

      const mealPlanRef = doc(db, 'mealPlans', mealPlanId);
      await updateDoc(mealPlanRef, {
        meals: [...mealPlan.meals, meal],
        updatedAt: new Date(),
        updatedBy: 'TODO' // TODO: Get current user ID
      });

      set(state => ({
        mealPlans: state.mealPlans.map(mp => 
          mp.id === mealPlanId 
            ? { ...mp, meals: [...mp.meals, meal] }
            : mp
        )
      }));

    } catch (error) {
      set({ error: 'Failed to add meal' });
      console.error('Error adding meal:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  updateMeal: async (mealPlanId, mealIndex, updates) => {
    try {
      set({ isLoading: true, error: null });
      
      const mealPlan = get().mealPlans.find(mp => mp.id === mealPlanId);
      if (!mealPlan) throw new Error('Meal plan not found');

      const updatedMeals = [...mealPlan.meals];
      updatedMeals[mealIndex] = { ...updatedMeals[mealIndex], ...updates };

      const mealPlanRef = doc(db, 'mealPlans', mealPlanId);
      await updateDoc(mealPlanRef, {
        meals: updatedMeals,
        updatedAt: new Date(),
        updatedBy: 'TODO' // TODO: Get current user ID
      });

      set(state => ({
        mealPlans: state.mealPlans.map(mp => 
          mp.id === mealPlanId 
            ? { ...mp, meals: updatedMeals }
            : mp
        )
      }));

    } catch (error) {
      set({ error: 'Failed to update meal' });
      console.error('Error updating meal:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  removeMeal: async (mealPlanId, mealIndex) => {
    try {
      set({ isLoading: true, error: null });
      
      const mealPlan = get().mealPlans.find(mp => mp.id === mealPlanId);
      if (!mealPlan) throw new Error('Meal plan not found');

      const updatedMeals = mealPlan.meals.filter((_, index) => index !== mealIndex);

      const mealPlanRef = doc(db, 'mealPlans', mealPlanId);
      await updateDoc(mealPlanRef, {
        meals: updatedMeals,
        updatedAt: new Date(),
        updatedBy: 'TODO' // TODO: Get current user ID
      });

      set(state => ({
        mealPlans: state.mealPlans.map(mp => 
          mp.id === mealPlanId 
            ? { ...mp, meals: updatedMeals }
            : mp
        )
      }));

    } catch (error) {
      set({ error: 'Failed to remove meal' });
      console.error('Error removing meal:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  addGroceryItem: async (mealPlanId, item) => {
    try {
      set({ isLoading: true, error: null });
      
      const mealPlan = get().mealPlans.find(mp => mp.id === mealPlanId);
      if (!mealPlan) throw new Error('Meal plan not found');

      const newItem: GroceryItem = {
        ...item,
        id: Math.random().toString(36).substring(2, 9), // Simple ID generation
      };

      const updatedGroceryList = [...(mealPlan.groceryList || []), newItem];

      const mealPlanRef = doc(db, 'mealPlans', mealPlanId);
      await updateDoc(mealPlanRef, {
        groceryList: updatedGroceryList,
        updatedAt: new Date(),
        updatedBy: 'TODO' // TODO: Get current user ID
      });

      set(state => ({
        mealPlans: state.mealPlans.map(mp => 
          mp.id === mealPlanId 
            ? { ...mp, groceryList: updatedGroceryList }
            : mp
        )
      }));

    } catch (error) {
      set({ error: 'Failed to add grocery item' });
      console.error('Error adding grocery item:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  updateGroceryItem: async (mealPlanId, itemId, updates) => {
    try {
      set({ isLoading: true, error: null });
      
      const mealPlan = get().mealPlans.find(mp => mp.id === mealPlanId);
      if (!mealPlan) throw new Error('Meal plan not found');

      const updatedGroceryList = mealPlan.groceryList?.map(item =>
        item.id === itemId ? { ...item, ...updates } : item
      ) || [];

      const mealPlanRef = doc(db, 'mealPlans', mealPlanId);
      await updateDoc(mealPlanRef, {
        groceryList: updatedGroceryList,
        updatedAt: new Date(),
        updatedBy: 'TODO' // TODO: Get current user ID
      });

      set(state => ({
        mealPlans: state.mealPlans.map(mp => 
          mp.id === mealPlanId 
            ? { ...mp, groceryList: updatedGroceryList }
            : mp
        )
      }));

    } catch (error) {
      set({ error: 'Failed to update grocery item' });
      console.error('Error updating grocery item:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  removeGroceryItem: async (mealPlanId, itemId) => {
    try {
      set({ isLoading: true, error: null });
      
      const mealPlan = get().mealPlans.find(mp => mp.id === mealPlanId);
      if (!mealPlan) throw new Error('Meal plan not found');

      const updatedGroceryList = mealPlan.groceryList?.filter(item => 
        item.id !== itemId
      ) || [];

      const mealPlanRef = doc(db, 'mealPlans', mealPlanId);
      await updateDoc(mealPlanRef, {
        groceryList: updatedGroceryList,
        updatedAt: new Date(),
        updatedBy: 'TODO' // TODO: Get current user ID
      });

      set(state => ({
        mealPlans: state.mealPlans.map(mp => 
          mp.id === mealPlanId 
            ? { ...mp, groceryList: updatedGroceryList }
            : mp
        )
      }));

    } catch (error) {
      set({ error: 'Failed to remove grocery item' });
      console.error('Error removing grocery item:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  markGroceryItemPurchased: async (mealPlanId, itemId, userId) => {
    try {
      set({ isLoading: true, error: null });
      
      const mealPlan = get().mealPlans.find(mp => mp.id === mealPlanId);
      if (!mealPlan) throw new Error('Meal plan not found');

      const updatedGroceryList = mealPlan.groceryList?.map(item =>
        item.id === itemId 
          ? { 
              ...item, 
              purchased: true,
              purchasedBy: userId,
              purchasedAt: new Date()
            } 
          : item
      ) || [];

      const mealPlanRef = doc(db, 'mealPlans', mealPlanId);
      await updateDoc(mealPlanRef, {
        groceryList: updatedGroceryList,
        updatedAt: new Date(),
        updatedBy: userId
      });

      set(state => ({
        mealPlans: state.mealPlans.map(mp => 
          mp.id === mealPlanId 
            ? { ...mp, groceryList: updatedGroceryList }
            : mp
        )
      }));

    } catch (error) {
      set({ error: 'Failed to mark grocery item as purchased' });
      console.error('Error marking grocery item as purchased:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  getCurrentWeekMealPlan: () => {
    const now = new Date();
    const start = dateStartOfWeek(now);
    const end = dateEndOfWeek(now);
    
    return get().mealPlans.find(mp => {
      const date = new Date(mp.date);
      return date >= start && date <= end;
    });
  },

  getMealPlanByDate: (date) => {
    return get().mealPlans.find(mp => {
      const mpDate = new Date(mp.date);
      return mpDate.toDateString() === date.toDateString();
    });
  },

  getGroceryList: (mealPlanId) => {
    const mealPlan = get().mealPlans.find(mp => mp.id === mealPlanId);
    return mealPlan?.groceryList || [];
  },

  getUnpurchasedGroceryItems: (mealPlanId) => {
    const mealPlan = get().mealPlans.find(mp => mp.id === mealPlanId);
    return mealPlan?.groceryList?.filter(item => !item.purchased) || [];
  },

  loadMealPlans: async (householdId) => {
    try {
      set({ isLoading: true, error: null });
      
      const mealPlansRef = collection(db, 'mealPlans');
      const q = query(
        mealPlansRef, 
        where('householdId', '==', householdId),
        orderBy('date', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const mealPlans = querySnapshot.docs.map(doc => doc.data() as MealPlan);
      
      set({ mealPlans });

    } catch (error) {
      set({ error: 'Failed to load meal plans' });
      console.error('Error loading meal plans:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  subscribeToMealPlans: (householdId) => {
    const q = query(
      collection(db, 'mealPlans'),
      where('householdId', '==', householdId),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const mealPlans = querySnapshot.docs.map(doc => doc.data() as MealPlan);
        set({ mealPlans });
      },
      (error) => {
        set({ error: 'Failed to subscribe to meal plans' });
        console.error('Error subscribing to meal plans:', error);
      }
    );

    return unsubscribe;
  }
})); 