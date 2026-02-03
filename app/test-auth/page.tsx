"use client";
import { useAuth } from "@/app/providers/AuthProvider";

export default function TestAuth() {
  const { user, loading } = useAuth();

  return (
    <div className="text-white p-10">
      <h1 className="text-xl">Auth State Test</h1>

      <p>Loading: {String(loading)}</p>
      <p>User: {user ? user.email : "null"}</p>
    </div>
  );
}
