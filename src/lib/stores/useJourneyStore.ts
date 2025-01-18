import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { startOfWeek, addDays, isBefore } from 'date-fns';
import { CriteriaInstance, PlanningSession } from '@/types/planning';

export type JourneyStage = 
  | "base-goal-setting"
  | "review-and-planning"
  | "daily-life"
  | "progress-tracking"
  | "reflection";

export type PlanningStep = 
  | "not_started"
  | "review_goals"
  | "mark_for_scheduling"
  | "schedule_items"
  | "complete";

interface ScheduledMeeting {
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  preferredTime?: string;
  lastCompleted?: Date;
}

interface JourneyState {
  currentStage: JourneyStage;
  isInPlanningSessions: boolean;
  planningStep: PlanningStep;
  stageIndex: number;
  weeklyMeeting: ScheduledMeeting;
  
  // Session Management
  currentSession: PlanningSession | null;
  updateSession: (updates: Partial<PlanningSession>) => void;
  
  // Planning flow
  startPlanning: (customStartDate?: Date) => void;
  nextPlanningStep: () => void;
  completePlanning: () => void;
  
  // Meeting schedule
  setWeeklyMeetingDay: (dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6, preferredTime?: string) => void;
  getEffectivePlanningStartDate: () => Date;
  shouldIncludeLargerTimeScaleGoals: () => {
    monthly: boolean;
    quarterly: boolean;
    yearly: boolean;
  };
  
  // Review management
  isWeeklyReviewNeeded: () => boolean;
  markWeeklyReviewComplete: () => void;
}

const stageOrder: JourneyStage[] = [
  "base-goal-setting",
  "review-and-planning",
  "daily-life",
  "progress-tracking",
  "reflection"
];

const planningSteps: PlanningStep[] = [
  "not_started",
  "review_goals",
  "mark_for_scheduling",
  "schedule_items",
  "complete"
];

const createInitialSession = (): PlanningSession => ({
  step: 'review',
  currentGoalIndex: 0,
  markedItems: new Set<string>(),
  reviewedItems: new Set<string>(),
  successItems: new Set<string>(),
  failureItems: new Set<string>(),
  ongoingItems: new Set<string>(),
  regularStartDate: new Date(),
  actualStartDate: new Date(),
  carryoverInstances: new Map<string, CriteriaInstance[]>(),
  isCarryoverConfirmed: false
});

export const useJourneyStore = create<JourneyState>()(
  devtools(
    persist(
      (set, get) => ({
        currentStage: "daily-life",
        isInPlanningSessions: false,
        planningStep: "not_started",
        stageIndex: 2,
        weeklyMeeting: { dayOfWeek: 0 }, // Default to Sunday
        currentSession: null,

        updateSession: (updates) => set(state => ({
          currentSession: state.currentSession ? {
            ...state.currentSession,
            ...updates
          } : null
        })),

        startPlanning: (customStartDate?: Date) => {
          const effectiveStartDate = customStartDate || get().getEffectivePlanningStartDate();
          
          set({
            isInPlanningSessions: true,
            currentStage: "review-and-planning",
            stageIndex: 1,
            planningStep: "review_goals",
            currentSession: {
              ...createInitialSession(),
              regularStartDate: effectiveStartDate,
              actualStartDate: new Date()
            }
          });
        },

        nextPlanningStep: () => {
          const state = get();
          const currentStepIndex = planningSteps.indexOf(state.planningStep);
          const nextStep = planningSteps[currentStepIndex + 1];
          
          if (nextStep) {
            set({ planningStep: nextStep });
            
            // Update session step if we have an active session
            if (state.currentSession) {
              state.updateSession({
                step: nextStep === 'mark_for_scheduling' ? 'review' : 'schedule'
              });
            }
          }
        },

        completePlanning: () => {
          const state = get();
          set({
            isInPlanningSessions: false,
            currentStage: "daily-life",
            stageIndex: 2,
            planningStep: "not_started",
            currentSession: null,
            weeklyMeeting: {
              ...state.weeklyMeeting,
              lastCompleted: new Date()
            }
          });
        },

        setWeeklyMeetingDay: (dayOfWeek, preferredTime) => set(state => ({
          weeklyMeeting: {
            ...state.weeklyMeeting,
            dayOfWeek,
            preferredTime
          }
        })),

        getEffectivePlanningStartDate: () => {
          const { weeklyMeeting } = get();
          const today = new Date();
          const currentWeekStart = startOfWeek(today, { weekStartsOn: weeklyMeeting.dayOfWeek });
          
          return isBefore(today, addDays(currentWeekStart, 3)) 
            ? currentWeekStart // Use current week if within 3 days
            : addDays(currentWeekStart, 7); // Use next week if later
        },

        shouldIncludeLargerTimeScaleGoals: () => {
          const today = new Date();
          return {
            monthly: today.getDate() <= 7, // First week of month
            quarterly: today.getDate() <= 7 && today.getMonth() % 3 === 0, // First week of quarter
            yearly: today.getDate() <= 7 && today.getMonth() === 0 // First week of year
          };
        },

        isWeeklyReviewNeeded: () => {
          const { weeklyMeeting } = get();
          const today = new Date();
          const lastCompleted = weeklyMeeting.lastCompleted;
          
          if (!lastCompleted) return true;
          
          const lastCompletedDate = new Date(lastCompleted);

          // Check if review was completed today
          if (lastCompletedDate.toDateString() === today.toDateString()) {
            return false;
          }
          
          const daysSinceLastReview = Math.floor(
            (today.getTime() - lastCompletedDate.getTime()) / (1000 * 60 * 60 * 24)
          );
          
          return daysSinceLastReview >= 7;
        },

        markWeeklyReviewComplete: () => {
          set(state => ({
            weeklyMeeting: {
              ...state.weeklyMeeting,
              lastCompleted: new Date()
            }
          }));
        }
      }),
      {
        name: 'journey-store',
        partialize: (state) => ({
          weeklyMeeting: state.weeklyMeeting,
        }),
      }
    )
  )
); 