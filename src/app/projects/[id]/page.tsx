'use client';

import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { Project, Task } from '@/types/models';
import { useRouter } from 'next/navigation';
import { ArrowLeft, PlusIcon, MoreVertical, Calendar, CheckCircle2, ListTodo, Share2, Loader2 } from 'lucide-react';
import { useProjectStore } from '@/lib/stores/useProjectStore';
import useTaskStore from '@/lib/stores/useTaskStore';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { EditProjectDialog } from '@/components/projects/EditProjectDialog';
import { CreateTaskDialog } from '@/components/tasks/CreateTaskDialog';
import { SharedIndicator } from '@/components/shared/SharedIndicator';
import { ShareDialog } from '@/components/shared/ShareDialog';
import { useAuth } from '@/lib/hooks/useAuth';

export default function ProjectPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateTaskDialogOpen, setIsCreateTaskDialogOpen] = useState(false);
  const [isSharingDialogOpen, setIsSharingDialogOpen] = useState(false);
  
  const tasks = useTaskStore(state => state.tasks);
  const completeTask = useTaskStore(state => state.completeTask);
  
  useEffect(() => {
    if (!user?.householdId) {
      setIsLoading(false);
      return;
    }
    
    const unsubscribe = onSnapshot(
      doc(db, 'projects', params.id),
      (doc) => {
        if (doc.exists()) {
          setProject({ ...doc.data(), id: doc.id } as Project);
        } else {
          router.push('/projects');
        }
        setIsLoading(false);
      },
      (error) => {
        console.error('Error fetching project:', error);
        router.push('/projects');
        setIsLoading(false);
      }
    );

    return () => {
      unsubscribe();
      setIsLoading(true);
    };
  }, [params.id, router, user?.householdId]);

  const projectTasks = tasks.filter(task => task.goalId === params.id);

  const handleTaskCompletion = async (taskId: string) => {
    if (!user) return;
    try {
      await completeTask(taskId, user.uid);
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-muted-foreground">Project not found</p>
        <button
          onClick={() => router.push('/projects')}
          className="text-sm text-primary hover:underline"
        >
          Return to Projects
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/projects')}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Back to projects"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold">{project.name}</h1>
              <p className="text-muted-foreground">{project.description}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCreateTaskDialogOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              <PlusIcon className="h-4 w-4" />
              Add Task
            </button>
            
            <Menu as="div" className="relative">
              <Menu.Button className="p-2 hover:bg-muted rounded-md transition-colors">
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
                <Menu.Items className="absolute right-0 mt-2 w-48 bg-popover border rounded-md shadow-lg focus:outline-none">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => setIsEditDialogOpen(true)}
                        className={`${
                          active ? 'bg-muted' : ''
                        } flex w-full items-center px-4 py-2 text-sm`}
                      >
                        Edit Project
                      </button>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => setIsSharingDialogOpen(true)}
                        className={`${
                          active ? 'bg-muted' : ''
                        } flex w-full items-center px-4 py-2 text-sm`}
                      >
                        Share Project
                      </button>
                    )}
                  </Menu.Item>
                </Menu.Items>
              </Transition>
            </Menu>
          </div>
        </div>

        {/* Project Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            {/* Tasks */}
            <div className="bg-card border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Tasks</h2>
              </div>
              
              <div className="space-y-4">
                {projectTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => handleTaskCompletion(task.id)}
                        className={`p-1 rounded-full transition-colors ${
                          task.status === 'completed'
                            ? 'text-primary bg-primary/10'
                            : 'text-muted-foreground hover:text-primary hover:bg-primary/10'
                        }`}
                        aria-label={task.status === 'completed' ? "Mark task as incomplete" : "Mark task as complete"}
                      >
                        <CheckCircle2 className="h-5 w-5" />
                      </button>
                      <div>
                        <h3 className="font-medium">{task.title}</h3>
                        {task.description && (
                          <p className="text-sm text-muted-foreground">
                            {task.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {projectTasks.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <ListTodo className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No tasks yet. Add your first task to get started.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div>
            {/* Project Details */}
            <div className="bg-card border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Details</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Start Date
                  </label>
                  <p>
                    {project.startDate
                      ? new Date(project.startDate).toLocaleDateString()
                      : 'Not set'}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    End Date
                  </label>
                  <p>
                    {project.endDate
                      ? new Date(project.endDate).toLocaleDateString()
                      : 'Not set'}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Progress
                  </label>
                  <div className="w-full bg-muted rounded-full h-2.5 mt-2">
                    <div
                      className="bg-primary h-2.5 rounded-full"
                      style={{ width: `${project.progress}%` }}
                      role="progressbar"
                      aria-valuenow={project.progress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <EditProjectDialog
        open={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        project={project}
      />
      
      <CreateTaskDialog
        open={isCreateTaskDialogOpen}
        onClose={() => setIsCreateTaskDialogOpen(false)}
        projectId={project.id}
      />
      
      <ShareDialog
        open={isSharingDialogOpen}
        onClose={() => setIsSharingDialogOpen(false)}
        itemId={project.id}
        itemType="project"
        itemName={project.name}
      />
    </div>
  );
} 