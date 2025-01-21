import { Goal } from '@/types/models';

export const createFinanceGoal = (userId: string, householdId: string): Partial<Goal> => ({
  name: "Get Business Finances in Order",
  description: "Comprehensive review and organization of business financial matters",
  goalType: "Project",
  startDate: new Date(),
  targetDate: new Date("2025-01-31"),
  progress: 0,
  status: "not_started",
  householdId,
  createdBy: userId,
  updatedBy: userId,
  assignedTo: [userId],
  steps: [
    {
      id: crypto.randomUUID(),
      text: "Compile a comprehensive list of all business loans, investments, and convertible notes",
      stepType: "Project",
      isTracked: true,
      tasks: [
        {
          id: crypto.randomUUID(),
          text: "Gather all loan documents",
          completed: false
        },
        {
          id: crypto.randomUUID(),
          text: "List all outstanding investments",
          completed: false
        }
      ],
      notes: []
    },
    {
      id: crypto.randomUUID(),
      text: "Analyze cash flow, including spending needs and financial obligations",
      stepType: "Project",
      isTracked: true,
      tasks: [
        {
          id: crypto.randomUUID(),
          text: "play football",
          completed: false
        }
      ],
      notes: []
    },
    {
      id: crypto.randomUUID(),
      text: "Consult with a bankruptcy lawyer to discuss options and next steps",
      stepType: "Project",
      isTracked: true,
      tasks: [],
      notes: []
    },
    {
      id: crypto.randomUUID(),
      text: "Enhance the board",
      stepType: "Project", 
      isTracked: true,
      tasks: [],
      notes: []
    }
  ]
}); 