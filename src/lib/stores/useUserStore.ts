'use client';

import { create } from 'zustand';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  familyId?: string;
  sharedWith: string[];
}

interface UserStore {
  currentUserProfile: UserProfile | null;
  familyMembers: UserProfile[];
  users: UserProfile[];
  setCurrentUserProfile: (profile: UserProfile | null) => void;
  setFamilyMembers: (members: UserProfile[]) => void;
  setUsers: (users: UserProfile[]) => void;
  fetchUserProfile: (userId: string) => Promise<void>;
  fetchFamilyMembers: (familyId: string) => Promise<void>;
  fetchUsers: () => Promise<void>;
  inviteUserToFamily: (email: string) => Promise<void>;
  removeUserFromFamily: (userId: string) => Promise<void>;
  shareItemWithUser: (userId: string, itemType: string, itemId: string) => Promise<void>;
  unshareItemWithUser: (userId: string, itemType: string, itemId: string) => Promise<void>;
}

export const useUserStore = create<UserStore>((set, get) => ({
  currentUserProfile: null,
  familyMembers: [],
  users: [],

  setCurrentUserProfile: (profile) => set({ currentUserProfile: profile }),
  setFamilyMembers: (members) => set({ familyMembers: members }),
  setUsers: (users) => set({ users }),

  fetchUsers: async () => {
    try {
      const q = query(collection(db, 'users'));
      const querySnapshot = await getDocs(q);
      const users = querySnapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as UserProfile)
      );
      set({ users });
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  },

  fetchUserProfile: async (userId: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const profile = { id: userDoc.id, ...userDoc.data() } as UserProfile;
        set({ currentUserProfile: profile });

        // If user has a family, fetch family members
        if (profile.familyId) {
          get().fetchFamilyMembers(profile.familyId);
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  },

  fetchFamilyMembers: async (familyId: string) => {
    try {
      const q = query(collection(db, 'users'), where('familyId', '==', familyId));
      const querySnapshot = await getDocs(q);
      const members = querySnapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as UserProfile)
      );
      set({ familyMembers: members });
    } catch (error) {
      console.error('Error fetching family members:', error);
    }
  },

  inviteUserToFamily: async (email: string) => {
    try {
      const { currentUserProfile } = get();
      if (!currentUserProfile?.familyId) return;

      // Find user by email
      const q = query(collection(db, 'users'), where('email', '==', email));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        await updateDoc(doc(db, 'users', userDoc.id), {
          familyId: currentUserProfile.familyId,
          sharedWith: arrayUnion(currentUserProfile.id),
        });

        // Update current user's sharedWith array
        await updateDoc(doc(db, 'users', currentUserProfile.id), {
          sharedWith: arrayUnion(userDoc.id),
        });

        // Refresh family members
        await get().fetchFamilyMembers(currentUserProfile.familyId);
      }
    } catch (error) {
      console.error('Error inviting user to family:', error);
    }
  },

  removeUserFromFamily: async (userId: string) => {
    try {
      const { currentUserProfile } = get();
      if (!currentUserProfile?.familyId) return;

      await updateDoc(doc(db, 'users', userId), {
        familyId: null,
        sharedWith: arrayRemove(currentUserProfile.id),
      });

      await updateDoc(doc(db, 'users', currentUserProfile.id), {
        sharedWith: arrayRemove(userId),
      });

      // Refresh family members
      await get().fetchFamilyMembers(currentUserProfile.familyId);
    } catch (error) {
      console.error('Error removing user from family:', error);
    }
  },

  shareItemWithUser: async (userId: string, itemType: string, itemId: string) => {
    try {
      const { currentUserProfile } = get();
      if (!currentUserProfile) return;

      // Update the shared item's permissions
      await updateDoc(doc(db, itemType, itemId), {
        sharedWith: arrayUnion(userId),
      });

      // Add to user's shared items
      await updateDoc(doc(db, 'users', userId), {
        [`shared${itemType}`]: arrayUnion(itemId),
      });
    } catch (error) {
      console.error('Error sharing item:', error);
    }
  },

  unshareItemWithUser: async (userId: string, itemType: string, itemId: string) => {
    try {
      const { currentUserProfile } = get();
      if (!currentUserProfile) return;

      // Remove user from item's permissions
      await updateDoc(doc(db, itemType, itemId), {
        sharedWith: arrayRemove(userId),
      });

      // Remove from user's shared items
      await updateDoc(doc(db, 'users', userId), {
        [`shared${itemType}`]: arrayRemove(itemId),
      });
    } catch (error) {
      console.error('Error unsharing item:', error);
    }
  },
}));
