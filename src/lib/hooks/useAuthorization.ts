import { useAuth } from './useAuth';
import { AuthorizedItem, WorkspaceView } from '@/types/auth';
import { useState } from 'react';

export function useAuthorization() {
  const { user } = useAuth();
  const [workspace, setWorkspace] = useState<WorkspaceView>('personal');
  
  const canAccessHousehold = (householdId: string) => {
    if (!user) return false;
    return user.roles.householdId === householdId;
  };
  
  const canEditItem = (item: AuthorizedItem) => {
    if (!user) return false;
    
    // User can always edit their own items
    if (item.ownerId === user.uid) return true;
    
    // For household items, check household membership and item visibility
    if (item.visibility === 'household' && item.householdId) {
      return canAccessHousehold(item.householdId);
    }
    
    return false;
  };

  const canViewItem = (item: AuthorizedItem) => {
    if (!user) return false;
    
    // Users can always view their own items
    if (item.ownerId === user.uid) return true;
    
    // For household items, check household membership
    if (item.visibility === 'household' && item.householdId) {
      return canAccessHousehold(item.householdId);
    }
    
    return false;
  };

  const isHouseholdOwner = (householdId: string) => {
    if (!user) return false;
    return user.roles.isHouseholdOwner && user.roles.householdId === householdId;
  };

  const getDefaultVisibility = () => {
    return workspace === 'household' ? 'household' : 'private';
  };

  return {
    workspace,
    setWorkspace,
    canAccessHousehold,
    canEditItem,
    canViewItem,
    isHouseholdOwner,
    getDefaultVisibility,
    currentHouseholdId: user?.roles.householdId || null,
  };
}