'use client';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AuthProvider } from '@/lib/contexts/AuthContext';
import { TooltipProvider } from '@/components/ui/tooltip';

interface RootProviderProps {
  children: React.ReactNode;
}

export function RootProvider({ children }: RootProviderProps) {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <TooltipProvider>
          {children}
        </TooltipProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
} 