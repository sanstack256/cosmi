"use client";

import { PayPalScriptProvider } from "@paypal/react-paypal-js";

export default function PayPalProvider({
  children,
}: {
  children: React.ReactNode;
}) {

  const options = {
    clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!,
    currency: "USD",
    intent: "capture",
  };

  return (
    <PayPalScriptProvider options={options}>
      {children}
    </PayPalScriptProvider>
  );
}