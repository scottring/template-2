"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WorkspaceView } from "@/types/auth";
import { useAuthorization } from "@/lib/hooks/useAuthorization";

export function WorkspaceSelector() {
  const { workspace, setWorkspace, currentHouseholdId } = useAuthorization();
  
  if (!currentHouseholdId) {
    return null;
  }

  const handleWorkspaceChange = (value: string) => {
    // Ensure the value is a valid WorkspaceView
    if (value === 'personal' || value === 'household') {
      setWorkspace(value);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Select value={workspace} onValueChange={handleWorkspaceChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select workspace" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="personal">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-gray-400" />
              Personal Space
            </div>
          </SelectItem>
          <SelectItem value="household">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-400" />
              Household
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

export function WorkspaceIndicator({ workspace }: { workspace: WorkspaceView }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium ${
        workspace === "household"
          ? "bg-blue-100 text-blue-800"
          : "bg-gray-100 text-gray-800"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          workspace === "household" ? "bg-blue-400" : "bg-gray-400"
        }`}
      />
      {workspace === "household" ? "Household" : "Personal"}
    </span>
  );
}