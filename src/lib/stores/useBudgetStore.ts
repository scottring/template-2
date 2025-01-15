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
import { Budget, Transaction } from '@/types/models';
import { startOfMonth, endOfMonth } from 'date-fns';

interface BudgetStore {
  budgets: Budget[];
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  
  // Budget Management
  createBudget: (budget: Omit<Budget, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>) => Promise<string>;
  updateBudget: (budgetId: string, updates: Partial<Budget>) => Promise<void>;
  deleteBudget: (budgetId: string) => Promise<void>;
  
  // Transaction Management
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>) => Promise<string>;
  updateTransaction: (transactionId: string, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (transactionId: string) => Promise<void>;
  
  // Queries
  getCurrentMonthBudget: () => Budget | undefined;
  getBudgetByMonth: (date: Date) => Budget | undefined;
  getTransactionsByBudget: (budgetId: string) => Transaction[];
  getTransactionsByCategory: (budgetId: string, category: string) => Transaction[];
  getTransactionsByDateRange: (startDate: Date, endDate: Date) => Transaction[];
  
  // Loading
  loadBudgets: (householdId: string) => Promise<void>;
  loadTransactions: (householdId: string) => Promise<void>;
  subscribeToBudgets: (householdId: string) => () => void;
  subscribeToTransactions: (householdId: string) => () => void;
}

export const useBudgetStore = create<BudgetStore>((set, get) => ({
  budgets: [],
  transactions: [],
  isLoading: false,
  error: null,

  createBudget: async (budget) => {
    try {
      set({ isLoading: true, error: null });
      
      const budgetRef = doc(collection(db, 'budgets'));
      const newBudget: Budget = {
        ...budget,
        id: budgetRef.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'TODO', // TODO: Get current user ID
        updatedBy: 'TODO', // TODO: Get current user ID
      };

      await setDoc(budgetRef, newBudget);
      set(state => ({ budgets: [...state.budgets, newBudget] }));
      
      return budgetRef.id;
    } catch (error) {
      set({ error: 'Failed to create budget' });
      console.error('Error creating budget:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  updateBudget: async (budgetId, updates) => {
    try {
      set({ isLoading: true, error: null });
      
      const budgetRef = doc(db, 'budgets', budgetId);
      await updateDoc(budgetRef, {
        ...updates,
        updatedAt: new Date(),
        updatedBy: 'TODO' // TODO: Get current user ID
      });

      set(state => ({
        budgets: state.budgets.map(b => 
          b.id === budgetId ? { ...b, ...updates } : b
        )
      }));

    } catch (error) {
      set({ error: 'Failed to update budget' });
      console.error('Error updating budget:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteBudget: async (budgetId) => {
    try {
      set({ isLoading: true, error: null });
      
      await deleteDoc(doc(db, 'budgets', budgetId));
      set(state => ({
        budgets: state.budgets.filter(b => b.id !== budgetId)
      }));

    } catch (error) {
      set({ error: 'Failed to delete budget' });
      console.error('Error deleting budget:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  addTransaction: async (transaction) => {
    try {
      set({ isLoading: true, error: null });
      
      const transactionRef = doc(collection(db, 'transactions'));
      const newTransaction: Transaction = {
        ...transaction,
        id: transactionRef.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'TODO', // TODO: Get current user ID
        updatedBy: 'TODO', // TODO: Get current user ID
      };

      await setDoc(transactionRef, newTransaction);
      set(state => ({ transactions: [...state.transactions, newTransaction] }));
      
      return transactionRef.id;
    } catch (error) {
      set({ error: 'Failed to add transaction' });
      console.error('Error adding transaction:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  updateTransaction: async (transactionId, updates) => {
    try {
      set({ isLoading: true, error: null });
      
      const transactionRef = doc(db, 'transactions', transactionId);
      await updateDoc(transactionRef, {
        ...updates,
        updatedAt: new Date(),
        updatedBy: 'TODO' // TODO: Get current user ID
      });

      set(state => ({
        transactions: state.transactions.map(t => 
          t.id === transactionId ? { ...t, ...updates } : t
        )
      }));

    } catch (error) {
      set({ error: 'Failed to update transaction' });
      console.error('Error updating transaction:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteTransaction: async (transactionId) => {
    try {
      set({ isLoading: true, error: null });
      
      await deleteDoc(doc(db, 'transactions', transactionId));
      set(state => ({
        transactions: state.transactions.filter(t => t.id !== transactionId)
      }));

    } catch (error) {
      set({ error: 'Failed to delete transaction' });
      console.error('Error deleting transaction:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  getCurrentMonthBudget: () => {
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);
    
    return get().budgets.find(b => {
      const date = new Date(b.date);
      return date >= start && date <= end;
    });
  },

  getBudgetByMonth: (date) => {
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    
    return get().budgets.find(b => {
      const budgetDate = new Date(b.date);
      return budgetDate >= start && budgetDate <= end;
    });
  },

  getTransactionsByBudget: (budgetId) => {
    return get().transactions.filter(t => t.budgetId === budgetId);
  },

  getTransactionsByCategory: (budgetId, category) => {
    return get().transactions.filter(t => 
      t.budgetId === budgetId && t.category === category
    );
  },

  getTransactionsByDateRange: (startDate, endDate) => {
    return get().transactions.filter(t => {
      const date = new Date(t.date);
      return date >= startDate && date <= endDate;
    });
  },

  loadBudgets: async (householdId) => {
    try {
      set({ isLoading: true, error: null });
      
      const budgetsRef = collection(db, 'budgets');
      const q = query(
        budgetsRef, 
        where('householdId', '==', householdId),
        orderBy('date', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const budgets = querySnapshot.docs.map(doc => doc.data() as Budget);
      
      set({ budgets });

    } catch (error) {
      set({ error: 'Failed to load budgets' });
      console.error('Error loading budgets:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  loadTransactions: async (householdId) => {
    try {
      set({ isLoading: true, error: null });
      
      const transactionsRef = collection(db, 'transactions');
      const q = query(
        transactionsRef, 
        where('householdId', '==', householdId),
        orderBy('date', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const transactions = querySnapshot.docs.map(doc => doc.data() as Transaction);
      
      set({ transactions });

    } catch (error) {
      set({ error: 'Failed to load transactions' });
      console.error('Error loading transactions:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  subscribeToBudgets: (householdId) => {
    const q = query(
      collection(db, 'budgets'),
      where('householdId', '==', householdId),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const budgets = querySnapshot.docs.map(doc => doc.data() as Budget);
        set({ budgets });
      },
      (error) => {
        set({ error: 'Failed to subscribe to budgets' });
        console.error('Error subscribing to budgets:', error);
      }
    );

    return unsubscribe;
  },

  subscribeToTransactions: (householdId) => {
    const q = query(
      collection(db, 'transactions'),
      where('householdId', '==', householdId),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const transactions = querySnapshot.docs.map(doc => doc.data() as Transaction);
        set({ transactions });
      },
      (error) => {
        set({ error: 'Failed to subscribe to transactions' });
        console.error('Error subscribing to transactions:', error);
      }
    );

    return unsubscribe;
  }
})); 