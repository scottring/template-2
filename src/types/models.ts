export type TimeScale = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface Schedule {
  startDate: Date;
  endDate?: Date;
  recurrence?: {
    frequency: number;
    interval: TimeScale;
  };
  schedules?: {
    repeat: {
      days: number[];
      times: string[];
    };
  }[];
}

export interface BaseItem {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

export interface Household extends BaseItem {
  name: string;
  members: HouseholdMember[];
  inviteCodes: InviteCode[];
}

export interface HouseholdMember {
  userId: string;
  role: 'admin' | 'member';
  displayName: string;
  photoURL?: string;
  preferences: MemberPreferences;
  joinedAt: Date;
}

export interface InviteCode {
  code: string;
  createdAt: Date;
  expiresAt: Date;
  usedBy?: string;
  usedAt?: Date;
}

export interface MemberPreferences {
  notifications: NotificationPreferences;
  defaultView: 'day' | 'week' | 'month';
  colorScheme: string;
}

export interface NotificationPreferences {
  taskReminders: boolean;
  planningReminders: boolean;
  inventoryAlerts: boolean;
  taskAssignments: boolean;
  reminderHoursBefore: number;
}

export interface Task extends BaseItem {
  title: string;
  description: string;
  status: 'pending' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  category: TaskCategory;
  assignedTo: string[];
  householdId: string;
  goalId?: string;
  criteriaId?: string;
  dueDate?: Date;
  completedAt?: Date;
  checklist: ChecklistItem[];
  notes: Note[];
}

export interface Goal extends BaseItem {
  name: string;
  description: string;
  areaId: string;
  startDate: Date;
  targetDate: Date;
  progress: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'cancelled';
  successCriteria: SuccessCriteria[];
  assignedTo: string[];
  householdId: string;
}

export interface Area extends BaseItem {
  name: string;
  description: string;
  color: string;
  icon: string;
  parentId?: string;
  householdId: string;
}

export interface SuccessCriteria {
  id: string;
  text: string;
  isTracked: boolean;
  timescale?: TimeScale;
  frequency?: number;
  nextOccurrence?: Date;
  tasks: { id: string; text: string; completed: boolean; }[];
  notes: { id: string; text: string; timestamp: Date; }[];
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  completedAt?: Date;
  completedBy?: string;
}

export interface Note {
  id: string;
  text: string;
  type: 'comment' | 'update' | 'question';
  createdAt: Date;
  createdBy: string;
}

export interface ItineraryItem extends BaseItem {
  type: 'task' | 'habit' | 'event';
  referenceId: string;
  criteriaId?: string;
  schedule: Schedule;
  status: 'pending' | 'completed' | 'cancelled';
  notes?: string;
  timescale?: TimeScale;
  dueDate?: Date;
}

export type TaskCategory = 'chore' | 'errand' | 'maintenance' | 'kids' | 'meal' | 'shopping' | 'finance' | 'health' | 'social' | 'other';
