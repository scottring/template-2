'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Menu, Transition } from "@headlessui/react";
import { Fragment } from "react";
import {
  ArrowLeft,
  Calendar,
  MoreVertical,
  PlusIcon,
  Share2,
  Target,
  Trash2,
} from "lucide-react";
import useGoalStore from "@/lib/stores/useGoalStore";
import { useProjectStore } from "@/lib/stores/useProjectStore";
import { Goal, Project, SuccessCriteria } from "@/types/models";
import { CreateProjectDialog } from "@/components/projects/CreateProjectDialog";
import { ShareDialog } from "@/components/shared/ShareDialog";
import { SharedIndicator } from "@/components/shared/SharedIndicator";
import { TasksSection } from "@/components/goals/TasksSection";
import { Notepad } from "@/components/shared/Notepad";

export default function GoalDetailPage({ params }: { params: { id: string } }) {
  const [isCreateProjectDialogOpen, setIsCreateProjectDialogOpen] = useState(false);
  const [sharingGoal, setSharingGoal] = useState<Goal | null>(null);
  const router = useRouter();
  
  const { goals, loading, error } = useGoalStore();
  const { projects, setProjects } = useProjectStore();
  const goal = goals.find((g: Goal) => g.id === params.id);
  const goalProjects = projects.filter((project: Project) => project.goalId === params.id);

  // If we're not loading and there's no goal, redirect
  useEffect(() => {
    if (!loading && !goal) {
      router.push('/goals');
    }
  }, [goal, loading, router]);

  const handleDeleteGoal = async () => {
    if (!goal) return;
    
    if (window.confirm('Are you sure you want to delete this goal? This action cannot be undone.')) {
      try {
        await useGoalStore.getState().deleteGoal(goal.id);
        router.push('/goals');
      } catch (error) {
        console.error('Error deleting goal:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-t-2 border-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-red-500">Error loading goal: {error}</div>
      </div>
    );
  }

  if (!goal) {
    return null;
  }

  // Rest of the component remains the same...
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-x-4">
          <button
            onClick={() => router.back()}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold">{goal.name}</h1>
            <div className="flex items-center gap-x-2 text-sm text-gray-500">
              <Calendar className="h-4 w-4" />
              <span>Due {goal.targetDate?.toLocaleDateString()}</span>
              <Target className="ml-2 h-4 w-4" />
              <span>{goal.progress}% complete</span>
              <SharedIndicator sharedWith={goal.assignedTo} />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-x-2">
          <button
            onClick={() => setIsCreateProjectDialogOpen(true)}
            className="inline-flex items-center gap-x-1.5 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <PlusIcon className="-ml-0.5 h-5 w-5" aria-hidden="true" />
            New Project
          </button>

          <Menu as="div" className="relative">
            <Menu.Button className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500">
              <MoreVertical className="h-5 w-5" />
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
              <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => setSharingGoal(goal)}
                      className={`${
                        active ? 'bg-gray-100' : ''
                      } flex w-full items-center px-4 py-2 text-sm text-gray-700`}
                    >
                      <Share2 className="mr-3 h-5 w-5 text-gray-400" aria-hidden="true" />
                      Share
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={handleDeleteGoal}
                      className={`${
                        active ? 'bg-gray-100' : ''
                      } flex w-full items-center px-4 py-2 text-sm text-red-700`}
                    >
                      <Trash2 className="mr-3 h-5 w-5 text-red-400" aria-hidden="true" />
                      Delete
                    </button>
                  )}
                </Menu.Item>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="overflow-hidden rounded-lg border bg-white shadow">
            <div className="p-6">
              <h2 className="text-base font-semibold">Description</h2>
              <p className="mt-2 text-sm text-gray-600">{goal.description}</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border bg-white shadow">
            <div className="p-6">
              <h2 className="text-base font-semibold">Success Criteria</h2>
              <ul className="mt-2 space-y-2">
                {goal.successCriteria.map((criteria: SuccessCriteria, index: number) => (
                  <li key={index} className="flex items-start gap-x-3 text-sm">
                    <div className="relative mt-1 flex h-5 w-5 items-center justify-center">
                      <div className="h-4 w-4 rounded-full border-2" />
                    </div>
                    <span className="text-gray-600">{criteria.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border bg-white shadow">
            <div className="p-6">
              <h2 className="text-base font-semibold">Projects</h2>
              <div className="mt-2 space-y-2">
                {goalProjects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between rounded-md border bg-white p-4 shadow-sm"
                  >
                    <div>
                      <h3 className="font-medium">{project.name}</h3>
                      <p className="text-sm text-gray-500">{project.description}</p>
                    </div>
                    <button
                      onClick={() => router.push(`/projects/${project.id}`)}
                      className="rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                    >
                      View
                    </button>
                  </div>
                ))}
                {goalProjects.length === 0 && (
                  <p className="text-sm text-gray-500">No projects yet</p>
                )}
              </div>
            </div>
          </div>

          <TasksSection goalId={goal.id} />
        </div>

        <div className="space-y-6">
          <Notepad initialContent="" />
        </div>
      </div>

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
