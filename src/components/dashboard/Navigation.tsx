import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Target,
  ClipboardList,
  Calendar,
  Users,
  Settings,
  ChevronDown,
  ChevronRight,
  Map,
  ListTodo,
  MapPin,
  BrickWall,
  CalendarDays
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

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Planning & Review', href: '/planning', icon: CalendarDays },
  { name: 'Itinerary', href: '/itinerary', icon: Map },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  {
    name: 'Foundations',
    icon: BrickWall,
    children: [
      { name: 'Areas', href: '/areas', icon: MapPin },
      { name: 'Goals', href: '/goals', icon: Target },
      { name: 'Tasks', href: '/tasks', icon: ListTodo },   
    ],
  },
  { name: 'Family', href: '/family', icon: Users },
  { name: 'Settings', href: '/settings', icon: Settings },
];

function hasChildren(item: NavItem): item is NavItemWithChildren {
  return 'children' in item && Array.isArray(item.children);
}

export function Navigation() {
  const pathname = usePathname();
  const [openSections, setOpenSections] = useState<string[]>([]);

  const toggleSection = (name: string) => {
    setOpenSections(prev =>
      prev.includes(name)
        ? prev.filter(item => item !== name)
        : [...prev, name]
    );
  };

  const NavLink = ({ item, nested = false }: { item: NavItemWithHref; nested?: boolean }) => {
    const isActive = pathname === item.href;
    const Icon = item.icon;

    return (
      <Link
        href={item.href}
        className={cn(
          'group flex items-center gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold',
          isActive
            ? 'bg-gray-50 text-blue-600'
            : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50',
          nested && 'ml-7'
        )}
      >
        <Icon
          className={cn(
            'h-6 w-6 shrink-0',
            isActive
              ? 'text-blue-600'
              : 'text-gray-400 group-hover:text-blue-600'
          )}
          aria-hidden="true"
        />
        {item.name}
      </Link>
    );
  };

  const NavSection = ({ item }: { item: NavItemWithChildren }) => {
    const Icon = item.icon;
    const isOpen = openSections.includes(item.name);

    return (
      <div>
        <button
          onClick={() => toggleSection(item.name)}
          className="group flex w-full items-center gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold text-gray-700 hover:text-blue-600 hover:bg-gray-50"
        >
          <Icon
            className="h-6 w-6 shrink-0 text-gray-400 group-hover:text-blue-600"
            aria-hidden="true"
          />
          {item.name}
          {isOpen ? (
            <ChevronDown className="ml-auto h-5 w-5" />
          ) : (
            <ChevronRight className="ml-auto h-5 w-5" />
          )}
        </button>
        {isOpen && (
          <div className="mt-1">
            {item.children.map((child) => (
              <NavLink key={child.href} item={child} nested />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <nav className="flex flex-1 flex-col">
      <ul role="list" className="flex flex-1 flex-col gap-y-7">
        <li>
          <ul role="list" className="-mx-2 space-y-1">
            {navigation.map((item) => (
              <li key={item.name}>
                {hasChildren(item) ? (
                  <NavSection item={item} />
                ) : (
                  <NavLink item={item} />
                )}
              </li>
            ))}
          </ul>
        </li>
      </ul>
    </nav>
  );
} 