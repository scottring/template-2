import { Goal } from '@/types/models';
import { db } from '@/lib/firebase/firebase';
import { doc, getDoc, Timestamp, DocumentData } from 'firebase/firestore';
import { isValid } from 'date-fns';

const convertFirestoreTimestamps = (data: DocumentData): Partial<Goal> => {
  const convertDate = (date: any): Date => {
    try {
      if (date instanceof Timestamp) {
        return date.toDate();
      }
      if (date instanceof Date) {
        return date;
      }
      if (typeof date === 'string') {
        const d = new Date(date);
        if (isValid(d)) return d;
      }
      console.log('Invalid date, using current date:', date);
      return new Date();
    } catch (e) {
      console.error('Error converting date:', date, e);
      return new Date();
    }
  };

  return {
    ...data,
    createdAt: convertDate(data.createdAt),
    updatedAt: convertDate(data.updatedAt),
    startDate: convertDate(data.startDate),
    targetDate: data.targetDate ? convertDate(data.targetDate) : undefined,
    steps: data.steps?.map((step: any) => ({
      ...step,
      nextOccurrence: step.nextOccurrence ? convertDate(step.nextOccurrence) : undefined,
      repeatEndDate: step.repeatEndDate ? convertDate(step.repeatEndDate) : undefined,
      tasks: (step.tasks || []).map((task: any) => ({
        ...task,
        dueDate: task.dueDate ? convertDate(task.dueDate) : undefined
      })),
      notes: step.notes || []
    })) || []
  };
};

export async function getGoalById(id: string): Promise<Goal | null> {
  console.log('Fetching goal from Firestore with ID:', id);
  
  if (!id || typeof id !== 'string') {
    console.error('Invalid goal ID:', id);
    return null;
  }

  try {
    const docRef = doc(db, 'goals', id);
    console.log('Document reference created:', docRef.path);
    
    const docSnap = await getDoc(docRef);
    console.log('Document snapshot:', docSnap.exists() ? 'exists' : 'does not exist');
    
    if (!docSnap.exists()) {
      console.error('Goal document not found for ID:', id);
      return null;
    }

    const rawData = docSnap.data();
    console.log('Raw goal data:', rawData);
    
    const convertedData = convertFirestoreTimestamps(rawData);
    console.log('Converted goal data:', convertedData);
    
    const goal = {
      ...convertedData,
      id: docSnap.id,
    } as Goal;
    
    console.log('Final goal object:', goal);
    return goal;
  } catch (error) {
    console.error('Error fetching goal:', error);
    return null;
  }
}
