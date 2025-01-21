'use client';

import { Goal } from '@/types/models';
import { useState } from 'react';
import { DatePicker } from '@/components/ui/DatePicker';
import { Button } from '@/components/ui/button';
import useGoalStore from '@/lib/stores/useGoalStore';

interface GoalDetailProps {
  goal: Goal;
}

export default function GoalDetail({ goal }: GoalDetailProps) {
  const [editMode, setEditMode] = useState(false);
  const { updateGoal } = useGoalStore();
  const [formData, setFormData] = useState(goal);

  const handleSave = async () => {
    try {
      await updateGoal(goal.id, formData);
      setEditMode(false);
    } catch (error) {
      console.error('Error updating goal:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">{goal.name}</h2>
        <Button onClick={() => setEditMode(!editMode)}>
          {editMode ? 'Cancel' : 'Edit'}
        </Button>
      </div>

      {editMode ? (
        <div className="space-y-4">
          <div>
            <label className="block mb-2">Start Date</label>
            <DatePicker
              value={formData.startDate ? new Date(formData.startDate) : new Date()}
              onChange={(date) => {
                if (date) {
                  setFormData({ ...formData, startDate: date });
                }
              }}
            />
          </div>

          <div>
            <label className="block mb-2">Target Date</label>
            <DatePicker
              value={formData.targetDate ? new Date(formData.targetDate) : new Date()}
              onChange={(date) => {
                if (date) {
                  setFormData({ ...formData, targetDate: date });
                }
              }}
            />
          </div>

          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      ) : (
        <div className="space-y-2">
          <p><strong>Start Date:</strong> {goal.startDate?.toLocaleDateString()}</p>
          <p><strong>Target Date:</strong> {goal.targetDate?.toLocaleDateString()}</p>
        </div>
      )}
    </div>
  );
}
