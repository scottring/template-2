'use client';

import useAreaStore from '@/lib/stores/useAreaStore';
import { PlusIcon, MoreVertical, Trash, Share2 } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { CreateAreaDialog } from '@/components/areas/CreateAreaDialog';
import { EditAreaDialog } from '@/components/areas/EditAreaDialog';
import { collection, onSnapshot, query, orderBy, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { Area } from '@/types/models';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { SharedIndicator } from '@/components/shared/SharedIndicator';
import { ShareDialog } from '@/components/shared/ShareDialog';
import { useAuth } from '@/lib/hooks/useAuth';

export default function AreasPage() {
  const { user } = useAuth();
  const areas = useAreaStore(state => state.areas);
  const loading = useAreaStore(state => state.loading);
  const error = useAreaStore(state => state.error);
  const fetchAreas = useAreaStore(state => state.fetchAreas);
  const deleteArea = useAreaStore(state => state.deleteArea);
  const migrateAreas = useAreaStore(state => state.migrateAreas);
  
  const [sharingArea, setSharingArea] = useState<Area | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<Area | null>(null);
  const router = useRouter();

  useEffect(() => {
    console.log('Auth state:', { user, householdId: user?.householdId });
    if (user?.householdId) {
      console.log('Fetching areas for household:', user.householdId);
      fetchAreas(user.householdId)
        .then(() => console.log('Areas fetched:', areas))
        .catch(error => console.error('Error fetching areas:', error));
    }
  }, [fetchAreas, user?.householdId]);

  // Debug log when areas change
  useEffect(() => {
    console.log('Areas updated:', areas);
  }, [areas]);

  const handleDeleteArea = useCallback(async (areaId: string) => {
    if (window.confirm('Are you sure you want to delete this area? This action cannot be undone.')) {
      try {
        await deleteArea(areaId);
      } catch (error) {
        console.error('Error deleting area:', error);
      }
    }
  }, [deleteArea]);

  const handleMigrateAreas = useCallback(async () => {
    if (!user?.householdId) return;
    if (window.confirm('Are you sure you want to migrate all areas to your household? This action cannot be undone.')) {
      try {
        await migrateAreas(user.householdId);
      } catch (error) {
        console.error('Error migrating areas:', error);
      }
    }
  }, [migrateAreas, user?.householdId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">
        Error loading areas: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Areas</h1>
        <div className="flex gap-2">
          <button
            onClick={handleMigrateAreas}
            className="inline-flex items-center gap-x-1.5 rounded-md bg-yellow-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-yellow-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-600"
          >
            Migrate Areas
          </button>
          <button
            onClick={() => setIsCreateDialogOpen(true)}
            className="inline-flex items-center gap-x-1.5 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <PlusIcon className="-ml-0.5 h-5 w-5" aria-hidden="true" />
            New Area
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {areas.map((area) => (
          <div
            key={area.id}
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
                            onClick={() => setEditingArea(area)}
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
                            onClick={() => handleDeleteArea(area.id)}
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
              <div className="flex items-center gap-x-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  {area.name}
                </h3>
                {area.isFocus && (
                  <span className="inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20">
                    Focus
                  </span>
                )}
                {area.isActive && (
                  <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                    Active
                  </span>
                )}
                <SharedIndicator sharedWith={area.assignedTo} />
              </div>
              <p className="mt-2 text-sm text-gray-500">{area.description}</p>
            </div>
            <div className="mt-auto flex divide-x border-t">
              <button
                type="button"
                onClick={() => router.push(`/areas/${area.id}`)}
                className="flex w-full items-center justify-center gap-x-2.5 p-3 text-sm font-semibold text-gray-900 hover:bg-gray-50"
              >
                View Goals
              </button>
              <button
                type="button"
                onClick={() => setSharingArea(area)}
                className="flex w-full items-center justify-center gap-x-2.5 p-3 text-sm font-semibold text-gray-900 hover:bg-gray-50"
              >
                <Share2 className="h-4 w-4" />
                Share
              </button>
            </div>
          </div>
        ))}

        {areas.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center">
            <h3 className="mt-2 text-sm font-semibold text-gray-900">
              No areas defined
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new life area
            </p>
            <button
              type="button"
              onClick={() => setIsCreateDialogOpen(true)}
              className="mt-6 inline-flex items-center gap-x-2 rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              <PlusIcon className="-ml-0.5 h-5 w-5" aria-hidden="true" />
              New Area
            </button>
          </div>
        )}
      </div>

      <CreateAreaDialog
        open={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
      />

      {editingArea && (
        <EditAreaDialog
          open={!!editingArea}
          onClose={() => setEditingArea(null)}
          area={editingArea}
        />
      )}

      {sharingArea && (
        <ShareDialog
          open={!!sharingArea}
          onClose={() => setSharingArea(null)}
          itemId={sharingArea.id}
          itemType="area"
          itemName={sharingArea.name}
        />
      )}
    </div>
  );
}
