'use client';

import { useEffect, useState } from 'react';
import { doc, onSnapshot, query, collection, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { Goal, Project } from '@/types/models';
import { useRouter } from 'next/navigation';
import { ArrowLeft, PlusIcon, MoreVertical, Calendar, Target, CheckCircle, Share2 } from 'lucide-react';
import { useGoalStore } from '@/lib/stores/useGoalStore';
import { useProjectStore } from '@/lib/stores/useProjectStore';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { EditGoalDialog } from '@/components/goals/EditGoalDialog';
import { CreateProjectDialog } from '@/components/projects/CreateProjectDialog';
import { TasksSection } from '@/components/goals/TasksSection';
import { Notepad } from '@/components/shared/Notepad';
import { SharedIndicator } from '@/components/shared/SharedIndicator';
import { ShareDialog } from '@/components/shared/ShareDialog';

export default function GoalDetailPage({ params }: { params: { id: string } }) {
  const [goal, setGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateProjectDialogOpen, setIsCreateProjectDialogOpen] = useState(false);
  const [sharingGoal, setSharingGoal] = useState<Goal | null>(null);
  const router = useRouter();
  const { deleteGoal } = useGoalStore();
  const { projects, setProjects } = useProjectStore();
  const goalProjects: Project[] = projects.filter((project: Project) => project.goalId === params.id);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'goals', params.id), (doc) => {
      if (doc.exists()) {
        setGoal({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
          targetDate: doc.data().targetDate?.toDate(),
        } as Goal);
      } else {
        router.push('/areas');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [params.id, router]);

  useEffect(() => {
    const q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projects = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        startDate: doc.data().startDate?.toDate(),
        endDate: doc.data().endDate?.toDate(),
      })) as Project[];
      setProjects(projects);
    });

    return () => unsubscribe();
  }, [setProjects]);

  const handleDeleteGoal = async () => {
    if (window.confirm('Are you sure you want to delete this goal? This action cannot be undone.')) {
      try {
        await deleteGoal(goal!.id);
        router.push('/areas');
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

  if (!goal) {
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
        <div className="flex-grow">
          <div className="flex items-center gap-x-3">
            <h1 className="text-2xl font-semibold text-gray-900">{goal.name}</h1>
            <SharedIndicator sharedWith={goal.assignedTo} />
          </div>
          <p className="mt-1 text-sm text-gray-500">{goal.description}</p>
        </div>
        <div className="flex items-center gap-x-2">
          <button
            type="button"
            onClick={() => setIsCreateProjectDialogOpen(true)}
            className="inline-flex items-center gap-x-2 rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <PlusIcon className="-ml-0.5 h-5 w-5" aria-hidden="true" />
            New Project
          </button>
          <button
            type="button"
            onClick={() => setSharingGoal(goal)}
            className="inline-flex items-center gap-x-2 rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            <Share2 className="-ml-0.5 h-5 w-5" aria-hidden="true" />
            Share
          </button>
          <Menu as="div" className="relative inline-block text-left">
            <Menu.Button className="flex items-center rounded-full bg-white p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
              <span className="sr-only">Open options</span>
              <MoreVertical className="h-5 w-5" aria-hidden="true" />
            </Menu.Button>
            <Transition
              as={Fragment}
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
                        onClick={() => setIsEditDialogOpen(true)}
                        className={`${
                          active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                        } block w-full px-4 py-2 text-left text-sm`}
                      >
                        Edit Goal
                      </button>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={handleDeleteGoal}
                        className={`${
                          active ? 'bg-red-50 text-red-900' : 'text-red-700'
                        } block w-full px-4 py-2 text-left text-sm`}
                      >
                        Delete Goal
                      </button>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="overflow-hidden rounded-lg bg-white shadow">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900">Progress</h2>
                <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-sm font-medium text-blue-800">
                  {goal.progress}% Complete
                </span>
              </div>
              <div className="mt-4">
                <div className="relative h-2 overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="absolute inset-y-0 left-0 bg-blue-600 transition-all duration-300"
                    style={{ width: `${goal.progress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <TasksSection goalId={params.id} />

          <div className="overflow-hidden rounded-lg bg-white shadow">
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 flex items-center justify-between">
                Projects
                <button
                  type="button"
                  onClick={() => setIsCreateProjectDialogOpen(true)}
                  className="inline-flex items-center rounded-md bg-blue-600 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                  <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                  New Project
                </button>
              </h2>
              <div className="mt-6 divide-y divide-gray-200">
                {goalProjects.map((project: Project) => (
                  <div key={project.id} className="flex items-center justify-between py-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">{project.name}</h3>
                      <p className="mt-1 text-sm text-gray-500">{project.description}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => router.push(`/projects/${project.id}`)}
                      className="inline-flex items-center rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                    >
                      View Details
                    </button>
                  </div>
                ))}
                {goalProjects.length === 0 && (
                  <div className="py-4 text-center text-sm text-gray-500">
                    No projects yet. Create one to get started!
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="overflow-hidden rounded-lg bg-white shadow">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900">Details</h2>
                <button
                  type="button"
                  onClick={() => setIsEditDialogOpen(true)}
                  className="inline-flex items-center gap-x-2 rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                >
                  Edit Details
                </button>
              </div>
              <dl className="mt-4 space-y-4">
                <div className="flex items-center gap-x-4">
                  <dt className="flex-shrink-0">
                    <Calendar className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </dt>
                  <dd className="text-sm text-gray-900">
                    Due by {goal.targetDate.toLocaleDateString()}
                  </dd>
                </div>
                <div>
                  <dt className="flex items-center gap-x-4">
                    <Target className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    <span className="text-sm font-medium text-gray-900">Success Criteria</span>
                  </dt>
                  <dd className="mt-2 text-sm text-gray-500">
                    <ul className="space-y-2">
                      {goal.successCriteria.map((criteria, index) => (
                        <li key={index} className="flex items-start gap-x-2">
                          <CheckCircle className="h-5 w-5 text-gray-400" aria-hidden="true" />
                          <span>{criteria}</span>
                        </li>
                      ))}
                    </ul>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {isEditDialogOpen && (
        <EditGoalDialog
          goal={goal}
          open={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
        />
      )}

      <CreateProjectDialog
        goalId={goal.id}
        open={isCreateProjectDialogOpen}
        onClose={() => setIsCreateProjectDialogOpen(false)}
      />

      {sharingGoal && (
        <ShareDialog
          open={true}
          onClose={() => setSharingGoal(null)}
          itemType="goals"
          itemId={sharingGoal.id}
          itemName={sharingGoal.name}
        />
      )}
    </div>
  );
}
