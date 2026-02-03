import "./globals.css";
import ProvidersWrapper from "./ProvidersWrapper";
import Script from "next/script";


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
      <body>
        {/* ✅ Load Lordicon globally */}
        <Script
          src="https://cdn.lordicon.com/lordicon.js"
          strategy="beforeInteractive"
        />


        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="beforeInteractive"
        />


        <ProvidersWrapper>
          <div className="animate-cosmi-fade">
            {children}
          </div>
        </ProvidersWrapper>
      </body>
    </html>
  );
}
