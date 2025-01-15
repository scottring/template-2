export interface Area {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  isFocus: boolean;
  assignedTo: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Goal {
  id: string;
  areaId: string;
  name: string;
  description: string;
  successCriteria: SuccessCriteria[];
  startDate: Date;
  targetDate: Date;
  progress: number;
  assignedTo: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SuccessCriteria {
  text: string;
  isTracked: boolean;
  timescale?: TimeScale;
  nextOccurrence?: Date;
}

export interface Project {
  id: string;
  goalId: string;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  progress: number;
  assignedTo: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  projectId?: string;
  goalId?: string;
  name: string;
  description: string;
  isRecurring: boolean;
  recurringPattern?: string;
  completionCriteria: string[];
  assignedTo: string[];
  dueDate: Date;
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Habit {
  id: string;
  name: string;
  description: string;
  frequency: {
    type: 'daily' | 'weekly' | 'monthly';
    value: number;
  };
  progress: {
    completed: number;
    total: number;
    streak: number;
  };
  assignedTo: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'member';
  createdAt: Date;
  updatedAt: Date;
}

export type TimeScale = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
export type ItineraryType = 'planning' | 'review';

export interface ItineraryItem {
  id: string;
  type: 'task' | 'routine' | 'habit' | 'goal' | 'project';
  referenceId: string;
  status: 'pending' | 'completed' | 'deferred' | 'cancelled';
  notes?: string;
  parentId?: string;
  goalId?: string;
}

export interface Itinerary {
  id: string;
  userId: string;
  type: ItineraryType;
  timeScale: TimeScale;
  date: Date;
  items: ItineraryItem[];
  isCompleted: boolean;
}
