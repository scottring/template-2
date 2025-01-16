'use client';

import { QuickAddButton } from "@/components/planning/QuickAddButton";
import { useAuth } from "@/lib/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell } from "lucide-react";

export function TopBar() {
  const { user } = useAuth();

  return (
    <header className="fixed top-0 right-0 left-64 h-16 border-b border-primary/10 bg-background/80 backdrop-blur-sm z-50">
      <div className="flex h-full items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <QuickAddButton />
          <span className="text-sm text-muted-foreground hidden sm:inline">
            Press ⌘K to quick add
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
            <Bell className="h-5 w-5" />
          </Button>
          
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.photoURL || undefined} alt={user?.displayName || 'User'} />
            <AvatarFallback>
              {user?.displayName?.split(' ').map(n => n[0]).join('') || 'U'}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
} 