import type { Metadata, Viewport } from "next";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import "./globals.css";

export const metadata: Metadata = {
  title: "Freelance CRM",
  description: "CRM, project, income, follow-up, and document tracker for freelancers.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#0f3d91",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
