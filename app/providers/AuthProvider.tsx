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

import { ToastProvider } from "./ToastProvider"



/* ----------------------------------------
   Types
----------------------------------------- */

type PlanType = "free" | "pro" | "business";

type AuthCtx = {
  user: User | null;
  loading: boolean;
  userData: any;

  plan: PlanType;
  isPro: boolean;
  isBusiness: boolean;
  planLoaded: boolean;

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
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<PlanType>("free");
  const [planLoaded, setPlanLoaded] = useState(false);

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
      setPlanLoaded(true);
      return;
    }

    async function loadPlan() {
      if (!user) return;

      try {
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          const rawPlan = snap.data().plan;

          if (rawPlan === "pro" || rawPlan === "business") {
            setPlan(rawPlan);
          } else {
            setPlan("free");
          }
        } else {
          setPlan("free");
        }
      } catch (err) {
        console.error("Plan load failed:", err);
        setPlan("free");
      } finally {
        setPlanLoaded(true);
      }
    }


    loadPlan();
  }, [user]);

  //Load user data from firestore
  useEffect(() => {
    if (!user) {
      setUserData(null);
      return;
    }

    const currentUser = user;


    async function loadUserData() {
      try {
        const ref = doc(db, "users", currentUser.uid);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          setUserData(snap.data());
        } else {
          setUserData(null);
        }
      } catch (err) {
        console.error("User data load failed:", err);
        setUserData(null);
      }
    }

    loadUserData();
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
    () => {
      const isPro = plan === "pro" || plan === "business";
      const isBusiness = plan === "business";

      return {
        user,
        loading,
        userData,

        plan,
        isPro,
        isBusiness,
        planLoaded,

        signInWithEmail,
        signInWithGoogle,
        signOut,
        getIdToken,
        sendPasswordReset,
      };
    },
    [user, loading, plan, planLoaded, userData]
  );

  return (
    <ToastProvider>
      <AuthContext.Provider value={value}>
        {children}
      </AuthContext.Provider>
    </ToastProvider>
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
