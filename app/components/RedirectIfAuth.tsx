// app/components/RedirectIfAuth.tsx
"use client";

import React, { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/providers/AuthProvider";

export default function RedirectIfAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [loading, user, router]);

  // If logged in we won't show the children (the effect will redirect).
  // If loading or not authed, show the children (e.g. sign-in form).
  if (loading || user) {
    // show a tiny placeholder while auth state resolves or redirect happens
    return (
      <div style={{ padding: 24, minHeight: "200px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div>Loading…</div>
      </div>
    );
  }

  return <>{children}</>;
}
