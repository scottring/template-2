'use client';

import { useEffect } from 'react';
import { useItineraryStore } from '@/lib/stores/useItineraryStore';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import type { TimeScale, ItineraryType, Task, Habit, Goal, Project } from '@/types/models';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, 
         startOfQuarter, endOfQuarter, startOfYear, endOfYear } from 'date-fns';

interface ItineraryGeneratorProps {
  date: Date;
  type: ItineraryType;
  timeScale: TimeScale;
}

export function ItineraryGenerator({ date, type, timeScale }: ItineraryGeneratorProps) {
  const { createItinerary, getItineraryByDate } = useItineraryStore();

  const getDateRange = (date: Date, timeScale: TimeScale) => {
    switch (timeScale) {
      case 'daily':
        return { start: startOfDay(date), end: endOfDay(date) };
      case 'weekly':
        return { start: startOfWeek(date), end: endOfWeek(date) };
      case 'monthly':
        return { start: startOfMonth(date), end: endOfMonth(date) };
      case 'quarterly':
        return { start: startOfQuarter(date), end: endOfQuarter(date) };
      case 'yearly':
        return { start: startOfYear(date), end: endOfYear(date) };
    }
  };

  const generateItinerary = async () => {
    // Check if itinerary already exists
    const existingItinerary = getItineraryByDate(date, type, timeScale);
    if (existingItinerary) return;

    const dateRange = getDateRange(date, timeScale);
    const items = [];

    // Fetch relevant tasks
    const tasksQuery = query(
      collection(db, 'tasks'),
      where('dueDate', '>=', dateRange.start),
      where('dueDate', '<=', dateRange.end)
    );
    const taskDocs = await getDocs(tasksQuery);
    const tasks = taskDocs.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Task[];

    // Add tasks to itinerary
    items.push(...tasks.map(task => ({
      id: crypto.randomUUID(),
      type: 'task' as const,
      referenceId: task.id,
      status: 'pending' as const,
      notes: task.description,
    })));

    // For planning itineraries, include habits, goals, and projects
    if (type === 'planning') {
      // Add habits that need attention
      const habitsQuery = query(collection(db, 'habits'));
      const habitDocs = await getDocs(habitsQuery);
      const habits = habitDocs.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Habit[];
      
      items.push(...habits
        .filter(habit => habit.progress.completed < habit.progress.total)
        .map(habit => ({
          id: crypto.randomUUID(),
          type: 'habit' as const,
          referenceId: habit.id,
          status: 'pending' as const,
          notes: habit.description,
        })));

      // Add goals and projects for non-daily reviews
      if (timeScale !== 'daily') {
        const goalsQuery = query(collection(db, 'goals'));
        const goalDocs = await getDocs(goalsQuery);
        const goals = goalDocs.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Goal[];

        const projectsQuery = query(collection(db, 'projects'));
        const projectDocs = await getDocs(projectsQuery);
        const projects = projectDocs.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Project[];

        items.push(
          ...goals.map(goal => ({
            id: crypto.randomUUID(),
            type: 'goal' as const,
            referenceId: goal.id,
            status: 'pending' as const,
            notes: `Review progress: ${goal.progress}%`,
          })),
          ...projects.map(project => ({
            id: crypto.randomUUID(),
            type: 'project' as const,
            referenceId: project.id,
            status: 'pending' as const,
            notes: `Review progress: ${project.progress}%`,
          }))
        );
      }
    }

    // Create the itinerary
    await createItinerary({
      userId: 'current-user-id', // This should come from auth context
      type,
      timeScale,
      date,
      items,
      isCompleted: false,
    });
  };

  useEffect(() => {
    generateItinerary();
  }, [date, type, timeScale]);

  return null;
} 