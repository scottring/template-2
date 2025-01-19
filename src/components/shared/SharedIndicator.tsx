'use client';

import { Fragment } from 'react';
import { Popover, Transition } from '@headlessui/react';
import { Users } from 'lucide-react';
import { useUserStore } from '@/lib/stores/useUserStore';
import Image from 'next/image';

interface SharedIndicatorProps {
  sharedWith: string[];
}

export function SharedIndicator({ sharedWith }: SharedIndicatorProps) {
  const { familyMembers } = useUserStore();

  if (!sharedWith?.length) return null;

  const sharedMembers = familyMembers.filter((member) => sharedWith.includes(member.id));

  return (
    <Popover className="relative">
      <Popover.Button className="flex items-center gap-x-1 rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 hover:bg-blue-100">
        <Users className="h-3 w-3" />
        <span>Shared ({sharedWith.length})</span>
      </Popover.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-200"
        enterFrom="opacity-0 translate-y-1"
        enterTo="opacity-100 translate-y-0"
        leave="transition ease-in duration-150"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 translate-y-1"
      >
        <Popover.Panel className="absolute left-1/2 z-10 mt-2 w-64 -translate-x-1/2 transform">
          <div className="overflow-hidden rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5">
            <div className="p-4">
              <h3 className="text-sm font-medium text-gray-900">Shared with</h3>
              <div className="mt-2 divide-y divide-gray-200">
                {sharedMembers.map((member) => (
                  <div key={member.id} className="flex items-center gap-x-3 py-2">
                    {member.photoURL ? (
                      <Image
                        src={member.photoURL}
                        alt={member.displayName}
                        width={24}
                        height={24}
                        className="flex-none rounded-full bg-gray-50"
                      />
                    ) : (
                      <div className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-600">
                        {member.displayName?.[0] || member.email[0]}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900">{member.displayName}</p>
                      <p className="truncate text-xs text-gray-500">{member.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Popover.Panel>
      </Transition>
    </Popover>
  );
} 