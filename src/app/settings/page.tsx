'use client';

import { useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/lib/hooks/useAuth';
import { useSettingsStore } from '@/lib/stores/useSettingsStore';
import { format } from 'date-fns';

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { settings, isLoading, error, loadSettings, saveSettings, getNextPlanningSession, getNextTeamMeeting } = useSettingsStore();

  useEffect(() => {
    if (user) {
      loadSettings(user.uid);
    }
  }, [user, loadSettings]);

  const handleSave = async () => {
    if (!user || !settings) return;

    try {
      await saveSettings(user.uid, settings);
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

  if (isLoading || !settings) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }

  const nextPlanningDate = getNextPlanningSession();
  const nextMeetingDate = getNextTeamMeeting();

  return (
    <div className="p-6 space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-gray-600 mt-2">Configure your planning preferences</p>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Weekly Planning</h2>
        
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Planning Day</Label>
              <Select
                value={settings.weeklyPlanningDay.toString()}
                onValueChange={(value) => 
                  useSettingsStore.setState(state => ({
                    ...state,
                    settings: state.settings ? {
                      ...state.settings,
                      weeklyPlanningDay: parseInt(value)
                    } : null
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a day" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Sunday</SelectItem>
                  <SelectItem value="1">Monday</SelectItem>
                  <SelectItem value="2">Tuesday</SelectItem>
                  <SelectItem value="3">Wednesday</SelectItem>
                  <SelectItem value="4">Thursday</SelectItem>
                  <SelectItem value="5">Friday</SelectItem>
                  <SelectItem value="6">Saturday</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500">
                Next planning session: {format(nextPlanningDate, 'PPPp')}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Planning Time</Label>
              <Input
                type="time"
                value={settings.weeklyPlanningTime}
                onChange={(e) => 
                  useSettingsStore.setState(state => ({
                    ...state,
                    settings: state.settings ? {
                      ...state.settings,
                      weeklyPlanningTime: e.target.value
                    } : null
                  }))
                }
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Auto-schedule Weekly Planning</Label>
              <p className="text-sm text-gray-500">
                Automatically add weekly planning sessions to your schedule
              </p>
            </div>
            <Switch
              checked={settings.autoScheduleWeeklyPlanning}
              onCheckedChange={(checked) =>
                useSettingsStore.setState(state => ({
                  ...state,
                  settings: state.settings ? {
                    ...state.settings,
                    autoScheduleWeeklyPlanning: checked
                  } : null
                }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Planning Reminders</Label>
              <p className="text-sm text-gray-500">
                Get notified before your weekly planning session
              </p>
            </div>
            <Switch
              checked={settings.reminderEnabled}
              onCheckedChange={(checked) =>
                useSettingsStore.setState(state => ({
                  ...state,
                  settings: state.settings ? {
                    ...state.settings,
                    reminderEnabled: checked
                  } : null
                }))
              }
            />
          </div>

          {settings.reminderEnabled && (
            <div className="space-y-2">
              <Label>Reminder Hours Before</Label>
              <Input
                type="number"
                min="1"
                max="72"
                value={settings.reminderHoursBefore}
                onChange={(e) =>
                  useSettingsStore.setState(state => ({
                    ...state,
                    settings: state.settings ? {
                      ...state.settings,
                      reminderHoursBefore: parseInt(e.target.value) || 24
                    } : null
                  }))
                }
              />
            </div>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Weekly Team Meeting</h2>
        
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Default Meeting Day</Label>
              <Select
                value={settings.defaultWeeklyMeetingDay?.toString() || 'none'}
                onValueChange={(value) => 
                  useSettingsStore.setState(state => ({
                    ...state,
                    settings: state.settings ? {
                      ...state.settings,
                      defaultWeeklyMeetingDay: value === 'none' ? null : parseInt(value)
                    } : null
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a day" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not Set</SelectItem>
                  <SelectItem value="0">Sunday</SelectItem>
                  <SelectItem value="1">Monday</SelectItem>
                  <SelectItem value="2">Tuesday</SelectItem>
                  <SelectItem value="3">Wednesday</SelectItem>
                  <SelectItem value="4">Thursday</SelectItem>
                  <SelectItem value="5">Friday</SelectItem>
                  <SelectItem value="6">Saturday</SelectItem>
                </SelectContent>
              </Select>
              {nextMeetingDate && (
                <p className="text-sm text-gray-500">
                  Next meeting: {format(nextMeetingDate, 'PPPp')}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Default Meeting Time</Label>
              <Input
                type="time"
                value={settings.defaultWeeklyMeetingTime || ''}
                onChange={(e) => 
                  useSettingsStore.setState(state => ({
                    ...state,
                    settings: state.settings ? {
                      ...state.settings,
                      defaultWeeklyMeetingTime: e.target.value || null
                    } : null
                  }))
                }
              />
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Appearance</h2>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Color Scheme</Label>
            <Select
              value={settings.colorScheme}
              onValueChange={(value) => 
                useSettingsStore.setState(state => ({
                  ...state,
                  settings: state.settings ? {
                    ...state.settings,
                    colorScheme: value
                  } : null
                }))
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
            <p className="text-sm text-gray-500">
              Choose your preferred color scheme
            </p>
          </div>

          <div className="space-y-2">
            <Label>Default Calendar View</Label>
            <Select
              value={settings.defaultView}
              onValueChange={(value) => 
                useSettingsStore.setState(state => ({
                  ...state,
                  settings: state.settings ? {
                    ...state.settings,
                    defaultView: value as 'day' | 'week' | 'month'
                  } : null
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select default view" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Day</SelectItem>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="month">Month</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500">
              Choose your preferred calendar view
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Notifications</h2>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Task Reminders</Label>
              <p className="text-sm text-gray-500">
                Get notified about upcoming tasks
              </p>
            </div>
            <Switch
              checked={settings.notifications.taskReminders}
              onCheckedChange={(checked) =>
                useSettingsStore.setState(state => ({
                  ...state,
                  settings: state.settings ? {
                    ...state.settings,
                    notifications: {
                      ...state.settings.notifications,
                      taskReminders: checked
                    }
                  } : null
                }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Planning Reminders</Label>
              <p className="text-sm text-gray-500">
                Get notified about planning sessions
              </p>
            </div>
            <Switch
              checked={settings.notifications.planningReminders}
              onCheckedChange={(checked) =>
                useSettingsStore.setState(state => ({
                  ...state,
                  settings: state.settings ? {
                    ...state.settings,
                    notifications: {
                      ...state.settings.notifications,
                      planningReminders: checked
                    }
                  } : null
                }))
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
                useSettingsStore.setState(state => ({
                  ...state,
                  settings: state.settings ? {
                    ...state.settings,
                    notifications: {
                      ...state.settings.notifications,
                      taskAssignments: checked
                    }
                  } : null
                }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Inventory Alerts</Label>
              <p className="text-sm text-gray-500">
                Get notified about low inventory items
              </p>
            </div>
            <Switch
              checked={settings.notifications.inventoryAlerts}
              onCheckedChange={(checked) =>
                useSettingsStore.setState(state => ({
                  ...state,
                  settings: state.settings ? {
                    ...state.settings,
                    notifications: {
                      ...state.settings.notifications,
                      inventoryAlerts: checked
                    }
                  } : null
                }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Default Reminder Time</Label>
            <Input
              type="number"
              min="1"
              max="72"
              value={settings.notifications.reminderHoursBefore}
              onChange={(e) =>
                useSettingsStore.setState(state => ({
                  ...state,
                  settings: state.settings ? {
                    ...state.settings,
                    notifications: {
                      ...state.settings.notifications,
                      reminderHoursBefore: parseInt(e.target.value) || 24
                    }
                  } : null
                }))
              }
            />
            <p className="text-sm text-gray-500">
              Hours before to send reminders (1-72 hours)
            </p>
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
