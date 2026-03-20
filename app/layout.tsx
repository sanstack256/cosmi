import "./globals.css";
import ProvidersWrapper from "./ProvidersWrapper";
import Script from "next/script";
import { Toaster } from "sonner";
import PayPalProvider from "./providers/PayPalProvider";

export const metadata = {
  title: "Cosmi",
  description: "Cosmi App",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script src="https://cdn.lordicon.com/lordicon.js"></script>
      </head>

      <body>

        {/* Lordicon */}
        <Script
          src="https://cdn.lordicon.com/lordicon.js"
          strategy="beforeInteractive"
        />

        {/* Razorpay */}
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="beforeInteractive"
        />

        {/* PayPal Provider (Client Component) */}
        <PayPalProvider>

          <ProvidersWrapper>
            <div className="animate-cosmi-fade">
              {children}
            </div>
          </ProvidersWrapper>

        </PayPalProvider>

        {/* Global Toasts */}
        <Toaster
          position="top-right"
          richColors
          closeButton
        />

      </body>
    </html>
  );
}