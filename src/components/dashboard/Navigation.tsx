'use client';

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
  CalendarDays,
  LucideIcon
} from 'lucide-react';
import { motion, Variants } from 'framer-motion';

interface BaseNavItem {
  name: string;
  icon: LucideIcon;
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

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0 }
};

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
          "group relative flex items-center gap-x-3 rounded-lg p-2 text-sm font-medium transition-all duration-200",
          nested ? "ml-7" : "hover:-translate-x-1",
          isActive
            ? "text-primary bg-primary/10"
            : "text-muted-foreground hover:text-primary hover:bg-primary/5"
        )}
      >
        <div className={cn(
          "absolute inset-0 rounded-lg bg-gradient-to-r from-primary/10 via-transparent to-transparent opacity-0 transition-opacity duration-200",
          isActive ? "opacity-100" : "group-hover:opacity-100"
        )} />
        <Icon
          className={cn(
            "h-5 w-5 shrink-0 transition-colors duration-200",
            isActive
              ? "text-primary"
              : "text-muted-foreground/70 group-hover:text-primary"
          )}
          aria-hidden="true"
        />
        <span className="relative">{item.name}</span>
      </Link>
    );
  };

  const NavSection = ({ item }: { item: NavItemWithChildren }) => {
    const Icon = item.icon;
    const isOpen = openSections.includes(item.name);

    return (
      <div>
        <button
          type="button"
          onClick={() => toggleSection(item.name)}
          className={cn(
            "group relative flex w-full items-center gap-x-3 rounded-lg p-2 text-sm font-medium",
            "text-muted-foreground hover:text-primary hover:bg-primary/5",
            "transition-all duration-200 hover:-translate-x-1"
          )}
        >
          <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          <Icon
            className="h-5 w-5 shrink-0 text-muted-foreground/70 group-hover:text-primary transition-colors duration-200"
            aria-hidden="true"
          />
          <span className="relative">{item.name}</span>
          {isOpen ? (
            <ChevronDown className="ml-auto h-4 w-4 transition-transform duration-200" />
          ) : (
            <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200" />
          )}
        </button>
        {isOpen && (
          <motion.div 
            className="mt-1 space-y-1"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            {item.children.map((child) => (
              <NavLink key={child.href} item={child} nested />
            ))}
          </motion.div>
        )}
      </div>
    );
  };

  return (
    <div className="relative flex h-full flex-1 flex-col overflow-hidden bg-gradient-to-b from-background/80 to-muted/50 backdrop-blur-xl border-r border-primary/10">
      <div className="flex-1 overflow-y-auto scrollbar-none py-5 px-4">
        <motion.nav
          className="flex flex-1 flex-col"
          variants={container}
          initial="hidden"
          animate="show"
        >
          <ul role="list" className="flex flex-1 flex-col gap-y-7">
            <motion.li variants={itemVariants}>
              <ul role="list" className="-mx-2 space-y-1">
                {navigation.map((item) => (
                  <motion.li key={item.name} variants={itemVariants}>
                    {hasChildren(item) ? (
                      <NavSection item={item} />
                    ) : (
                      <NavLink item={item} />
                    )}
                  </motion.li>
                ))}
              </ul>
            </motion.li>
          </ul>
        </motion.nav>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
    </div>
  );
} 