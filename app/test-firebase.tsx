// app/test-firebase.tsx
"use client";

import React, { useEffect } from "react";
import { auth } from "@/lib/firebase";

export default function TestFirebase() {
  useEffect(() => {
    try {
      console.log("Firebase auth loaded:", !!auth);
    } catch (error) {
      console.error("Firebase init error:", error);
    }
  }, []);

  return (
    <div style={{ marginTop: "20px" }}>
      This component ran. Check the browser console for:
      <br />
      <strong>Firebase auth loaded: true</strong>
    </div>
  );
}