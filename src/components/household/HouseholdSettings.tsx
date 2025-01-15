import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { useHouseholdStore } from '@/lib/stores/useHouseholdStore';
import { useAuth } from '@/lib/hooks/useAuth';
import { HouseholdMember, InviteCode } from '@/types/models';
import { format } from 'date-fns';
import { Copy, UserMinus, UserPlus } from 'lucide-react';

export function HouseholdSettings() {
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const { household, members, inviteCodes, createInviteCode, invalidateInviteCode, removeMember } = useHouseholdStore();
  const { user } = useAuth();
  const { toast } = useToast();

  const isAdmin = user && household?.members.find(m => m.userId === user.uid)?.role === 'admin';

  const handleCreateInviteCode = async () => {
    if (!isAdmin) return;
    
    try {
      setIsGeneratingCode(true);
      const code = await createInviteCode();
      await navigator.clipboard.writeText(code);
      toast({
        title: 'Invite code created',
        description: 'The code has been copied to your clipboard.',
      });
    } catch (error) {
      console.error('Error creating invite code:', error);
      toast({
        title: 'Error',
        description: 'Failed to create invite code. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const handleCopyInviteCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast({
        title: 'Copied!',
        description: 'Invite code copied to clipboard.',
      });
    } catch (error) {
      console.error('Error copying code:', error);
      toast({
        title: 'Error',
        description: 'Failed to copy code. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleInvalidateCode = async (code: string) => {
    if (!isAdmin) return;
    
    try {
      await invalidateInviteCode(code);
      toast({
        title: 'Code invalidated',
        description: 'The invite code has been invalidated.',
      });
    } catch (error) {
      console.error('Error invalidating code:', error);
      toast({
        title: 'Error',
        description: 'Failed to invalidate code. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!isAdmin || memberId === user?.uid) return;
    
    try {
      await removeMember(memberId);
      toast({
        title: 'Member removed',
        description: 'The member has been removed from the household.',
      });
    } catch (error) {
      console.error('Error removing member:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove member. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (!household) return null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
          <CardDescription>
            Manage household members and their roles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {members.map((member) => (
              <div key={member.userId} className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarImage src={member.photoURL} />
                    <AvatarFallback>{member.displayName[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{member.displayName}</div>
                    <Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
                      {member.role}
                    </Badge>
                  </div>
                </div>
                {isAdmin && member.userId !== user?.uid && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveMember(member.userId)}
                  >
                    <UserMinus className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Invite Codes</CardTitle>
            <CardDescription>
              Generate and manage invite codes for new members.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button
                onClick={handleCreateInviteCode}
                disabled={isGeneratingCode}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                {isGeneratingCode ? 'Generating...' : 'Generate Invite Code'}
              </Button>

              <div className="space-y-2">
                {inviteCodes
                  .filter(code => !code.usedBy)
                  .map((code) => (
                    <div key={code.code} className="flex items-center justify-between">
                      <div>
                        <div className="font-mono">{code.code}</div>
                        <div className="text-sm text-muted-foreground">
                          Expires {format(new Date(code.expiresAt), 'PPp')}
                        </div>
                      </div>
                      <div className="space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleCopyInviteCode(code.code)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleInvalidateCode(code.code)}
                        >
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 