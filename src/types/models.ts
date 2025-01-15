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
  defaultAssignments: string[]; // task IDs
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
  resources?: string[]; // Resource IDs
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

export interface Resource extends BaseItem {
  name: string;
  type: ResourceType;
  category: string;
  value: number;
  unit?: string;
  threshold?: number;
  location?: string;
  notes?: string;
  history: ResourceHistory[];
  tags: string[];
}

export type ResourceType = 
  | 'inventory' 
  | 'budget' 
  | 'document';

export interface ResourceHistory {
  id: string;
  previousValue: number;
  newValue: number;
  date: Date;
  notes?: string;
  updatedBy: string;
}

export interface MealPlan extends BaseItem {
  date: Date;
  meals: Meal[];
  notes?: string;
  groceryList?: GroceryItem[];
}

export interface Meal {
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  name: string;
  recipe?: string;
  prepTime?: number;
  cookTime?: number;
  assignedTo?: string[];
  ingredients: GroceryItem[];
  notes?: string;
}

export interface GroceryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit?: string;
  purchased?: boolean;
  purchasedBy?: string;
  purchasedAt?: Date;
  notes?: string;
}

export interface Schedule extends BaseItem {
  date: Date;
  events: Event[];
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  participants: string[];
  category: 'family' | 'personal' | 'work' | 'kids' | 'other';
  recurrence?: RecurrencePattern;
  reminders?: number[]; // minutes before event
}

export interface Budget extends BaseItem {
  householdId: string;
  date: Date;
  categories: BudgetCategory[];
  notes?: string;
  totalBudget: number;
  totalSpent: number;
}

export interface BudgetCategory {
  name: string;
  budgeted: number;
  spent: number;
  rollover?: number;
}

export interface Transaction extends BaseItem {
  householdId: string;
  budgetId: string;
  date: Date;
  amount: number;
  category: string;
  description: string;
  type: 'income' | 'expense';
  paymentMethod?: string;
  receipt?: string;
  recurring?: boolean;
  recurrencePattern?: RecurrencePattern;
  tags: string[];
  notes?: string;
  purchased: boolean;
  purchasedBy?: string;
  purchasedAt?: Date;
}
