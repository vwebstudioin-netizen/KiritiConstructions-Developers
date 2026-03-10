import * as admin from 'firebase-admin'

// Initialize Firebase Admin SDK once
if (!admin.apps.length) {
  const creds = process.env.FIREBASE_ADMIN_CREDENTIALS

  if (creds) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(creds)),
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      })
    } catch {
      // Already initialized or invalid JSON
    }
  } else {
    // Fallback: initialize with just the project ID (works on some environments)
    try {
      admin.initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? 'demo-project',
      })
    } catch {
      // Already initialized
    }
  }
}

export const adminDb = admin.firestore()
