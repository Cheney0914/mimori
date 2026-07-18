import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./wiring.css";
import { OfflineRegistration } from "@/components/offline-registration";

export const metadata: Metadata = { title: "Mimori — Language Atlas", description: "A language atlas for real life", manifest: "/manifest.webmanifest" };
export const viewport: Viewport = { themeColor: "#f8f7f3", width: "device-width", initialScale: 1 };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><OfflineRegistration />{children}</body></html>;
}
