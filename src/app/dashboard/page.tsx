'use client';

import { CycleVisualizer } from '@/components/dashboard/CycleVisualizer';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-gray-900 mb-8">
            Dashboard
          </h1>
          
          {/* Cycle Visualizer */}
          <div className="mb-12 border-2 border-blue-500 p-4">
            <h2 className="text-xl font-semibold mb-4">Your Household Journey</h2>
            <CycleVisualizer />
          </div>
          
          {/* Additional dashboard content can go here */}
        </div>
      </main>
    </div>
  );
} 