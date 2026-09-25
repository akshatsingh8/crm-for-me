import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Udachi CRM",
  applicationName: "Udachi CRM",
  description: "Udachi CRM helps manage real estate leads and follow-ups.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
