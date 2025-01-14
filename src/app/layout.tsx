import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Dashboard from "@/components/dashboard/Dashboard";
import { ErrorBoundary } from "@/components/error/ErrorBoundary";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FamilyGoals - Collaborative Life Planning",
  description: "Transform your family's aspirations into achievable actions",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full`}>
        <AuthProvider>
          <ErrorBoundary>
            <ProtectedRoute>
              <Dashboard>{children}</Dashboard>
            </ProtectedRoute>
          </ErrorBoundary>
        </AuthProvider>
      </body>
    </html>
  );
}
