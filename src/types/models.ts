export type TimeScale = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

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
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'high' | 'medium' | 'low';
  category: TaskCategory;
  dueDate?: Date;
  completedAt?: Date;
  assignedTo: string[];
  recurrence?: RecurrencePattern;
  notes?: Note[];
  checklist?: ChecklistItem[];
  tags: string[];
}

export type TaskCategory = 
  | 'chore' 
  | 'errand' 
  | 'maintenance' 
  | 'kids' 
  | 'meal' 
  | 'shopping'
  | 'finance'
  | 'health'
  | 'social'
  | 'other';

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
  createdAt: Date;
  createdBy: string;
  type: 'comment' | 'update' | 'question';
}

export interface RecurrencePattern {
  frequency: number;
  interval: TimeScale;
  endAfter?: number;
  endDate?: Date;
  daysOfWeek?: number[]; // 0-6 for Sunday-Saturday
  dayOfMonth?: number;
  monthOfYear?: number;
  skipHolidays?: boolean;
}

export interface Goal extends BaseItem {
  name: string;
  description: string;
  startDate: Date;
  targetDate: Date;
  progress: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'cancelled';
  successCriteria: SuccessCriteria[];
  assignedTo: string[];
  areaId: string;
}

export interface SuccessCriteria {
  text: string;
  isTracked: boolean;
  timescale?: TimeScale;
  frequency?: number;
  nextOccurrence?: Date;
  tasks?: Array<{
    id: string;
    text: string;
    completed: boolean;
  }>;
  notes?: Array<{
    id: string;
    text: string;
    timestamp: Date;
  }>;
}

export interface Area extends BaseItem {
  name: string;
  description: string;
  color: string;
  icon: string;
  goals: string[]; // Goal IDs
  parentId?: string;
}

export interface Project extends BaseItem {
  name: string;
  description: string;
  goalId: string;
  startDate: Date;
  endDate: Date;
  status: 'not_started' | 'in_progress' | 'completed' | 'cancelled';
  assignedTo: string[];
}
