import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useHouseholdStore } from '@/lib/stores/useHouseholdStore';
import { useAuth } from '@/lib/hooks/useAuth';

interface JoinHouseholdDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function JoinHouseholdDialog({ open, onOpenChange }: JoinHouseholdDialogProps) {
  const [inviteCode, setInviteCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { joinHousehold } = useHouseholdStore();
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    try {
      setIsSubmitting(true);
      await joinHousehold(inviteCode.trim().toUpperCase(), user.uid);
      toast({
        title: 'Welcome!',
        description: 'You have successfully joined the household.',
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error joining household:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to join household. Please check your invite code and try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Join a Household</DialogTitle>
          <DialogDescription>
            Enter the invite code provided by the household administrator.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="inviteCode">Invite Code</Label>
              <Input
                id="inviteCode"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="Enter invite code"
                required
                className="uppercase"
                maxLength={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !inviteCode.trim()}>
              {isSubmitting ? 'Joining...' : 'Join Household'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 