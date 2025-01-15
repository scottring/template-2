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
  frequency?: number;
  timescale?: TimeScale;
  isTracked?: boolean;
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

export interface Routine {
  id: string;
  name: string;
  description: string;
  frequency: {
    type: 'daily' | 'weekly' | 'monthly';
    value: number;
  };
  progress?: {
    completed: number;
    total: number;
  };
  streak?: number;
  assignedTo: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Keeping Habit for backwards compatibility
export interface Habit extends Routine {}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'member';
  createdAt: Date;
  updatedAt: Date;
}

export type TimeScale = 'daily' | 'weekly' | 'monthly' | 'quarterly';
export type ItineraryType = 'planning' | 'review';

export interface DaySchedule {
  day: number;
  time: string;
}

export interface Schedule {
  schedules: DaySchedule[];
  repeat: TimeScale;
}

export interface ItineraryItem {
  id: string;
  notes: string;
  type: 'habit' | 'task' | 'event';
  status: 'pending' | 'completed';
  schedule?: Schedule;
  dueDate?: Date;
  referenceId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Itinerary {
  type: ItineraryType;
  timeScale: TimeScale;
  date: Date;
  items: ItineraryItem[];
  isCompleted: boolean;
}
