'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { Project } from '@/types/models';
import { useRouter } from 'next/navigation';
import { Share2 } from 'lucide-react';
import { SharedIndicator } from '@/components/shared/SharedIndicator';
import { ShareDialog } from '@/components/shared/ShareDialog';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [sharingProject, setSharingProject] = useState<Project | null>(null);
  const router = useRouter();

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
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Projects</h1>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <div
            key={project.id}
            className="relative flex flex-col overflow-hidden rounded-lg border bg-white shadow-sm"
          >
            <div className="p-6">
              <div className="flex items-center gap-x-3">
                <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
                <SharedIndicator sharedWith={project.assignedTo} />
              </div>
              <p className="mt-2 text-sm text-gray-500">{project.description}</p>
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <p>
                    {project.startDate.toLocaleDateString()} - {project.endDate.toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-auto flex divide-x border-t">
              <button
                type="button"
                onClick={() => router.push(`/projects/${project.id}`)}
                className="flex w-full items-center justify-center gap-x-2.5 p-3 text-sm font-semibold text-gray-900 hover:bg-gray-50"
              >
                View Details
              </button>
              <button
                type="button"
                onClick={() => setSharingProject(project)}
                className="flex w-full items-center justify-center gap-x-2.5 p-3 text-sm font-semibold text-gray-900 hover:bg-gray-50"
              >
                <Share2 className="h-4 w-4" />
                Share
              </button>
            </div>
          </div>
        ))}

        {projects.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center">
            <h3 className="mt-2 text-sm font-semibold text-gray-900">
              No projects yet
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Projects will appear here when you create them from a goal.
            </p>
          </div>
        )}
      </div>

      {sharingProject && (
        <ShareDialog
          open={true}
          onClose={() => setSharingProject(null)}
          itemType="projects"
          itemId={sharingProject.id}
          itemName={sharingProject.name}
        />
      )}
    </div>
  );
} 