import { Inter } from 'next/font/google';
import './globals.css';
import { RootProvider } from '@/components/providers/RootProvider';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import { TopBar } from '@/components/dashboard/TopBar';
import { Navigation } from '@/components/dashboard/Navigation';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: `SymphGoal-${process.env.NEXT_PUBLIC_ENV === 'production' ? 'Prod' : 'Dev'}`,
  description: 'A powerful tool for collaborative life planning and goal achievement.',
};

function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <RootProvider>
      <div className="min-h-screen bg-background">
        <div className="flex h-screen">
          <aside className="w-64 flex-shrink-0 fixed left-0 top-0 h-full">
            <div className="h-16 flex items-center px-6">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent-foreground bg-clip-text text-transparent">Symphony</h1>
            </div>
            <Navigation />
          </aside>
          <div className="flex-1 ml-64">
            <TopBar />
            <main className="pt-16">
              <div className="container max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                {children}
              </div>
            </main>
          </div>
        </div>
        <div className="fixed inset-0 -z-10 bg-[radial-gradient(45%_45%_at_50%_50%,var(--primary-muted)_0%,transparent_100%)] opacity-20" />
      </div>
      <Toaster />
    </RootProvider>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="antialiased">
      <body className={cn(inter.className, "min-h-screen bg-background font-sans")}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
