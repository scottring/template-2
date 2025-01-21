import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Visibility } from "@/types/auth";
import { useAuthorization } from "@/lib/hooks/useAuthorization";

interface VisibilitySelectorProps {
  value: Visibility;
  onChange: (value: Visibility) => void;
  disabled?: boolean;
}

export function VisibilitySelector({ value, onChange, disabled }: VisibilitySelectorProps) {
  const { currentHouseholdId } = useAuthorization();

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="visibility">Visibility</Label>
      <Select
        value={value}
        onValueChange={onChange}
        disabled={disabled || !currentHouseholdId}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select visibility" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="private">Private</SelectItem>
          <SelectItem value="household">Household</SelectItem>
        </SelectContent>
      </Select>
      {!currentHouseholdId && (
        <p className="text-sm text-muted-foreground">
          Join a household to share items
        </p>
      )}
    </div>
  );
}

export function VisibilityBadge({ visibility }: { visibility: Visibility }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
      visibility === 'household' 
        ? 'bg-blue-100 text-blue-800' 
        : 'bg-gray-100 text-gray-800'
    }`}>
      {visibility === 'household' ? 'Household' : 'Private'}
    </span>
  );
}