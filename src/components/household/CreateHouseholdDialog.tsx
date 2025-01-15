import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useHouseholdStore } from '@/lib/stores/useHouseholdStore';
import { useAuth } from '@/lib/hooks/useAuth';

interface CreateHouseholdDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateHouseholdDialog({ open, onOpenChange }: CreateHouseholdDialogProps) {
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createHousehold } = useHouseholdStore();
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    try {
      setIsSubmitting(true);
      await createHousehold(name, user.uid);
      toast({
        title: 'Household created',
        description: 'Your household has been created successfully.',
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating household:', error);
      toast({
        title: 'Error',
        description: 'Failed to create household. Please try again.',
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
          <DialogTitle>Create a Household</DialogTitle>
          <DialogDescription>
            Create a new household to start managing tasks, resources, and schedules together.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Household Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter household name"
                required
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
            <Button type="submit" disabled={isSubmitting || !name.trim()}>
              {isSubmitting ? 'Creating...' : 'Create Household'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 