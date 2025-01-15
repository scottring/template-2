import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase/firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot,
  orderBy,
  Timestamp,
  doc,
  getDoc,
  updateDoc,
  DocumentData
} from 'firebase/firestore';
import { Notification, HouseholdMember } from '@/types/models';
import { useAuth } from './useAuth';

export function useRealtime(householdId: string) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [onlineMembers, setOnlineMembers] = useState<HouseholdMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Listen for notifications
  useEffect(() => {
    if (!user?.uid) return;

    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('recipientId', '==', user.uid),
      where('read', '==', false),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      notificationsQuery,
      (snapshot) => {
        const newNotifications = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Notification[];
        setNotifications(newNotifications);
        setLoading(false);
      },
      (err) => {
        console.error('Error listening to notifications:', err);
        setError('Failed to load notifications');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  // Listen for member status updates
  useEffect(() => {
    if (!householdId) return;

    const householdRef = doc(db, 'households', householdId);
    
    const unsubscribe = onSnapshot(
      householdRef,
      (doc) => {
        if (doc.exists()) {
          const household = doc.data();
          const members = household.members || [];
          const activeMembers = members.filter((member: HouseholdMember) => {
            if (!member.activeStatus || member.activeStatus === 'offline' || !member.lastActive) return false;
            const lastActive = member.lastActive as unknown as Timestamp;
            return Date.now() - lastActive.toMillis() < 300000; // 5 minutes
          });
          setOnlineMembers(activeMembers);
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error listening to member status:', err);
        setError('Failed to load member status');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [householdId]);

  // Auto-update member status
  useEffect(() => {
    if (!user?.uid || !householdId) return;

    let lastActivity = Date.now();
    let status: 'online' | 'away' | 'busy' | 'offline' = 'online';

    const updateStatus = async () => {
      const currentTime = Date.now();
      const inactiveTime = currentTime - lastActivity;

      let newStatus = status;
      if (inactiveTime > 30 * 60 * 1000) { // 30 minutes
        newStatus = 'offline';
      } else if (inactiveTime > 5 * 60 * 1000) { // 5 minutes
        newStatus = 'away';
      }

      if (newStatus !== status) {
        status = newStatus;
        const householdRef = doc(db, 'households', householdId);
        try {
          const docSnap = await getDoc(householdRef);
          if (docSnap.exists()) {
            const household = docSnap.data();
            const updatedMembers = household.members.map((member: HouseholdMember) =>
              member.userId === user.uid
                ? { ...member, activeStatus: status, lastActive: Timestamp.now() }
                : member
            );
            await updateDoc(householdRef, { members: updatedMembers });
          }
        } catch (err) {
          console.error('Error updating status:', err);
        }
      }
    };

    const activityEvents = ['mousedown', 'keydown', 'mousemove', 'wheel'];
    const handleActivity = () => {
      lastActivity = Date.now();
      if (status !== 'online') {
        status = 'online';
        updateStatus();
      }
    };

    activityEvents.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    const statusInterval = setInterval(updateStatus, 60 * 1000); // Check every minute

    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      clearInterval(statusInterval);
    };
  }, [user?.uid, householdId]);

  return {
    notifications,
    onlineMembers,
    loading,
    error
  };
} 