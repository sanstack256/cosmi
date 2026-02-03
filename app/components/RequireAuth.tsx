// app/components/RequireAuth.tsx
"use client";

import React, { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/providers/AuthProvider";

export default function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If auth finished loading and there's no user, redirect to signin
    if (!loading && !user) {
      router.replace("/signin");
    }
  }, [loading, user, router]);

  // While auth is initialising show a simple placeholder to avoid flashing content
  if (loading || !user) {
    return (
      <div style={{ padding: 24, minHeight: "200px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div>Loading…</div>
      </div>
    );
  }

  // user present — render protected page
  return <>{children}</>;
}
