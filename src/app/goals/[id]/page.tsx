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
  Pencil,
  ArrowUpRight,
} from "lucide-react";
import useGoalStore from "@/lib/stores/useGoalStore";
import { useProjectStore } from "@/lib/stores/useProjectStore";
import { Goal, Project, Step } from "@/types/models";
import { CreateProjectDialog } from "@/components/projects/CreateProjectDialog";
import { ShareDialog } from "@/components/shared/ShareDialog";
import { SharedIndicator } from "@/components/shared/SharedIndicator";
import { TasksSection } from "@/components/goals/TasksSection";
import { Notepad } from "@/components/shared/Notepad";
import { EditGoalDialog } from "@/components/goals/EditGoalDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function GoalDetailPage({ params }: { params: { id: string } }) {
  const [isCreateProjectDialogOpen, setIsCreateProjectDialogOpen] = useState(false);
  const [isEditGoalDialogOpen, setIsEditGoalDialogOpen] = useState(false);
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

  const container = {
    hidden: { opacity: 0, height: 0 },
    show: {
      opacity: 1,
      height: 'auto',
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="rounded-full hover:bg-accent/10 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
          </Button>
          <div>
            <div className="flex items-center gap-x-3">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-accent-foreground to-primary bg-clip-text text-transparent">
                {goal.name}
              </h1>
              <Badge 
                variant="secondary"
                className={cn(
                  "bg-primary/10 text-primary hover:bg-primary/20",
                  goal.goalType === 'Habit' && "bg-accent/10 text-accent-foreground hover:bg-accent/20"
                )}
              >
                {goal.goalType}
              </Badge>
            </div>
            <div className="flex items-center gap-x-2 text-sm text-muted-foreground mt-1">
              <div className="flex items-center gap-x-1">
                <Calendar className="h-4 w-4" />
                <span>Due {goal.targetDate?.toLocaleDateString()}</span>
              </div>
              <span className="text-muted-foreground/30">•</span>
              <div className="flex items-center gap-x-1">
                <Target className="h-4 w-4" />
                <span>{goal.progress}% complete</span>
              </div>
              <span className="text-muted-foreground/30">•</span>
              <SharedIndicator sharedWith={goal.assignedTo} />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-x-2">
          <Button
            onClick={() => setIsCreateProjectDialogOpen(true)}
            className="gap-2 bg-gradient-to-r from-primary to-accent-foreground hover:opacity-90 transition-opacity"
          >
            <PlusIcon className="h-5 w-5" />
            New Project
          </Button>

          <Menu as="div" className="relative">
            <Menu.Button className="rounded-full p-2 hover:bg-accent/10 transition-colors">
              <MoreVertical className="h-5 w-5 text-muted-foreground" />
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
              <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-lg bg-card border border-border shadow-lg focus:outline-none">
                <div className="py-1">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => setIsEditGoalDialogOpen(true)}
                        className={cn(
                          "flex w-full items-center px-4 py-2 text-sm transition-colors",
                          active ? "bg-accent/5 text-accent-foreground" : "text-muted-foreground"
                        )}
                      >
                        <Pencil className="mr-3 h-4 w-4" />
                        Edit
                      </button>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => setSharingGoal(goal)}
                        className={cn(
                          "flex w-full items-center px-4 py-2 text-sm transition-colors",
                          active ? "bg-accent/5 text-accent-foreground" : "text-muted-foreground"
                        )}
                      >
                        <Share2 className="mr-3 h-4 w-4" />
                        Share
                      </button>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={handleDeleteGoal}
                        className={cn(
                          "flex w-full items-center px-4 py-2 text-sm transition-colors",
                          active ? "bg-destructive/10 text-destructive" : "text-destructive/80"
                        )}
                      >
                        <Trash2 className="mr-3 h-4 w-4" />
                        Delete
                      </button>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Card className="overflow-hidden backdrop-blur-sm bg-background/60 border-primary/10">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold bg-gradient-to-r from-primary to-accent-foreground bg-clip-text text-transparent mb-4">
                Description
              </h2>
              <p className="text-muted-foreground">{goal.description}</p>
            </CardContent>
          </Card>

          <Card className="overflow-hidden backdrop-blur-sm bg-background/60 border-primary/10">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold bg-gradient-to-r from-primary to-accent-foreground bg-clip-text text-transparent mb-4">
                Steps
              </h2>
              <motion.ul 
                className="mt-2 space-y-3"
                variants={container}
                initial="hidden"
                animate="show"
              >
                {goal.steps.map((step: Step, index: number) => (
                  <motion.li 
                    key={index} 
                    variants={item}
                    className="group flex items-start gap-x-3 text-sm"
                  >
                    <div className="relative mt-1 flex h-5 w-5 items-center justify-center">
                      <div className="h-4 w-4 rounded-full border-2 border-primary/20 group-hover:border-primary/40 transition-colors" />
                    </div>
                    <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                      {step.text}
                    </span>
                  </motion.li>
                ))}
              </motion.ul>
            </CardContent>
          </Card>

          <Card className="overflow-hidden backdrop-blur-sm bg-background/60 border-primary/10">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold bg-gradient-to-r from-primary to-accent-foreground bg-clip-text text-transparent mb-4">
                Projects
              </h2>
              <motion.div 
                className="space-y-3"
                variants={container}
                initial="hidden"
                animate="show"
              >
                {goalProjects.map((project) => (
                  <motion.div
                    key={project.id}
                    variants={item}
                    className="group flex items-center justify-between rounded-lg border border-transparent hover:border-accent/20 bg-accent/5 hover:bg-accent/10 p-4 transition-all duration-200"
                  >
                    <div>
                      <h3 className="font-medium text-foreground/90 group-hover:text-foreground transition-colors">
                        {project.name}
                      </h3>
                      <p className="text-sm text-muted-foreground group-hover:text-muted-foreground/80 transition-colors">
                        {project.description}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => router.push(`/projects/${project.id}`)}
                      className="text-muted-foreground/50 hover:text-primary transition-colors opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-200"
                    >
                      <ArrowUpRight className="h-5 w-5" />
                    </Button>
                  </motion.div>
                ))}
                {goalProjects.length === 0 && (
                  <motion.p 
                    variants={item}
                    className="text-muted-foreground text-center py-8"
                  >
                    No projects yet
                  </motion.p>
                )}
              </motion.div>
            </CardContent>
          </Card>

          <TasksSection goalId={goal.id} />
        </div>

        <div className="space-y-6">
          <Notepad initialContent="" />
        </div>
      </div>

      <EditGoalDialog
        open={isEditGoalDialogOpen}
        onClose={() => setIsEditGoalDialogOpen(false)}
        goal={goal}
      />

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
