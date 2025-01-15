'use client';

import { usePathname } from 'next/navigation';
import { AuthProvider } from "@/lib/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { ErrorBoundary } from "@/components/error/ErrorBoundary";

interface RootProviderProps {
  children: React.ReactNode;
}

export function RootProvider({ children }: RootProviderProps) {
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith('/auth/');

  return (
    <AuthProvider>
      <ErrorBoundary>
        {isAuthPage ? (
          children
        ) : (
          <ProtectedRoute>
            <Dashboard>{children}</Dashboard>
          </ProtectedRoute>
        )}
      </ErrorBoundary>
    </AuthProvider>
  );
} 