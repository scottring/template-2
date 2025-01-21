import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isValidDate(d: unknown): d is Date {
  return d instanceof Date && !isNaN(d.getTime());
}

export function safeDate(input?: Date | string | number | null): Date {
  const fallback = new Date();
  if (!input) return fallback;
  const date = input instanceof Date ? input : new Date(input);
  return isValidDate(date) ? date : fallback;
}
