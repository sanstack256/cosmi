import admin from "firebase-admin";

if (!admin.apps.length) {
  if (!process.env.FIREBASE_ADMIN_KEY) {
    throw new Error("FIREBASE_ADMIN_KEY not set");
  }

  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_KEY);

    // 🔥 FIX: restore line breaks in private key
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

  } catch (err) {
    console.error("🔥 Failed to parse FIREBASE_ADMIN_KEY", err);
    throw err;
  }
}

export const db = admin.firestore();