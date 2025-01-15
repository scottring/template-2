import { create } from 'zustand';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where,
  onSnapshot,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { Household, HouseholdMember, InviteCode } from '@/types/models';

interface HouseholdStore {
  household: Household | null;
  members: HouseholdMember[];
  inviteCodes: InviteCode[];
  isLoading: boolean;
  error: string | null;
  
  // Household Management
  createHousehold: (name: string, userId: string) => Promise<string>;
  joinHousehold: (inviteCode: string, userId: string) => Promise<void>;
  updateHousehold: (updates: Partial<Household>) => Promise<void>;
  leaveHousehold: (userId: string) => Promise<void>;
  
  // Member Management
  updateMember: (userId: string, updates: Partial<HouseholdMember>) => Promise<void>;
  removeMember: (userId: string) => Promise<void>;
  
  // Invite Management
  createInviteCode: () => Promise<string>;
  invalidateInviteCode: (code: string) => Promise<void>;
  
  // Loading
  loadHousehold: (householdId: string) => Promise<void>;
  subscribeToHousehold: (householdId: string) => () => void;
}

export const useHouseholdStore = create<HouseholdStore>((set, get) => ({
  household: null,
  members: [],
  inviteCodes: [],
  isLoading: false,
  error: null,

  createHousehold: async (name: string, userId: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const householdRef = doc(collection(db, 'households'));
      const newHousehold: Household = {
        id: householdRef.id,
        name,
        members: [{
          userId,
          role: 'admin',
          displayName: '', // Will be updated from user profile
          joinedAt: new Date(),
          preferences: {
            notifications: {
              taskReminders: true,
              planningReminders: true,
              inventoryAlerts: true,
              taskAssignments: true,
              reminderHoursBefore: 24
            },
            defaultView: 'week',
            colorScheme: 'blue'
          },
          defaultAssignments: []
        }],
        inviteCodes: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: userId,
        updatedBy: userId
      };

      await setDoc(householdRef, newHousehold);
      set({ household: newHousehold, members: newHousehold.members });
      
      return householdRef.id;
    } catch (error) {
      set({ error: 'Failed to create household' });
      console.error('Error creating household:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  joinHousehold: async (code: string, userId: string) => {
    try {
      set({ isLoading: true, error: null });
      
      // Find household with this invite code
      const householdsRef = collection(db, 'households');
      const q = query(householdsRef, where('inviteCodes.code', '==', code));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        throw new Error('Invalid invite code');
      }

      const householdDoc = querySnapshot.docs[0];
      const household = householdDoc.data() as Household;

      // Check if code is expired
      const foundInviteCode = household.inviteCodes.find(i => i.code === code);
      if (!foundInviteCode || new Date(foundInviteCode.expiresAt) < new Date()) {
        throw new Error('Invite code expired');
      }

      // Add member
      const newMember: HouseholdMember = {
        userId,
        role: 'member',
        displayName: '', // Will be updated from user profile
        joinedAt: new Date(),
        preferences: {
          notifications: {
            taskReminders: true,
            planningReminders: true,
            inventoryAlerts: true,
            taskAssignments: true,
            reminderHoursBefore: 24
          },
          defaultView: 'week',
          colorScheme: 'blue'
        },
        defaultAssignments: []
      };

      await updateDoc(householdDoc.ref, {
        members: [...household.members, newMember],
        'inviteCodes': household.inviteCodes.map(i => 
          i.code === code ? { ...i, usedBy: userId, usedAt: new Date() } : i
        ),
        updatedAt: new Date(),
        updatedBy: userId
      });

    } catch (error) {
      set({ error: 'Failed to join household' });
      console.error('Error joining household:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  updateHousehold: async (updates: Partial<Household>) => {
    const { household } = get();
    if (!household) return;

    try {
      set({ isLoading: true, error: null });
      
      const householdRef = doc(db, 'households', household.id);
      await updateDoc(householdRef, {
        ...updates,
        updatedAt: new Date(),
        updatedBy: household.members[0].userId // TODO: Get current user ID
      });

    } catch (error) {
      set({ error: 'Failed to update household' });
      console.error('Error updating household:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  leaveHousehold: async (userId: string) => {
    const { household } = get();
    if (!household) return;

    try {
      set({ isLoading: true, error: null });
      
      const householdRef = doc(db, 'households', household.id);
      await updateDoc(householdRef, {
        members: household.members.filter(m => m.userId !== userId),
        updatedAt: new Date(),
        updatedBy: userId
      });

    } catch (error) {
      set({ error: 'Failed to leave household' });
      console.error('Error leaving household:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  updateMember: async (userId: string, updates: Partial<HouseholdMember>) => {
    const { household } = get();
    if (!household) return;

    try {
      set({ isLoading: true, error: null });
      
      const householdRef = doc(db, 'households', household.id);
      await updateDoc(householdRef, {
        members: household.members.map(m => 
          m.userId === userId ? { ...m, ...updates } : m
        ),
        updatedAt: new Date(),
        updatedBy: userId
      });

    } catch (error) {
      set({ error: 'Failed to update member' });
      console.error('Error updating member:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  removeMember: async (userId: string) => {
    const { household } = get();
    if (!household) return;

    try {
      set({ isLoading: true, error: null });
      
      const householdRef = doc(db, 'households', household.id);
      await updateDoc(householdRef, {
        members: household.members.filter(m => m.userId !== userId),
        updatedAt: new Date(),
        updatedBy: household.members[0].userId // TODO: Get current user ID
      });

    } catch (error) {
      set({ error: 'Failed to remove member' });
      console.error('Error removing member:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  createInviteCode: async () => {
    const { household } = get();
    if (!household) throw new Error('No household selected');

    try {
      set({ isLoading: true, error: null });
      
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const newInviteCode: InviteCode = {
        code,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      };

      const householdRef = doc(db, 'households', household.id);
      await updateDoc(householdRef, {
        inviteCodes: [...household.inviteCodes, newInviteCode],
        updatedAt: new Date(),
        updatedBy: household.members[0].userId // TODO: Get current user ID
      });

      return code;
    } catch (error) {
      set({ error: 'Failed to create invite code' });
      console.error('Error creating invite code:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  invalidateInviteCode: async (code: string) => {
    const { household } = get();
    if (!household) return;

    try {
      set({ isLoading: true, error: null });
      
      const householdRef = doc(db, 'households', household.id);
      await updateDoc(householdRef, {
        inviteCodes: household.inviteCodes.filter(i => i.code !== code),
        updatedAt: new Date(),
        updatedBy: household.members[0].userId // TODO: Get current user ID
      });

    } catch (error) {
      set({ error: 'Failed to invalidate invite code' });
      console.error('Error invalidating invite code:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  loadHousehold: async (householdId: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const householdRef = doc(db, 'households', householdId);
      const householdDoc = await getDoc(householdRef);
      
      if (!householdDoc.exists()) {
        throw new Error('Household not found');
      }

      const household = householdDoc.data() as Household;
      set({ 
        household,
        members: household.members,
        inviteCodes: household.inviteCodes
      });

    } catch (error) {
      set({ error: 'Failed to load household' });
      console.error('Error loading household:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  subscribeToHousehold: (householdId: string) => {
    const unsubscribe = onSnapshot(
      doc(db, 'households', householdId),
      (doc) => {
        if (doc.exists()) {
          const household = doc.data() as Household;
          set({ 
            household,
            members: household.members,
            inviteCodes: household.inviteCodes
          });
        }
      },
      (error) => {
        set({ error: 'Failed to subscribe to household updates' });
        console.error('Error subscribing to household:', error);
      }
    );

    return unsubscribe;
  }
})); 