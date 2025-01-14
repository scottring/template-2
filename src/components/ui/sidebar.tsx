"use client";

import { cn } from "@/lib/utils";
import Link, { LinkProps } from "next/link";
import React from "react";
import { Menu, LogOut } from "lucide-react";
import { useAuth } from "@/lib/contexts/AuthContext";

interface Links {
  label: string;
  href: string;
  icon: React.ReactNode;
}

export const Sidebar = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

export const SidebarBody = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <DesktopSidebar>{children}</DesktopSidebar>
      <MobileSidebar>{children}</MobileSidebar>
    </>
  );
};

export const DesktopSidebar = ({
  className,
  children,
  ...props
}: {
  children: React.ReactNode;
} & React.ComponentProps<"div">) => {
  return (
    <div
      className={cn(
        "h-full px-4 py-4 hidden md:flex md:flex-col bg-neutral-100 dark:bg-neutral-800 w-[300px] flex-shrink-0",
        className
      )}
      style={{
        width: "300px",
      }}
      {...props}
    >
      <h2 className="text-xl font-semibold mb-4 px-4">FamilyGoals</h2>
      <div className="flex-1">
        {children}
      </div>
      <UserProfile />
    </div>
  );
};

export const MobileSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) => {
  return (
    <div
      className={cn(
        "h-full px-4 py-4 md:hidden flex flex-col bg-neutral-100 dark:bg-neutral-800 w-full"
      )}
      {...props}
    >
      <div className="flex justify-end mb-4">
        <Menu className="text-neutral-800 dark:text-neutral-200" />
      </div>
      <div className="flex-1">
        {children}
      </div>
      <UserProfile />
    </div>
  );
};

export const SidebarLink = ({
  link,
  className,
  ...linkProps
}: {
  link: Links;
  className?: string;
} & Omit<LinkProps, 'href'>) => {
  return (
    <Link
      href={link.href}
      className={cn(
        "flex items-center justify-start gap-2 group/sidebar py-2",
        className
      )}
      {...linkProps}
    >
      {link.icon}
      <span className="text-neutral-700 dark:text-neutral-200 text-base whitespace-pre inline-block !p-0 !m-0">
        {link.label}
      </span>
    </Link>
  );
};

const UserProfile = () => {
  const { user, signOut } = useAuth();

  if (!user) return null;

  return (
    <div className="mt-auto pt-4 border-t">
      <div className="flex items-center gap-x-3 px-4 py-3">
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName || 'User avatar'}
            className="h-8 w-8 rounded-full"
          />
        ) : (
          <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
            {user.displayName?.[0] || user.email?.[0] || 'U'}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {user.displayName || user.email}
          </p>
          <button
            onClick={() => signOut()}
            className="flex items-center gap-x-2 text-sm text-gray-500 hover:text-gray-700"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
};
