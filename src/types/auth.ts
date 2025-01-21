export interface UserRoles {
  isHouseholdOwner: boolean;
  householdId: string | null;
  householdRole: 'owner' | 'member' | null;
}

export interface AuthUser {
  uid: string;
  email: string;
  displayName: string;
  roles: UserRoles;
  // Keep householdId at root level for backward compatibility
  householdId: string | null;
}

export type Visibility = 'private' | 'household';
export type WorkspaceView = 'personal' | 'household';

export interface AuthorizedItem {
  ownerId: string;
  visibility: Visibility;
  householdId?: string | null;
}