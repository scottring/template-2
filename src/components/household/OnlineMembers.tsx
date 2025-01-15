import { useRealtime } from '@/lib/hooks/useRealtime';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { HouseholdMember } from '@/types/models';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface OnlineMembersProps {
  householdId: string;
  className?: string;
}

export function OnlineMembers({ householdId, className }: OnlineMembersProps) {
  const { onlineMembers, loading } = useRealtime(householdId);

  if (loading) {
    return <div className="animate-pulse h-8 w-24 bg-muted rounded-full" />;
  }

  return (
    <div className={cn("flex -space-x-2", className)}>
      <TooltipProvider>
        {onlineMembers.map((member) => (
          <Tooltip key={member.userId}>
            <TooltipTrigger asChild>
              <div className="relative">
                <Avatar className="h-8 w-8 border-2 border-background">
                  <AvatarImage src={member.photoURL} alt={member.displayName} />
                  <AvatarFallback>
                    {member.displayName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span 
                  className={cn(
                    "absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background",
                    member.activeStatus === 'online' && "bg-green-500",
                    member.activeStatus === 'away' && "bg-yellow-500",
                    member.activeStatus === 'busy' && "bg-red-500"
                  )} 
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{member.displayName}</p>
              <p className="text-xs text-muted-foreground capitalize">
                {member.activeStatus}
              </p>
            </TooltipContent>
          </Tooltip>
        ))}
      </TooltipProvider>
    </div>
  );
} 