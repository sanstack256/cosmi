import admin from "firebase-admin";

let app: admin.app.App;

if (!admin.apps.length) {
  if (!process.env.FIREBASE_ADMIN_KEY) {
    console.warn("⚠️ FIREBASE_ADMIN_KEY not set (skipping admin init)");
  } else {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_KEY);

      app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } catch (err) {
      console.error("🔥 Failed to parse FIREBASE_ADMIN_KEY", err);
    }
  }
}

export const db = admin.apps.length
  ? admin.firestore()
  : null;