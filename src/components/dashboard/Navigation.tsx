import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  Home,
  Target,
  ClipboardList,
  Calendar,
  Users,
  Settings,
  LayoutDashboard,
  CalendarDays,
  CalendarRange,
  CalendarClock,
  Workflow
} from 'lucide-react';

const navigation = [
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

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col">
      <ul role="list" className="flex flex-1 flex-col gap-y-7">
        <li>
          <ul role="list" className="-mx-2 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              const isParentActive = item.children?.some(child => pathname === child.href);

              if (item.children) {
                return (
                  <li key={item.name}>
                    <div className="flex items-center gap-x-3 p-2 text-sm font-semibold leading-6 text-gray-700">
                      <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                      {item.name}
                    </div>
                    <ul role="list" className="ml-6 space-y-1">
                      {item.children.map((child) => {
                        const ChildIcon = child.icon;
                        const isChildActive = pathname === child.href;
                        return (
                          <li key={child.name}>
                            <Link
                              href={child.href}
                              className={cn(
                                isChildActive
                                  ? 'bg-gray-50 text-blue-600'
                                  : 'hover:text-blue-600 hover:bg-gray-50',
                                'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                              )}
                            >
                              <ChildIcon
                                className={cn(
                                  isChildActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-600',
                                  'h-5 w-5 shrink-0'
                                )}
                                aria-hidden="true"
                              />
                              {child.name}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                );
              }

              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      isActive
                        ? 'bg-gray-50 text-blue-600'
                        : 'hover:text-blue-600 hover:bg-gray-50',
                      'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                    )}
                  >
                    <Icon
                      className={cn(
                        isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-600',
                        'h-5 w-5 shrink-0'
                      )}
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </li>
      </ul>
    </nav>
  );
} 