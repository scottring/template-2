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
  defaultAssignments: string[];
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

export type GoalType = 'Routine' | 'Project' | 'One Time Task';

export interface Goal extends BaseItem {
  name: string;
  description: string;
  areaId: string;
  startDate: Date;
  targetDate?: Date;
  progress: number;
  goalType: GoalType;
  status: 'not_started' | 'in_progress' | 'completed' | 'cancelled';
  steps: Step[];
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

export interface Step {
  id: string;
  text: string;
  details?: string;
  stepType: GoalType;
  isTracked: boolean;
  timescale?: TimeScale;
  frequency?: number;
  startDateTime?: Date;
  endDateTime?: Date;
  nextOccurrence?: Date;
  repeatEndDate?: Date;
  selectedDays?: string[];
  scheduledTimes?: {
    [day: string]: string[];
  };
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
  type: 'task' | 'routine' | 'event' | 'project' | 'one-time-task';
  referenceId: string;
  stepId?: string;
  schedule?: Schedule;
  status: 'pending' | 'completed' | 'cancelled' | 'ongoing';
  notes: string;
  householdId: string;
  dueDate?: Date;
  targetDate?: Date;
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

export interface User extends BaseItem {
  name: string;
  email: string;
  role: 'admin' | 'member';
  photoURL?: string;
  householdId?: string;
}

export interface Budget extends BaseItem {
  householdId: string;
  date: Date;
  categories: {
    [category: string]: {
      planned: number;
      actual: number;
    };
  };
  totalPlanned: number;
  totalActual: number;
  notes: string;
}

export interface Transaction extends BaseItem {
  householdId: string;
  budgetId: string;
  date: Date;
  amount: number;
  category: string;
  description: string;
  type: 'income' | 'expense';
  paymentMethod: string;
  status: 'pending' | 'completed' | 'cancelled';
  tags: string[];
  notes: string;
}

export interface MealPlan extends BaseItem {
  householdId: string;
  startDate: Date;
  endDate: Date;
  meals: Meal[];
  groceryList: GroceryItem[];
  notes: string;
}

export interface Meal {
  id: string;
  name: string;
  description: string;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  date: Date;
  servings: number;
  ingredients: {
    name: string;
    amount: number;
    unit: string;
  }[];
  instructions: string[];
  prepTime: number;
  cookTime: number;
  assignedTo: string[];
  notes: string;
}

export interface GroceryItem {
  id: string;
  name: string;
  amount: number;
  unit: string;
  category: string;
  purchased: boolean;
  purchasedBy?: string;
  purchasedAt?: Date;
  notes: string;
}

export interface Resource {
  id: string;
  householdId: string;
  name: string;
  type: 'inventory' | 'currency' | 'energy' | 'other';
  category: string;
  value: number;
  unit?: string;
  threshold?: number;
  description?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
  history: ResourceHistory[];
}

export interface ResourceHistory {
  id: string;
  previousValue: number;
  newValue: number;
  date: Date;
  notes?: string;
  updatedBy: string;
}
