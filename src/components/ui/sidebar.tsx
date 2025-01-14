"use client";

import { cn } from "@/lib/utils";
import Link, { LinkProps } from "next/link";
import React from "react";
import { Menu } from "lucide-react";

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
      {children}
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
      {children}
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
} & LinkProps) => {
  return (
    <Link
      href={link.href}
      className={cn(
        "flex items-center justify-start gap-2 group/sidebar py-2",
        className
      )}
    >
      {link.icon}
      <span className="text-neutral-700 dark:text-neutral-200 text-base whitespace-pre inline-block !p-0 !m-0">
        {link.label}
      </span>
    </Link>
  );
};
