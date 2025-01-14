'use client';

import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { Filter, Users, User } from 'lucide-react';

interface SharedFilterProps {
  value: 'all' | 'shared' | 'personal';
  onChange: (value: 'all' | 'shared' | 'personal') => void;
}

export function SharedFilter({ value, onChange }: SharedFilterProps) {
  return (
    <Menu as="div" className="relative">
      <Menu.Button className="flex items-center gap-x-1 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
        <Filter className="h-4 w-4" />
        <span>
          {value === 'all' && 'All Items'}
          {value === 'shared' && 'Shared Items'}
          {value === 'personal' && 'Personal Items'}
        </span>
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
        <Menu.Items className="absolute right-0 z-10 mt-2 w-40 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={() => onChange('all')}
                  className={`${
                    active ? 'bg-gray-100' : ''
                  } flex w-full items-center gap-x-2 px-4 py-2 text-sm text-gray-900`}
                >
                  <Filter className="h-4 w-4" />
                  All Items
                </button>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={() => onChange('shared')}
                  className={`${
                    active ? 'bg-gray-100' : ''
                  } flex w-full items-center gap-x-2 px-4 py-2 text-sm text-gray-900`}
                >
                  <Users className="h-4 w-4" />
                  Shared Items
                </button>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={() => onChange('personal')}
                  className={`${
                    active ? 'bg-gray-100' : ''
                  } flex w-full items-center gap-x-2 px-4 py-2 text-sm text-gray-900`}
                >
                  <User className="h-4 w-4" />
                  Personal Items
                </button>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
} 