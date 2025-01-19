'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/lib/hooks/useAuth';
import { useSettingsStore } from '@/lib/stores/useSettingsStore';
import { useHouseholdStore } from '@/lib/stores/useHouseholdStore';
import { Copy, UserPlus, UserX } from 'lucide-react';
import Image from 'next/image';

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { settings, isLoading: settingsLoading, loadSettings, updateSettings } = useSettingsStore();
  const { 
    household,
    members,
    inviteCodes,
    isLoading: householdLoading,
    createInviteCode,
    invalidateInviteCode,
    removeMember,
    updateMember
  } = useHouseholdStore();
  const [newInviteCode, setNewInviteCode] = useState('');

  useEffect(() => {
    if (user) {
      loadSettings(user.uid);
    }
  }, [user, loadSettings]);

  const handleSave = async () => {
    if (!user || !settings) return;

    try {
      await updateSettings(settings);
      toast({
        title: 'Success',
        description: 'Settings saved successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive',
      });
    }
  };

  const handleCreateInvite = async () => {
    try {
      const code = await createInviteCode();
      setNewInviteCode(code);
      toast({
        title: 'Success',
        description: 'New invite code created',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create invite code',
        variant: 'destructive',
      });
    }
  };

  const handleCopyInvite = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: 'Success',
      description: 'Invite code copied to clipboard',
    });
  };

  const handleInvalidateInvite = async (code: string) => {
    try {
      await invalidateInviteCode(code);
      toast({
        title: 'Success',
        description: 'Invite code invalidated',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to invalidate invite code',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return;

    try {
      await removeMember(userId);
      toast({
        title: 'Success',
        description: 'Member removed from household',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove member',
        variant: 'destructive',
      });
    }
  };

  if (settingsLoading || householdLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!settings || !household) return null;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-gray-600 mt-2">Configure your preferences and manage your household</p>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Household Members</h2>
        <div className="space-y-4">
          {members.map((member) => (
            <div key={member.userId} className="flex items-center justify-between py-2">
              <div className="flex items-center space-x-3">
                {member.photoURL && (
                  <Image
                    src={member.photoURL}
                    alt={member.displayName}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                )}
                <div>
                  <p className="font-medium">{member.displayName}</p>
                  <p className="text-sm text-gray-500">{member.role}</p>
                </div>
              </div>
              {user?.uid !== member.userId && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveMember(member.userId)}
                >
                  <UserX className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 space-y-4">
          <h3 className="text-md font-medium">Invite New Members</h3>
          <div className="flex items-center space-x-2">
            <Button onClick={handleCreateInvite}>
              <UserPlus className="h-4 w-4 mr-2" />
              Generate Invite Code
            </Button>
          </div>

          {inviteCodes.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Active Invite Codes:</p>
              {inviteCodes.map((invite) => (
                <div key={invite.code} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                  <code className="text-sm">{invite.code}</code>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyInvite(invite.code)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleInvalidateInvite(invite.code)}
                    >
                      <UserX className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Notifications</h2>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Task Reminders</Label>
              <p className="text-sm text-gray-500">
                Get notified about upcoming and overdue tasks
              </p>
            </div>
            <Switch
              checked={settings.notifications.taskReminders}
              onCheckedChange={(checked) =>
                updateSettings({
                  notifications: { ...settings.notifications, taskReminders: checked }
                })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Task Assignments</Label>
              <p className="text-sm text-gray-500">
                Get notified when tasks are assigned to you
              </p>
            </div>
            <Switch
              checked={settings.notifications.taskAssignments}
              onCheckedChange={(checked) =>
                updateSettings({
                  notifications: { ...settings.notifications, taskAssignments: checked }
                })
              }
            />
          </div>

          {(settings.notifications.taskReminders || settings.notifications.taskAssignments) && (
            <div className="space-y-2">
              <Label>Reminder Hours Before</Label>
              <Input
                type="number"
                min="1"
                max="72"
                value={settings.notifications.reminderHoursBefore}
                onChange={(e) =>
                  updateSettings({
                    notifications: {
                      ...settings.notifications,
                      reminderHoursBefore: parseInt(e.target.value) || 24
                    }
                  })
                }
              />
            </div>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Display</h2>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Default View</Label>
            <Select
              value={settings.defaultView}
              onValueChange={(value: 'day' | 'week' | 'month') =>
                updateSettings({ defaultView: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select view" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Day</SelectItem>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="month">Month</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Color Scheme</Label>
            <Select
              value={settings.colorScheme}
              onValueChange={(value: 'system' | 'light' | 'dark') =>
                updateSettings({ colorScheme: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select color scheme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave}>
          Save Settings
        </Button>
      </div>
    </div>
  );
}
