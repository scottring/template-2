"use client";
import { Sidebar, SidebarBody, SidebarLink } from "./sidebar";
import { Home, Settings, Users } from "lucide-react";

export function SidebarDemo() {
  return (
    <div className="flex h-screen">
      <Sidebar>
        <SidebarBody>
          <div className="space-y-4">
            <SidebarLink
              link={{
                label: "Home",
                href: "/",
                icon: <Home className="w-5 h-5" />,
              }}
            />
            <SidebarLink
              link={{
                label: "Team",
                href: "/team",
                icon: <Users className="w-5 h-5" />,
              }}
            />
            <SidebarLink
              link={{
                label: "Settings",
                href: "/settings",
                icon: <Settings className="w-5 h-5" />,
              }}
            />
          </div>
        </SidebarBody>
      </Sidebar>
      
      <main className="flex-1 p-4">
        <h1 className="text-2xl font-bold">Main Content</h1>
        <p className="mt-4">This is the main content area.</p>
      </main>
    </div>
  );
}
