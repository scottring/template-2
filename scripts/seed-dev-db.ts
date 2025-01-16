import * as dotenv from 'dotenv';
import path from 'path';
import * as admin from 'firebase-admin';

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
      name: 'Test Goal 1',
      description: 'A sample goal for testing',
      status: 'in_progress',
      startDate: new Date(),
      targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    },
  ],
  tasks: [
    {
      title: 'Test Task 1',
      description: 'A sample task for testing',
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