"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, addDoc } from 'firebase/firestore';

interface User extends FirebaseUser {
  householdId?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  signInWithGoogle: async () => {},
  signOut: async () => {}
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // Fetch user's household ID from Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          const householdId = userDoc.data()?.householdId;
          
          const userWithHousehold = {
            ...firebaseUser,
            householdId
          } as User;
          setUser(userWithHousehold);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error in auth state change:', error);
        setError(error instanceof Error ? error.message : 'An error occurred');
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      setError(null);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Create or update user document in Firestore
      const userRef = doc(db, 'users', result.user.uid);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        // Create a new household
        const householdRef = await addDoc(collection(db, 'households'), {
          name: `${result.user.displayName}'s Household`,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: result.user.uid,
          updatedBy: result.user.uid,
          members: [{
            userId: result.user.uid,
            role: 'admin',
            displayName: result.user.displayName || '',
            photoURL: result.user.photoURL || '',
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
            }
          }],
          inviteCodes: []
        });

        // Create user document with household reference
        await setDoc(userRef, {
          email: result.user.email,
          displayName: result.user.displayName,
          photoURL: result.user.photoURL,
          createdAt: new Date(),
          updatedAt: new Date(),
          householdId: householdRef.id
        });

        // Update user state with household ID
        const userWithHousehold = {
          ...result.user,
          householdId: householdRef.id
        } as User;
        setUser(userWithHousehold);
      } else {
        // User exists, update the user state with existing household ID
        const userData = userDoc.data();
        const userWithHousehold = {
          ...result.user,
          householdId: userData?.householdId
        } as User;
        setUser(userWithHousehold);
      }
    } catch (error) {
      console.error('Error signing in:', error);
      setError(error instanceof Error ? error.message : 'Failed to sign in with Google');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      setError(null);
      await firebaseSignOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
      setError(error instanceof Error ? error.message : 'Failed to sign out');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
