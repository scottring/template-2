'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { QuickScheduleDialog } from './QuickScheduleDialog';

interface QuickAddButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function QuickAddButton({ variant = 'default', size = 'default', className }: QuickAddButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setIsDialogOpen(true)}
        className={className}
      >
        <Plus className="w-4 h-4 mr-2" />
        Quick Add
      </Button>

      <QuickScheduleDialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
    </>
  );
} 