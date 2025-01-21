import { Timestamp } from 'firebase/firestore';
import { isValid, parseISO } from 'date-fns';

export const toFirestoreDate = (date: Date | string | undefined | null): Timestamp | null => {
  if (!date) return null;
  
  try {
    const d = typeof date === 'string' ? parseISO(date) : new Date(date);
    return isValid(d) ? Timestamp.fromDate(d) : null;
  } catch (error) {
    console.error('Date conversion error:', error);
    return null;
  }
};

export const fromFirestoreDate = (timestamp: Timestamp | Date | string | undefined | null): Date | null => {
  if (!timestamp) return null;
  
  try {
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate();
    }
    if (timestamp instanceof Date) {
      return isValid(timestamp) ? timestamp : null;
    }
    const d = new Date(timestamp);
    return isValid(d) ? d : null;
  } catch (error) {
    console.error('Date conversion error:', error);
    return null;
  }
};

export const validateDate = (date: unknown): date is Date => {
  return date instanceof Date && isValid(date);
};

export const normalizeDate = (date: unknown): Date | null => {
  if (!date) return null;
  
  try {
    if (date instanceof Date) {
      return isValid(date) ? date : null;
    }
    if (typeof date === 'string') {
      const d = new Date(date);
      return isValid(d) ? d : null;
    }
    if (date instanceof Timestamp) {
      return date.toDate();
    }
    return null;
  } catch (error) {
    console.error('Date normalization error:', error);
    return null;
  }
};
