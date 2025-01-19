import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { addMonths, isValid, parseISO } from 'date-fns';

interface Task {
  text: string;
  isCompleted: boolean;
}

interface Step {
  text: string;
  stepType: 'Habit' | 'Tangible';
  frequency?: number;
  frequencyType?: 'week' | 'month' | 'quarter' | 'year';
  targetDate?: string;
  notes?: string;
  tasks: Task[];
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

// Default goal structure
const defaultGoal = {
  name: '',
  description: '',
  goalType: 'Tangible' as const,
  areaId: '',
  targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
  steps: [] as Step[]
};

// Helper function to ensure valid future date
function ensureValidFutureDate(dateStr: string | undefined, defaultMonths: number = 1): string {
  if (!dateStr) {
    return addMonths(new Date(), defaultMonths).toISOString();
  }

  try {
    const date = parseISO(dateStr);
    if (!isValid(date)) {
      return addMonths(new Date(), defaultMonths).toISOString();
    }
    
    // If date is in the past, set it to the same day/month but in current year
    if (date < new Date()) {
      const currentDate = new Date();
      date.setFullYear(currentDate.getFullYear());
      // If it's still in the past after setting the year, add a year
      if (date < currentDate) {
        date.setFullYear(currentDate.getFullYear() + 1);
      }
    }
    
    return date.toISOString();
  } catch {
    return addMonths(new Date(), defaultMonths).toISOString();
  }
}

export async function POST(req: Request) {
  try {
    // Log the start of processing
    console.log('Starting goal processing...');

    // Parse request body and validate
    const body = await req.json();
    if (!body.prompt || !body.areas) {
      console.error('Missing required fields:', { body });
      return NextResponse.json(
        { error: 'Missing required fields: prompt or areas' },
        { status: 400 }
      );
    }
    const { prompt, areas } = body;

    // Validate areas array
    if (!Array.isArray(areas) || areas.length === 0) {
      console.error('Invalid areas format:', { areas });
      return NextResponse.json(
        { error: 'Areas must be a non-empty array' },
        { status: 400 }
      );
    }

    // Log the areas being used
    console.log('Processing with areas:', areas);

    const systemPrompt = `You are an AI assistant helping to structure goals into a clear format. Given a user's natural language description of their goal and a list of their life areas, you should break it down into:

1. A clear goal name
2. A concise description
3. The most appropriate area for this goal (from the provided list)
4. Whether it's a habit-based goal or a tangible goal with a clear endpoint
5. A target date based on their timeframe (IMPORTANT: All dates must be in the future, using the current year ${new Date().getFullYear()} or later. If no specific timeframe is mentioned, default to 1 month from now)
6. A list of steps to achieve the goal, where each step is either:
   - A habit (with frequency and timeframe)
   - A tangible task (with a target date in the future)
   - Each step can have optional notes and subtasks

Your response should be valid JSON matching this TypeScript interface:

interface GoalData {
  name: string;
  description: string;
  goalType: 'Habit' | 'Tangible';
  areaId: string; // Select from the provided areas
  targetDate: string; // ISO date string - MUST be in the future, in year ${new Date().getFullYear()} or later
  steps: Array<{
    text: string;
    stepType: 'Habit' | 'Tangible';
    frequency?: number;
    frequencyType?: 'week' | 'month' | 'quarter' | 'year';
    targetDate?: string; // ISO date string - MUST be in the future if provided
    notes?: string;
    tasks: Array<{ text: string; isCompleted: boolean }>;
  }>;
}

Available areas:
${areas.map((area: any) => `- ${area.name} (id: ${area.id}): ${area.description || 'No description'}`).join('\n')}

Be smart about inferring the goal type - if it's primarily about building regular behaviors, make it a Habit. If it's about reaching a specific outcome, make it Tangible.

Choose the most appropriate area based on the goal's content and the available areas. If the goal clearly fits multiple areas, choose the primary one.

IMPORTANT: 
1. Your response must be valid JSON that matches the interface exactly. Do not include any explanatory text outside the JSON.
2. All dates must be in ISO format and must be in the future (${new Date().getFullYear()} or later).
3. If no specific timeframe is mentioned, use one month from today as the default.`;

    // Log before making API call
    console.log('Making Anthropic API call...');

    // Check if API key is set
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('Anthropic API key is not set');
      return NextResponse.json(
        { ...defaultGoal, error: 'API configuration error' },
        { status: 500 }
      );
    }

    const response = await anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 4000,
      temperature: 0,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    // Log API response
    console.log('Received API response:', response.content);

    // Get the response content safely
    const content = response.content[0];
    if (!('text' in content)) {
      console.error('Unexpected response format:', content);
      return NextResponse.json(
        { ...defaultGoal, error: 'Unexpected API response format' },
        { status: 500 }
      );
    }

    // Try to parse the JSON response
    let parsedResult;
    try {
      parsedResult = JSON.parse(content.text);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content.text);
      console.error('Parse error:', parseError);
      return NextResponse.json(
        { ...defaultGoal, error: 'Failed to parse AI response' },
        { status: 500 }
      );
    }

    // Validate the parsed result has required fields
    if (!parsedResult.name || !parsedResult.description || !parsedResult.areaId || !parsedResult.targetDate) {
      console.error('Missing required fields in parsed result:', parsedResult);
      return NextResponse.json(
        { ...defaultGoal, ...parsedResult, error: 'AI response missing required fields' },
        { status: 500 }
      );
    }

    // Ensure steps array exists
    if (!Array.isArray(parsedResult.steps)) {
      parsedResult.steps = [];
    }

    // Ensure dates are valid and in the future
    parsedResult.targetDate = ensureValidFutureDate(parsedResult.targetDate);
    parsedResult.steps = parsedResult.steps.map((step: any): Step => ({
      text: step.text || '',
      stepType: step.stepType || 'Tangible',
      frequency: step.frequency,
      frequencyType: step.frequencyType,
      targetDate: step.targetDate ? ensureValidFutureDate(step.targetDate) : undefined,
      notes: step.notes,
      tasks: Array.isArray(step.tasks) ? step.tasks.map((task: any): Task => ({
        text: task.text || '',
        isCompleted: Boolean(task.isCompleted)
      })) : []
    }));

    console.log('Successfully processed goal:', parsedResult);

    return NextResponse.json(parsedResult);
  } catch (error) {
    // Log the full error
    console.error('Error processing goal:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json(
      { 
        ...defaultGoal,
        error: error instanceof Error ? error.message : 'Failed to process goal'
      },
      { status: 500 }
    );
  }
} 