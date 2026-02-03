"use client";

import React from "react";
import { AuthProvider, useAuth } from "./providers/AuthProvider";
import { InvoiceProvider } from "./providers/InvoiceProvider";

function ProvidersGate({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        Loading…
      </div>
    );
  }

  return <InvoiceProvider>{children}</InvoiceProvider>;
}

export default function ProvidersWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <ProvidersGate>{children}</ProvidersGate>
    </AuthProvider>
  );
}
