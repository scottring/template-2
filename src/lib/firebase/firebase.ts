import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const isDevelopment = process.env.NODE_ENV === 'development';

// Validate environment variables
function validateConfig(config: Record<string, string | undefined>, environment: string) {
  const missingVars = Object.entries(config)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing ${environment} Firebase configuration variables: ${missingVars.join(', ')}`
    );
  }
}

const developmentConfig = {
  apiKey: process.env.NEXT_PUBLIC_DEV_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_DEV_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_DEV_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_DEV_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_DEV_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_DEV_FIREBASE_APP_ID
};

const productionConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Validate the appropriate config
if (isDevelopment) {
  validateConfig(developmentConfig, 'development');
  console.log('Using development Firebase config:', {
    ...developmentConfig,
    apiKey: '***' // Hide sensitive data in logs
  });
} else {
  validateConfig(productionConfig, 'production');
}

const config = isDevelopment ? developmentConfig : productionConfig;

// Initialize Firebase
let app;
if (!getApps().length) {
  try {
    app = initializeApp(config);
    console.log(`Firebase initialized successfully in ${isDevelopment ? 'development' : 'production'} mode`);
    console.log('Using project:', config.projectId);
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    throw error;
  }
} else {
  app = getApps()[0];
}

const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { app, db, auth, storage };
