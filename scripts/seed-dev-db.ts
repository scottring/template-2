import * as dotenv from 'dotenv';
import path from 'path';
import * as admin from 'firebase-admin';
import crypto from 'crypto';

// Load environment variables from .env.development
dotenv.config({ path: path.resolve(process.cwd(), '.env.development') });

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    const serviceAccount = require('../firebase-service-account.json');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.NEXT_PUBLIC_DEV_FIREBASE_PROJECT_ID,
    });
  } catch (error) {
    console.error('Error loading service account file. Make sure firebase-service-account.json exists in the root directory.');
    console.error('You can get this file from Firebase Console > Project Settings > Service Accounts > Generate New Private Key');
    process.exit(1);
  }
}

const db = admin.firestore();

const sampleData = {
  household: {
    name: 'Test Household',
    members: ['test@example.com']
  },
  goals: [
    {
      name: 'Morning Routine',
      description: 'Daily morning routine',
      status: 'in_progress',
      startDate: new Date(),
      targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      goalType: 'Routine',
      steps: [
        {
          id: crypto.randomUUID(),
          text: 'Wake up at 6am',
          stepType: 'Routine',
          isTracked: true,
          selectedDays: ['M', 'Tu', 'W', 'Th', 'F'],
          scheduledTimes: { 'M': ['06:00'], 'Tu': ['06:00'], 'W': ['06:00'], 'Th': ['06:00'], 'F': ['06:00'] }
        }
      ]
    },
    {
      name: 'Kitchen Renovation',
      description: 'Renovate the kitchen',
      status: 'not_started',
      startDate: new Date(),
      targetDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      goalType: 'Project',
      steps: [
        {
          id: crypto.randomUUID(),
          text: 'Get contractor quotes',
          stepType: 'One Time Task',
          isTracked: true
        }
      ]
    },
    {
      name: 'Buy New Laptop',
      description: 'Purchase a new work laptop',
      status: 'not_started',
      startDate: new Date(),
      targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      goalType: 'One Time Task',
      steps: [
        {
          id: crypto.randomUUID(),
          text: 'Research models',
          stepType: 'One Time Task',
          isTracked: true
        }
      ]
    }
  ],
  tasks: [
    {
      title: 'Urgent Task Due Today',
      description: 'This should appear in Today\'s Tasks',
      status: 'pending',
      dueDate: new Date(), // Today
      assignedTo: ['test@example.com']
    },
    {
      title: 'Completed Yesterday Task',
      description: 'This should count towards completed tasks',
      status: 'completed',
      dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
      assignedTo: ['test@example.com']
    },
    {
      title: 'Upcoming Tomorrow Task',
      description: 'This should appear in Next Tasks',
      status: 'pending',
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      assignedTo: ['test@example.com']
    },
  ]
};

async function clearCollection(collectionName: string) {
  const querySnapshot = await db.collection(collectionName).get();
  const deletePromises = querySnapshot.docs.map(doc => doc.ref.delete());
  await Promise.all(deletePromises);
  console.log(`Cleared ${collectionName} collection`);
}

async function seedDatabase() {
  if (process.env.NODE_ENV !== 'development') {
    console.error('This script can only be run in development environment');
    process.exit(1);
  }

  try {
    // Clear existing data
    await clearCollection('households');
    await clearCollection('goals');
    await clearCollection('tasks');

    // Add household
    const householdRef = await db.collection('households').add(sampleData.household);
    console.log('Added test household:', householdRef.id);

    // Add goals
    for (const goal of sampleData.goals) {
      await db.collection('goals').add({
        ...goal,
        householdId: householdRef.id,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    console.log('Added test goals');

    // Add tasks
    for (const task of sampleData.tasks) {
      await db.collection('tasks').add({
        ...task,
        householdId: householdRef.id,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    console.log('Added test tasks');

    console.log('Database seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seed function
seedDatabase();
