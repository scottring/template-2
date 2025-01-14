'use client';

import { useEffect, useState } from 'react';
import { doc, onSnapshot, query, collection, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { Project, Task } from '@/types/models';
import { useRouter } from 'next/navigation';
import { ArrowLeft, PlusIcon, MoreVertical, Calendar, CheckCircle2, ListTodo } from 'lucide-react';
import { useProjectStore } from '@/lib/stores/useProjectStore';
import { useTaskStore } from '@/lib/stores/useTaskStore';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { EditProjectDialog } from '@/components/projects/EditProjectDialog';
import { CreateTaskDialog } from '@/components/tasks/CreateTaskDialog';

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateTaskDialogOpen, setIsCreateTaskDialogOpen] = useState(false);
  const router = useRouter();
  const { deleteProject } = useProjectStore();
  const { tasks, setTasks, toggleTaskCompletion } = useTaskStore();
  const projectTasks: Task[] = tasks.filter((task: Task) => task.projectId === params.id);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'projects', params.id), (doc) => {
      if (doc.exists()) {
        setProject({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
          startDate: doc.data().startDate?.toDate(),
          endDate: doc.data().endDate?.toDate(),
        } as Project);
      } else {
        router.push('/goals');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [params.id, router]);

  useEffect(() => {
    const q = query(collection(db, 'tasks'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tasks = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        dueDate: doc.data().dueDate?.toDate(),
      })) as Task[];
      setTasks(tasks);
    });

    return () => unsubscribe();
  }, [setTasks]);

  const handleDeleteProject = async () => {
    if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      try {
        await deleteProject(project!.id);
        router.push(`/goals/${project!.goalId}`);
      } catch (error) {
        console.error('Error deleting project:', error);
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

  if (!project) {
    return null;
  }

  const completedTasks = projectTasks.filter((task) => task.isCompleted);
  const progress = projectTasks.length > 0
    ? Math.round((completedTasks.length / projectTasks.length) * 100)
    : 0;

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
          <h1 className="text-2xl font-semibold text-gray-900">{project.name}</h1>
          <p className="mt-1 text-sm text-gray-500">{project.description}</p>
        </div>
        <div className="flex items-center gap-x-2">
          <button
            type="button"
            onClick={() => setIsCreateTaskDialogOpen(true)}
            className="inline-flex items-center gap-x-2 rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <PlusIcon className="-ml-0.5 h-5 w-5" aria-hidden="true" />
            New Task
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
                        Edit Project
                      </button>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={handleDeleteProject}
                        className={`${
                          active ? 'bg-red-50 text-red-900' : 'text-red-700'
                        } block w-full px-4 py-2 text-left text-sm`}
                      >
                        Delete Project
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
                  {progress}% Complete
                </span>
              </div>
              <div className="mt-4">
                <div className="relative h-2 overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="absolute inset-y-0 left-0 bg-blue-600 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg bg-white shadow">
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900">Tasks</h2>
              <div className="mt-6 divide-y divide-gray-200">
                {projectTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between py-4">
                    <div className="flex items-start gap-x-3">
                      <button
                        type="button"
                        onClick={() => toggleTaskCompletion(task.id)}
                        className={`flex-none rounded-full p-1 ${
                          task.isCompleted
                            ? 'bg-blue-500 text-white hover:bg-blue-600'
                            : 'text-gray-400 hover:bg-gray-100'
                        }`}
                      >
                        <CheckCircle2 className="h-5 w-5" />
                      </button>
                      <div>
                        <h3 className={`text-sm font-medium ${task.isCompleted ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                          {task.name}
                        </h3>
                        <p className={`mt-1 text-sm ${task.isCompleted ? 'line-through text-gray-400' : 'text-gray-500'}`}>
                          {task.description}
                        </p>
                        {task.dueDate && (
                          <p className="mt-1 text-sm text-gray-500">
                            Due by {task.dueDate.toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {projectTasks.length === 0 && (
                  <div className="py-4 text-center text-sm text-gray-500">
                    No tasks yet. Create one to get started!
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="overflow-hidden rounded-lg bg-white shadow">
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900">Details</h2>
              <dl className="mt-4 space-y-4">
                <div className="flex items-center gap-x-4">
                  <dt className="flex-shrink-0">
                    <Calendar className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </dt>
                  <dd className="text-sm text-gray-900">
                    {project.startDate.toLocaleDateString()} - {project.endDate.toLocaleDateString()}
                  </dd>
                </div>
                <div className="flex items-center gap-x-4">
                  <dt className="flex-shrink-0">
                    <ListTodo className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </dt>
                  <dd className="text-sm text-gray-900">
                    {completedTasks.length} of {projectTasks.length} tasks completed
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {isEditDialogOpen && (
        <EditProjectDialog
          project={project}
          open={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
        />
      )}

      <CreateTaskDialog
        projectId={project.id}
        open={isCreateTaskDialogOpen}
        onClose={() => setIsCreateTaskDialogOpen(false)}
      />
    </div>
  );
} 