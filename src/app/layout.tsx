import { Inter } from 'next/font/google';
import './globals.css';
import { RootProvider } from '@/components/providers/RootProvider';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: `SymphGoal-${process.env.NEXT_PUBLIC_ENV === 'production' ? 'Prod' : 'Dev'}`,
  description: 'A powerful tool for collaborative life planning and goal achievement.',
};

function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <RootProvider>
      {children}
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
    <html lang="en">
      <body className={inter.className}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
