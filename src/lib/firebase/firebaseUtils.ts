import { auth, db, storage } from "./firebase";
import {
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
  query,
  where,
  orderBy,
  arrayUnion,
  Timestamp
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { MemberAvailability, Task, Household } from '@/types/models';

// Auth functions
export const logoutUser = () => signOut(auth);

export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

// Firestore functions
export const addDocument = (collectionName: string, data: any) =>
  addDoc(collection(db, collectionName), data);

export const getDocuments = async (collectionName: string) => {
  const querySnapshot = await getDocs(collection(db, collectionName));
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

export const updateDocument = (collectionName: string, id: string, data: any) =>
  updateDoc(doc(db, collectionName, id), data);

export const deleteDocument = (collectionName: string, id: string) =>
  deleteDoc(doc(db, collectionName, id));

// Storage functions
export const uploadFile = async (file: File, path: string) => {
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
};

// Task Coordination Functions
export const updateTaskAssignment = async (taskId: string, assignedTo: string[]) => {
  return updateDocument('tasks', taskId, { assignedTo });
};

export const requestTaskHandoff = async (taskId: string, fromUserId: string, toUserId: string, reason?: string) => {
  const handoff = {
    fromUserId,
    toUserId,
    timestamp: Timestamp.now(),
    status: 'pending',
    reason,
  };
  
  await updateDocument('tasks', taskId, {
    handoffHistory: arrayUnion(handoff)
  });

  // Create notification for recipient
  await addDocument('notifications', {
    recipientId: toUserId,
    type: 'handoff_requested',
    title: 'Task Handoff Request',
    message: `A task has been requested to be handed off to you`,
    read: false,
    actionRequired: true,
    actionType: 'accept_handoff',
    relatedItemId: taskId,
    relatedItemType: 'task',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
};

export const respondToHandoff = async (
  taskId: string, 
  handoffId: string, 
  response: 'accepted' | 'rejected',
  notes?: string
) => {
  // Update handoff status
  const taskRef = doc(db, 'tasks', taskId);
  const taskDoc = await getDoc(taskRef);
  const task = taskDoc.data() as Task;
  
  if (!task) {
    throw new Error('Task not found');
  }

  const updatedHandoffHistory = task.handoffHistory?.map((h) => 
    h.id === handoffId ? { ...h, status: response, notes } : h
  ) || [];

  await updateDoc(taskRef, { handoffHistory: updatedHandoffHistory });

  const handoff = task.handoffHistory?.find((h) => h.id === handoffId);
  if (!handoff) {
    throw new Error('Handoff not found');
  }

  // Create notification for original assignee
  await addDocument('notifications', {
    recipientId: handoff.fromUserId,
    type: response === 'accepted' ? 'handoff_accepted' : 'handoff_rejected',
    title: `Task Handoff ${response.charAt(0).toUpperCase() + response.slice(1)}`,
    message: `Your task handoff request was ${response}`,
    read: false,
    actionRequired: false,
    relatedItemId: taskId,
    relatedItemType: 'task',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
};

// Member Availability Functions
export const updateMemberAvailability = async (
  householdId: string,
  memberId: string,
  availability: MemberAvailability[]
) => {
  const householdRef = doc(db, 'households', householdId);
  const householdDoc = await getDoc(householdRef);
  const household = householdDoc.data() as Household;

  if (!household) {
    throw new Error('Household not found');
  }

  const updatedMembers = household.members.map((member) =>
    member.userId === memberId ? { ...member, availability } : member
  );

  await updateDoc(householdRef, { members: updatedMembers });
};

export const updateMemberStatus = async (
  householdId: string,
  memberId: string,
  status: 'online' | 'away' | 'busy' | 'offline'
) => {
  const householdRef = doc(db, 'households', householdId);
  const householdDoc = await getDoc(householdRef);
  const household = householdDoc.data() as Household;

  if (!household) {
    throw new Error('Household not found');
  }

  const updatedMembers = household.members.map((member) =>
    member.userId === memberId ? { 
      ...member, 
      activeStatus: status,
      lastActive: Timestamp.now()
    } : member
  );

  await updateDoc(householdRef, { members: updatedMembers });
};

// Notification Functions
export const getUnreadNotifications = async (userId: string) => {
  const q = query(
    collection(db, 'notifications'),
    where('recipientId', '==', userId),
    where('read', '==', false),
    orderBy('createdAt', 'desc')
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

export const markNotificationRead = async (notificationId: string) => {
  await updateDocument('notifications', notificationId, {
    read: true,
    readAt: new Date()
  });
};

// Task Dependency Functions
export const addTaskDependency = async (
  taskId: string,
  dependentTaskId: string,
  type: 'blocks' | 'requires' | 'suggested',
  notes?: string
) => {
  const dependency = { dependentTaskId, type, notes };
  await updateDocument('tasks', taskId, {
    dependencies: arrayUnion(dependency)
  });
};

export const removeTaskDependency = async (
  taskId: string,
  dependentTaskId: string
) => {
  const taskRef = doc(db, 'tasks', taskId);
  const taskDoc = await getDoc(taskRef);
  const task = taskDoc.data() as Task;

  if (!task) {
    throw new Error('Task not found');
  }

  const updatedDependencies = task.dependencies.filter(
    (d) => d.dependentTaskId !== dependentTaskId
  );

  await updateDoc(taskRef, { dependencies: updatedDependencies });
};
