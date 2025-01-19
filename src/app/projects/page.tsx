'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { Project } from '@/types/models';
import { useRouter } from 'next/navigation';
import { Share2, Loader2 } from 'lucide-react';
import { SharedIndicator } from '@/components/shared/SharedIndicator';
import { ShareDialog } from '@/components/shared/ShareDialog';
import { useAuth } from '@/lib/hooks/useAuth';
import { motion } from 'framer-motion';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sharingProject, setSharingProject] = useState<Project | null>(null);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.householdId) {
      setIsLoading(false);
      return;
    }

    const q = query(
      collection(db, 'projects'), 
      orderBy('createdAt', 'desc')
    );
    
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
      setIsLoading(false);
    }, (error) => {
      console.error('Error fetching projects:', error);
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
      setIsLoading(true);
    };
  }, [user?.householdId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
          Projects
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <motion.div
            key={project.id}
            className="relative flex flex-col overflow-hidden rounded-lg border bg-card shadow-sm backdrop-blur-sm bg-background/95"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => router.push(`/projects/${project.id}`)}
          >
            <div className="p-6">
              <div className="flex items-center gap-x-3">
                <h3 className="text-lg font-semibold">{project.name}</h3>
                <SharedIndicator sharedWith={project.assignedTo} />
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{project.description}</p>
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <p>
                    {project.startDate?.toLocaleDateString()} - {project.endDate?.toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {sharingProject && (
        <ShareDialog
          open={!!sharingProject}
          onClose={() => setSharingProject(null)}
          itemId={sharingProject.id}
          itemType="project"
          itemName={sharingProject.name}
        />
      )}
    </div>
  );
} 