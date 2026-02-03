// app/signout/page.tsx
"use client";

import { useAuth } from "@/app/providers/AuthProvider";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SignOutPage() {
  const { signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        await signOut();
        router.replace("/"); // redirect to landing page
      } catch (e) {
        console.error("Signout error:", e);
      }
    })();
  }, [router, signOut]);

  return <div style={{ padding: 24 }}>Signing out…</div>;
}
