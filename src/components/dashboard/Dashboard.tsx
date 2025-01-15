'use client';

import React from 'react';
import { Sidebar, SidebarBody, SidebarLink } from '@/components/ui/sidebar';
import { Home, MapPin, ListChecks, Calendar, Users, ListTodo, Map, ClipboardList } from 'lucide-react';

interface DashboardProps {
  children: React.ReactNode;
}

const Dashboard: React.FC<DashboardProps> = ({ children }) => {
    const links = [
        { label: 'Dashboard', href: '/', icon: <Home className="w-5 h-5" /> },
        { label: 'Areas', href: '/areas', icon: <MapPin className="w-5 h-5" /> },
        { label: 'Goals', href: '/goals', icon: <ListChecks className="w-5 h-5" /> },
        { label: 'Tasks', href: '/tasks', icon: <ListTodo className="w-5 h-5" /> },
        { label: 'Planning', href: '/planning', icon: <ClipboardList className="w-5 h-5" /> },
        { label: 'Calendar', href: '/calendar', icon: <Calendar className="w-5 h-5" /> },
        { label: 'Family', href: '/family', icon: <Users className="w-5 h-5" /> },
        { label: 'Itinerary', href: '/itinerary', icon: <Map className="w-5 h-5" /> },
    ];

    return (
        <div className="flex h-screen">
            <Sidebar>
                <SidebarBody>
                    {links.map((link) => (
                        <SidebarLink 
                            key={link.href} 
                            link={link}
                        />
                    ))}
                </SidebarBody>
            </Sidebar>
            <main className="flex-1 p-4 overflow-auto">
                {children}
            </main>
        </div>
    );
};

export default Dashboard;
