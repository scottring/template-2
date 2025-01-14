'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { Task } from '@/types/models';
import { Share2 } from 'lucide-react';
import { SharedIndicator } from '@/components/shared/SharedIndicator';
import { ShareDialog } from '@/components/shared/ShareDialog';

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sharingTask, setSharingTask] = useState<Task | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'tasks'), orderBy('dueDate', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tasks = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        dueDate: doc.data().dueDate?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as Task[];
      setTasks(tasks);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Tasks</h1>
      </div>

      <div className="overflow-hidden bg-white shadow sm:rounded-md">
        <ul role="list" className="divide-y divide-gray-200">
          {tasks.map((task) => (
            <li key={task.id}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={task.isCompleted}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                    />
                    <div className="ml-3 flex items-center gap-x-3">
                      <p className="text-sm font-medium text-gray-900">{task.name}</p>
                      <SharedIndicator sharedWith={task.assignedTo} />
                    </div>
                  </div>
                  <div className="ml-2 flex items-center gap-x-4">
                    <p className="inline-flex rounded-full bg-green-100 px-2 text-xs font-semibold leading-5 text-green-800">
                      {task.dueDate?.toLocaleDateString()}
                    </p>
                    <button
                      type="button"
                      onClick={() => setSharingTask(task)}
                      className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
                    >
                      <Share2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                {task.description && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">{task.description}</p>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {sharingTask && (
        <ShareDialog
          open={true}
          onClose={() => setSharingTask(null)}
          itemType="tasks"
          itemId={sharingTask.id}
          itemName={sharingTask.name}
        />
      )}
    </div>
  );
} 