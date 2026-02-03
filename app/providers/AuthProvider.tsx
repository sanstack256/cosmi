"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  onAuthStateChanged,
  signOut as firebaseSignOut,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  User,
  sendPasswordResetEmail,
} from "firebase/auth";

import { doc, getDoc, setDoc } from "firebase/firestore";

import { auth, db } from "@/lib/firebase";

/* ----------------------------------------
   Types
----------------------------------------- */

type AuthCtx = {
  user: User | null;
  loading: boolean;
  plan: "free" | "pro" | "business";
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  getIdToken: (forceRefresh?: boolean) => Promise<string | null>;
  sendPasswordReset: () => Promise<void>;
};

const AuthContext = createContext<AuthCtx | undefined>(undefined);

const googleProvider = new GoogleAuthProvider();

/* ----------------------------------------
   Provider
----------------------------------------- */

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<"free" | "pro" | "business">("free");

  /* 🔐 Auth state */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u ?? null);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  /* 💳 Load plan */
  useEffect(() => {
    if (!user) {
      setPlan("free");
      return;
    }

    async function loadPlan() {
  if (!user) return; // ✅ tell TS user is not null

  try {
    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      setPlan(snap.data().plan || "free");
    } else {
      setPlan("free");
    }
  } catch (err) {
    console.error("Plan load failed:", err);
    setPlan("free");
  }
}


    loadPlan();
  }, [user]);

  /* ---------------- Actions ---------------- */

  async function signInWithEmail(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function signInWithGoogle() {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      await setDoc(ref, {
        email: user.email,
        plan: "free",
        createdAt: new Date(),
      });
    }
  }

  async function signOut() {
    await firebaseSignOut(auth);
  }

  async function getIdToken(forceRefresh = false) {
    if (!auth.currentUser) return null;
    return auth.currentUser.getIdToken(forceRefresh);
  }

  async function sendPasswordReset() {
    if (!auth.currentUser?.email) return;
    await sendPasswordResetEmail(auth, auth.currentUser.email);
  }

  /* ---------------- Context value ---------------- */

  const value = useMemo(
    () => ({
      user,
      loading,
      plan,
      signInWithEmail,
      signInWithGoogle,
      signOut,
      getIdToken,
      sendPasswordReset,
    }),
    [user, loading, plan]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/* ----------------------------------------
   Hook
----------------------------------------- */

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}
