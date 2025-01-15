'use client';

import { AuthProvider } from "@/lib/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { ErrorBoundary } from "@/components/error/ErrorBoundary";

interface RootProviderProps {
  children: React.ReactNode;
}

export function RootProvider({ children }: RootProviderProps) {
  return (
    <AuthProvider>
      <ErrorBoundary>
        <ProtectedRoute>
          <Dashboard>{children}</Dashboard>
        </ProtectedRoute>
      </ErrorBoundary>
    </AuthProvider>
  );
} 