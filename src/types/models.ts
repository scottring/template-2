export type TimeScale = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export interface Schedule {
  startDate: Date;
  endDate?: Date;
  repeat?: TimeScale;
  schedules: {
    day: number;
    time: string;
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

export type GoalType = 'Habit' | 'Tangible';

export interface Goal extends BaseItem {
  name: string;
  description: string;
  areaId: string;
  startDate: Date;
  targetDate?: Date;
  progress: number;
  goalType: GoalType;
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
  isFocus?: boolean;
  isActive?: boolean;
  assignedTo: string[];
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
  status: 'pending' | 'completed' | 'cancelled' | 'ongoing';
  notes: string;
  householdId: string;
  dueDate?: Date;
}

export type TaskCategory = 'chore' | 'errand' | 'maintenance' | 'kids' | 'meal' | 'shopping' | 'finance' | 'health' | 'social' | 'other';

export interface Project extends BaseItem {
  name: string;
  description: string;
  goalId: string;
  progress: number;
  startDate?: Date;
  endDate?: Date;
  assignedTo: string[];
  householdId: string;
}
