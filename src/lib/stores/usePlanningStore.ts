import { create } from 'zustand';
import { collection, query, where, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { startOfWeek, endOfWeek, isBefore, isAfter } from 'date-fns';
import { CriteriaInstance, PlanningSession, PlanningPeriod, CriteriaProgress } from '@/types/planning';

interface PlanningStore {
  currentSession: PlanningSession | null;
  currentPeriod: PlanningPeriod | null;
  criteriaProgress: Map<string, CriteriaProgress>;
  
  // Session Management
  initializeSession: (regularStartDate: Date, actualStartDate: Date) => Promise<void>;
  updateSession: (updates: Partial<PlanningSession>) => void;
  confirmCarryover: (criteriaId: string, instanceId: string, isConfirmed: boolean) => void;
  
  // Progress Tracking
  updateCriteriaStatus: (
    criteriaId: string,
    status: CriteriaInstance['status'],
    date?: Date
  ) => Promise<void>;
  
  // Period Management
  startNewPeriod: (startDate: Date, type: PlanningPeriod['type']) => Promise<void>;
  completePeriod: () => Promise<void>;
}

const usePlanningStore = create<PlanningStore>((set, get) => ({
  currentSession: null,
  currentPeriod: null,
  criteriaProgress: new Map(),

  initializeSession: async (regularStartDate: Date, actualStartDate: Date) => {
    // Check for existing incomplete period
    const periodsRef = collection(db, 'planningPeriods');
    const q = query(
      periodsRef,
      where('status', '==', 'pending'),
      where('type', '==', 'weekly')
    );
    const snapshot = await getDocs(q);
    
    let period = snapshot.docs[0]?.data() as PlanningPeriod | undefined;
    
    if (!period) {
      // Create new period
      period = {
        startDate: regularStartDate,
        endDate: endOfWeek(regularStartDate),
        type: 'weekly',
        status: 'pending',
        carryoverFromPrevious: isBefore(regularStartDate, actualStartDate)
      };
      
      await addDoc(periodsRef, period);
    }

    // Initialize session
    const session: PlanningSession = {
      step: 'review',
      currentGoalIndex: 0,
      markedItems: new Set(),
      reviewedItems: new Set(),
      successItems: new Set(),
      failureItems: new Set(),
      ongoingItems: new Set(),
      regularStartDate,
      actualStartDate,
      carryoverInstances: new Map(),
      isCarryoverConfirmed: false
    };

    // Check for carryover instances if meeting is late
    if (isBefore(regularStartDate, actualStartDate)) {
      const instancesRef = collection(db, 'criteriaInstances');
      const instancesQuery = query(
        instancesRef,
        where('date', '>=', regularStartDate),
        where('date', '<=', actualStartDate)
      );
      
      const instancesSnapshot = await getDocs(instancesQuery);
      const carryoverMap = new Map<string, CriteriaInstance[]>();
      
      instancesSnapshot.docs.forEach(doc => {
        const instance = doc.data() as CriteriaInstance;
        const existing = carryoverMap.get(instance.criteriaId) || [];
        carryoverMap.set(instance.criteriaId, [...existing, instance]);
      });
      
      session.carryoverInstances = carryoverMap;
    }

    set({ currentSession: session, currentPeriod: period });
  },

  updateSession: (updates: Partial<PlanningSession>) => {
    set(state => ({
      currentSession: state.currentSession ? { ...state.currentSession, ...updates } : null
    }));
  },

  confirmCarryover: (criteriaId: string, instanceId: string, isConfirmed: boolean) => {
    set(state => {
      if (!state.currentSession) return state;

      const newCarryover = new Map(state.currentSession.carryoverInstances);
      const instances = newCarryover.get(criteriaId) || [];
      const updatedInstances = instances.map((instance, idx) => 
        idx.toString() === instanceId ? { ...instance, isConfirmed } : instance
      );
      newCarryover.set(criteriaId, updatedInstances);

      return {
        currentSession: {
          ...state.currentSession,
          carryoverInstances: newCarryover
        }
      };
    });
  },

  updateCriteriaStatus: async (criteriaId: string, status, date = new Date()) => {
    const { currentSession, currentPeriod } = get();
    if (!currentSession || !currentPeriod) return;

    // Create new instance
    const instance: CriteriaInstance = {
      criteriaId,
      goalId: criteriaId.split('-')[0], // Assuming format: goalId-criteriaText
      date,
      isConfirmed: true,
      status
    };

    // Add to Firestore
    await addDoc(collection(db, 'criteriaInstances'), instance);

    // Update progress tracking
    const progressRef = doc(db, 'criteriaProgress', criteriaId);
    const progress = get().criteriaProgress.get(criteriaId);

    if (progress) {
      const updatedProgress = {
        actualCount: status === 'completed' ? progress.actualCount + 1 : progress.actualCount,
        status: status === 'ongoing' ? 'ongoing' : progress.status,
        'instances': [...progress.instances, instance]
      };

      await updateDoc(progressRef, updatedProgress);
      
      set(state => ({
        criteriaProgress: new Map(state.criteriaProgress).set(criteriaId, {
          ...progress,
          ...updatedProgress
        })
      }));
    }
  },

  startNewPeriod: async (startDate: Date, type: PlanningPeriod['type']) => {
    const period: PlanningPeriod = {
      startDate,
      endDate: type === 'weekly' ? endOfWeek(startDate) : startDate, // Adjust for other period types
      type,
      status: 'pending',
      carryoverFromPrevious: false
    };

    await addDoc(collection(db, 'planningPeriods'), period);
    set({ currentPeriod: period });
  },

  completePeriod: async () => {
    const { currentPeriod } = get();
    if (!currentPeriod) return;

    const periodRef = doc(db, 'planningPeriods', currentPeriod.type);
    await updateDoc(periodRef, { status: 'completed' });

    set({ currentPeriod: null });
  }
}));

export default usePlanningStore; 