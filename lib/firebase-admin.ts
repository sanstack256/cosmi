import admin from "firebase-admin";

if (!admin.apps.length) {
  if (!process.env.FIREBASE_ADMIN_KEY) {
    throw new Error("FIREBASE_ADMIN_KEY not set");
  }

  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_KEY);

    //  Fix private key formatting
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

  } catch (err) {
    console.error(" Failed to parse FIREBASE_ADMIN_KEY", err);
    throw err;
  }
}

// ✅ EXPORTS (important)
export const adminAuth = admin.auth();
export const adminDb = admin.firestore();