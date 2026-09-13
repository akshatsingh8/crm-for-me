import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "crm for me",
  description: "A simple CRM for real estate leads and follow-ups",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
