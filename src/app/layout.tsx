import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { RootProvider } from "@/components/providers/RootProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Symphony - Orchestrate Your Life",
  description: "Transform your goals into achievable actions with Symphony",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full`}>
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
