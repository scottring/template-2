import { TimeScale } from './models';

export interface CriteriaInstance {
  criteriaId: string;
  goalId: string;
  date: Date;
  isConfirmed: boolean;
  status: 'pending' | 'completed' | 'cancelled' | 'ongoing';
}

export interface PlanningSession {
  step: 'review' | 'schedule';
  currentGoalIndex: number;
  markedItems: Set<string>;
  reviewedItems: Set<string>;
  successItems: Set<string>;
  failureItems: Set<string>;
  ongoingItems: Set<string>;
  regularStartDate: Date;
  actualStartDate: Date;
  carryoverInstances: Map<string, CriteriaInstance[]>;
  isCarryoverConfirmed: boolean;
}

export interface PlanningPeriod {
  startDate: Date;
  endDate: Date;
  type: 'weekly' | 'monthly' | 'quarterly';
  status: 'pending' | 'completed';
  carryoverFromPrevious: boolean;
}

export interface CriteriaProgress {
  criteriaId: string;
  goalId: string;
  periodStartDate: Date;
  periodEndDate: Date;
  targetCount: number;
  actualCount: number;
  status: 'pending' | 'completed' | 'failed' | 'ongoing';
  instances: CriteriaInstance[];
} 