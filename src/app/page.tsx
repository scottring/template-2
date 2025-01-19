'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useAreaStore from '@/lib/stores/useAreaStore';
import { CycleVisualizer } from '@/components/dashboard/CycleVisualizer';

export default function OnboardingPage() {
  const router = useRouter();
  const { addArea } = useAreaStore();
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    try {
      await addArea({
        name: formData.name,
        description: formData.description,
        color: '#4F46E5', // Default indigo color
        icon: 'Home', // Default icon
        householdId: 'TODO', // TODO: Get from auth context
        createdBy: 'TODO', // TODO: Get from auth context
        updatedBy: 'TODO' // TODO: Get from auth context
      });
      router.push('/dashboard');
    } catch (error) {
      console.error('Error creating area:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">Welcome!</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Let&#39;s start by creating your first area
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium">
                Area Name
              </label>
              <input
                id="name"
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2"
                placeholder="e.g. Home, Work, Personal"
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium">
                Description
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2"
                placeholder="What is this area for?"
                rows={3}
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Create Area
          </button>
        </form>
      </div>
    </div>
  );
}
