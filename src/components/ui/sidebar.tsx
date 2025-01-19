"use client";

import { cn } from "@/lib/utils";
import Link, { LinkProps } from "next/link";
import React, { useState } from "react";
import { Menu, LogOut, X } from "lucide-react";
import { useAuth } from "@/lib/contexts/AuthContext";
import Image from "next/image";

interface Links {
  label: string;
  href: string;
  icon: React.ReactNode;
}

export const Sidebar = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

export const SidebarBody = ({ children }: { children: React.ReactNode }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-col bg-neutral-100 dark:bg-neutral-800 w-[300px] h-full flex-shrink-0">
        <div className="px-3 py-6">
          <h2 className="text-xl font-semibold">
            <span className="block">Symphony</span>
            <span className="block">Planner</span>
          </h2>
        </div>
        <div className="flex-1 px-3">
          {children}
        </div>
        <UserProfile />
      </div>

      {/* Mobile menu button */}
      <div className="fixed top-4 right-4 md:hidden">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-md text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* Mobile sidebar */}
      <div
        className={`${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } transform fixed inset-0 z-50 md:hidden transition-transform duration-300 ease-in-out`}
      >
        <div className="relative h-full">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Sidebar content */}
          <div className="relative h-full w-[300px] bg-neutral-100 dark:bg-neutral-800">
            <div className="flex justify-between items-center px-3 py-6">
              <h2 className="text-xl font-semibold">
                <span className="block">Symphony</span>
                <span className="block">Planner</span>
              </h2>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-md text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="flex-1 px-3">
              {children}
            </div>
            <UserProfile />
          </div>
        </div>
      </div>
    </>
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
          <Image
            src={user.photoURL}
            alt={user.displayName || 'User avatar'}
            width={32}
            height={32}
            className="rounded-full"
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
