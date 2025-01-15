import { UserProfile } from "@/lib/stores/useUserStore";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface UserSelectProps {
  users: UserProfile[];
  selectedUserIds: string[];
  onSelect: (userIds: string[]) => void;
  label?: string;
  className?: string;
}

export function UserSelect({
  users,
  selectedUserIds,
  onSelect,
  label,
  className,
}: UserSelectProps) {
  const handleSelect = (userId: string) => {
    const newSelected = selectedUserIds.includes(userId)
      ? selectedUserIds.filter(id => id !== userId)
      : [...selectedUserIds, userId];
    onSelect(newSelected);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && <Label>{label}</Label>}
      <div className="space-y-2">
        {users.map((user) => (
          <div key={user.id} className="flex items-center space-x-2 p-2">
            <Checkbox
              id={`user-${user.id}`}
              checked={selectedUserIds.includes(user.id)}
              onCheckedChange={() => handleSelect(user.id)}
            />
            <Label htmlFor={`user-${user.id}`} className="cursor-pointer">
              {user.displayName || user.email}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
}
