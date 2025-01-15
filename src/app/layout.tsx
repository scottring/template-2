import { Inter } from 'next/font/google';
import { RootProvider } from '@/components/providers/RootProvider';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Symphony Planner',
  description: 'A family task management and planning tool',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <RootProvider>
          <Dashboard>
            {children}
          </Dashboard>
          <Toaster />
        </RootProvider>
      </body>
    </html>
  );
}
