export interface Area {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  isFocus: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Goal {
  id: string;
  areaId: string;
  name: string;
  description: string;
  successCriteria: string[];
  targetDate: Date;
  progress: number;
  createdAt: Date;
  updatedAt: Date;
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