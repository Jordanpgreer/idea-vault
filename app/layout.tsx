import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

export const metadata: Metadata = {
  title: "Idea Vault",
  description: "Paid business idea submissions with private review workflows."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ClerkProvider>
          <SiteHeader />
          <main style={{ padding: "1rem 0 2rem" }}>{children}</main>
        </ClerkProvider>
      </body>
    </html>
  );
}
