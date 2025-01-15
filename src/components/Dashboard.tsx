'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  ClipboardList,
  Calendar,
  Users,
  Library,
  Settings,
  ChevronDown,
  ChevronRight,
  Music2,
  Target,
  Workflow,
  CalendarDays,
  CalendarRange,
  CalendarClock,
} from 'lucide-react';

interface BaseNavItem {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavItemWithHref extends BaseNavItem {
  href: string;
  children?: never;
}

interface NavItemWithChildren extends BaseNavItem {
  href?: never;
  children: NavItemWithHref[];
}

type NavItem = NavItemWithHref | NavItemWithChildren;

function hasChildren(item: NavItem): item is NavItemWithChildren {
  return 'children' in item && Array.isArray(item.children);
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Goals', href: '/goals', icon: Target },
  { name: 'Tasks', href: '/tasks', icon: ClipboardList },
  {
    name: 'Workflows',
    icon: Workflow,
    children: [
      { name: 'Planning', href: '/planning', icon: Calendar },
      { name: 'Weekly Planning', href: '/planning/weekly', icon: CalendarDays },
      { name: 'Monthly Planning', href: '/planning/monthly', icon: CalendarRange },
      { name: 'Quarterly Planning', href: '/planning/quarterly', icon: CalendarClock },
    ],
  },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Family', href: '/family', icon: Users },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Dashboard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>(['Workflows']);

  const toggleExpanded = (name: string) => {
    setExpandedItems(prev => 
      prev.includes(name) 
        ? prev.filter(item => item !== name)
        : [...prev, name]
    );
  };

  const renderNavItem = (item: NavItem, depth = 0) => {
    const isExpanded = expandedItems.includes(item.name);
    const isActive = hasChildren(item) 
      ? item.children.some(child => child.href === pathname)
      : item.href === pathname;

    return (
      <div key={item.name}>
        {hasChildren(item) ? (
          <button
            onClick={() => toggleExpanded(item.name)}
            className={cn(
              "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700",
              isActive && "bg-gray-100 dark:bg-gray-700"
            )}
          >
            <item.icon className="h-5 w-5" />
            <span className="flex-1 text-left">{item.name}</span>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        ) : (
          <Link
            href={item.href}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700",
              isActive && "bg-gray-100 dark:bg-gray-700",
              depth > 0 && "ml-4"
            )}
          >
            <item.icon className="h-5 w-5" />
            <span>{item.name}</span>
          </Link>
        )}
        {hasChildren(item) && isExpanded && (
          <div className="mt-1">
            {item.children.map(child => renderNavItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="w-64 border-r bg-white dark:bg-gray-800">
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center border-b">
            <Link href="/" className="flex items-center gap-2 pl-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100">
                <Music2 className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-lg text-blue-600">Symphony</span>
                <span className="text-xs text-gray-500 -mt-1">Planner</span>
              </div>
            </Link>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map(item => renderNavItem(item))}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1">
        <main className="h-full">{children}</main>
      </div>
    </div>
  );
} 