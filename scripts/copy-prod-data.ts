import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.development') });

// Initialize Firebase Admin for Production
const prodApp = admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
  databaseURL: `https://${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseio.com`
}, 'production');

// Initialize Firebase Admin for Development
const devApp = admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.NEXT_PUBLIC_DEV_FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_DEV_ADMIN_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_DEV_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
  databaseURL: `https://${process.env.NEXT_PUBLIC_DEV_FIREBASE_PROJECT_ID}.firebaseio.com`
}, 'development');

const prodDb = prodApp.firestore();
const devDb = devApp.firestore();

const collections = ['households', 'goals', 'tasks', 'items'];

async function copyCollection(collectionName: string) {
  console.log(`Copying collection: ${collectionName}`);
  
  const snapshot = await prodDb.collection(collectionName).get();
  
  console.log(`Found ${snapshot.size} documents in ${collectionName}`);
  
  const batch = devDb.batch();
  let count = 0;
  
  for (const doc of snapshot.docs) {
    const data = doc.data();
    const ref = devDb.collection(collectionName).doc(doc.id);
    batch.set(ref, data);
    count++;
    
    // Firestore has a limit of 500 operations per batch
    if (count >= 400) {
      await batch.commit();
      console.log(`Committed batch of ${count} documents`);
      count = 0;
    }
  }
  
  if (count > 0) {
    await batch.commit();
    console.log(`Committed final batch of ${count} documents`);
  }
  
  console.log(`Finished copying ${collectionName}`);
}

async function copyData() {
  try {
    for (const collection of collections) {
      await copyCollection(collection);
    }
    console.log('Successfully copied all data from production to development');
  } catch (error) {
    console.error('Error copying data:', error);
  } finally {
    process.exit();
  }
}

copyData(); 