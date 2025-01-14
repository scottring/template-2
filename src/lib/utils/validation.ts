'use client';

import { z } from 'zod';

// Common validation schemas
export const nameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(100, 'Name must be less than 100 characters');

export const descriptionSchema = z
  .string()
  .max(500, 'Description must be less than 500 characters')
  .optional();

export const dateSchema = z.date({
  required_error: 'Date is required',
  invalid_type_error: 'Invalid date format',
});

// Area validation
export const areaSchema = z.object({
  name: nameSchema,
  description: descriptionSchema,
  isActive: z.boolean(),
  isFocus: z.boolean(),
});

// Goal validation
export const goalSchema = z.object({
  name: nameSchema,
  description: descriptionSchema,
  areaId: z.string().min(1, 'Area is required'),
  targetDate: dateSchema,
  successCriteria: z.array(z.string()).min(1, 'At least one success criterion is required'),
});

// Project validation
export const projectSchema = z.object({
  name: nameSchema,
  description: descriptionSchema,
  goalId: z.string().min(1, 'Goal is required'),
  startDate: dateSchema,
  endDate: dateSchema,
  assignedTo: z.array(z.string()),
});

// Task validation
export const taskSchema = z.object({
  name: nameSchema,
  description: descriptionSchema,
  projectId: z.string().optional(),
  dueDate: dateSchema,
  isRecurring: z.boolean(),
  completionCriteria: z.array(z.string()),
  assignedTo: z.array(z.string()),
  severity: z.enum(['low', 'medium', 'high']),
});

// Helper function to validate data
export async function validateData<T>(schema: z.Schema<T>, data: unknown): Promise<{ 
  success: boolean; 
  data?: T; 
  error?: string; 
}> {
  try {
    const validData = await schema.parseAsync(data);
    return { success: true, data: validData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: error.errors.map(e => e.message).join(', ') 
      };
    }
    return { 
      success: false, 
      error: 'Validation failed' 
    };
  }
} 