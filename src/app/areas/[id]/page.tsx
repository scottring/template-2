'use client';

import { useEffect, useState } from 'react';
import { doc, onSnapshot, query, collection, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { Area, Goal } from '@/types/models';
import { useRouter } from 'next/navigation';
import { ArrowLeft, PlusIcon, MoreVertical } from 'lucide-react';
import { useGoalStore } from '@/lib/stores/useGoalStore';
import { CreateGoalDialog } from '@/components/goals/CreateGoalDialog';
import { EditGoalDialog } from '@/components/goals/EditGoalDialog';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';

export default function AreaDetailPage({ params }: { params: { id: string } }) {
  const [area, setArea] = useState<Area | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const router = useRouter();
  const { goals, setGoals, deleteGoal } = useGoalStore();
  const areaGoals = goals.filter((goal) => goal.areaId === params.id);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'areas', params.id), (doc) => {
      if (doc.exists()) {
        setArea({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
        } as Area);
      } else {
        router.push('/areas');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [params.id, router]);

  useEffect(() => {
    const q = query(collection(db, 'goals'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const goals = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        targetDate: doc.data().targetDate?.toDate(),
      })) as Goal[];
      setGoals(goals);
    });

    return () => unsubscribe();
  }, [setGoals]);

  const handleDeleteGoal = async (goalId: string) => {
    if (window.confirm('Are you sure you want to delete this goal? This action cannot be undone.')) {
      try {
        await deleteGoal(goalId);
      } catch (error) {
        console.error('Error deleting goal:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
      </div>
    );
  }

  if (!area) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-x-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-full p-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{area.name}</h1>
          <p className="mt-1 text-sm text-gray-500">{area.description}</p>
        </div>
        <div className="ml-auto">
          <button
            type="button"
            onClick={() => setIsCreateDialogOpen(true)}
            className="inline-flex items-center gap-x-2 rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <PlusIcon className="-ml-0.5 h-5 w-5" aria-hidden="true" />
            New Goal
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {areaGoals.map((goal) => (
          <div
            key={goal.id}
            className="relative flex flex-col overflow-hidden rounded-lg border bg-white shadow-sm"
          >
            <div className="absolute right-4 top-4">
              <Menu as="div" className="relative inline-block text-left">
                <Menu.Button className="flex items-center rounded-full bg-white text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                  <span className="sr-only">Open options</span>
                  <MoreVertical className="h-5 w-5" aria-hidden="true" />
                </Menu.Button>
                <Transition
                  as={Fragment}
                  show={true}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="py-1">
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={() => setEditingGoal(goal)}
                            className={`${
                              active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                            } block w-full px-4 py-2 text-left text-sm`}
                          >
                            Edit
                          </button>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={() => handleDeleteGoal(goal.id)}
                            className={`${
                              active ? 'bg-red-50 text-red-900' : 'text-red-700'
                            } block w-full px-4 py-2 text-left text-sm`}
                          >
                            Delete
                          </button>
                        )}
                      </Menu.Item>
                    </div>
                  </Menu.Items>
                </Transition>
              </Menu>
            </div>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900">
                {goal.name}
              </h3>
              <p className="mt-2 text-sm text-gray-500">{goal.description}</p>
              <div className="mt-4">
                <div className="relative h-2 overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="absolute inset-y-0 left-0 bg-blue-600 transition-all duration-300"
                    style={{ width: `${goal.progress}%` }}
                  />
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  {goal.progress}% complete
                </p>
              </div>
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-900">Success Criteria:</h4>
                <ul className="mt-2 space-y-1">
                  {goal.successCriteria.map((criteria, index) => (
                    <li key={index} className="text-sm text-gray-500">
                      • {criteria.text}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="mt-auto flex divide-x border-t">
              <button
                type="button"
                onClick={() => router.push(`/goals/${goal.id}`)}
                className="flex w-full items-center justify-center gap-x-2.5 p-3 text-sm font-semibold text-gray-900 hover:bg-gray-50"
              >
                View Details
              </button>
            </div>
          </div>
        ))}

        {areaGoals.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center">
            <h3 className="mt-2 text-sm font-semibold text-gray-900">
              No goals defined
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new goal for this area
            </p>
            <button
              type="button"
              onClick={() => setIsCreateDialogOpen(true)}
              className="mt-6 inline-flex items-center gap-x-2 rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              <PlusIcon className="-ml-0.5 h-5 w-5" aria-hidden="true" />
              New Goal
            </button>
          </div>
        )}
      </div>

      <CreateGoalDialog
        areaId={area.id}
        open={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
      />

      {editingGoal && (
        <EditGoalDialog
          goal={editingGoal}
          open={true}
          onClose={() => setEditingGoal(null)}
        />
      )}
    </div>
  );
} 