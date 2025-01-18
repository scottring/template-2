'use client';

import { WeeklyReview } from '@/app/components/WeeklyReview';
import { useRouter } from 'next/navigation';

export default function ReviewPage() {
  const router = useRouter();

  const handleComplete = () => {
    router.push('/dashboard');
  };

  return (
    <div className="container mx-auto py-8">
      <WeeklyReview onComplete={handleComplete} />
    </div>
  );
} 