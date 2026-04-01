import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ProposalGen — AI-Powered Proposals",
  description:
    "Generate, send, and manage professional proposals with AI. Get signatures and payments in one flow.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
