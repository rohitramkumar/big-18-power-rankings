import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin (only once)
if (getApps().length === 0) {
  // Check if we're using environment variables for credentials
  if (process.env.FIREBASE_PROJECT_ID) {
    console.log("Initializing Firebase with environment variables.");
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.log("Initializing Firebase with service account key file.");
    // Use service account key file
    initializeApp({
      credential: cert(process.env.GOOGLE_APPLICATION_CREDENTIALS),
    });
  } else {
    console.warn('Firebase credentials not found. Please set up Firebase environment variables.');
    // For development, you can initialize without credentials (will fail on actual operations)
    initializeApp();
  }
}

export const db = getFirestore("big18-power-rankings-votes");
