'use client';

import { useState } from 'react';
import { useHouseholdStore } from '@/lib/stores/useHouseholdStore';
import { useAuth } from '@/lib/hooks/useAuth';
import { HouseholdSettings } from '@/components/household/HouseholdSettings';
import { CreateHouseholdDialog } from '@/components/household/CreateHouseholdDialog';
import { JoinHouseholdDialog } from '@/components/household/JoinHouseholdDialog';
import { Button } from '@/components/ui/button';
import { UserPlus, Users } from 'lucide-react';

export default function HouseholdPage() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const { household } = useHouseholdStore();
  const { user } = useAuth();

  if (!user) return null;

  if (!household) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-md mx-auto space-y-4">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold">Welcome to Symphony</h1>
            <p className="text-muted-foreground">
              Create or join a household to get started with collaborative life planning.
            </p>
          </div>

          <div className="grid gap-4">
            <Button
              size="lg"
              className="w-full"
              onClick={() => setShowCreateDialog(true)}
            >
              <Users className="mr-2 h-4 w-4" />
              Create a Household
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full"
              onClick={() => setShowJoinDialog(true)}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Join a Household
            </Button>
          </div>
        </div>

        <CreateHouseholdDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
        />
        <JoinHouseholdDialog
          open={showJoinDialog}
          onOpenChange={setShowJoinDialog}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">{household.name}</h1>
          <p className="text-muted-foreground">
            Manage your household settings, members, and preferences.
          </p>
        </div>

        <HouseholdSettings />
      </div>
    </div>
  );
} 