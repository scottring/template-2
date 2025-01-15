import { TimeScale } from '@/types/models';

export function getNextOccurrence(startDate: Date, timeScale: TimeScale): Date {
  const now = new Date();
  const date = new Date(Math.max(startDate.getTime(), now.getTime()));
  
  switch (timeScale) {
    case 'daily':
      // Next day at 4am
      date.setDate(date.getDate() + 1);
      date.setHours(4, 0, 0, 0);
      break;
      
    case 'weekly':
      // Next Sunday at 4am
      date.setDate(date.getDate() + ((7 - date.getDay()) % 7));
      date.setHours(4, 0, 0, 0);
      break;
      
    case 'monthly':
      // First Sunday of next month at 4am
      date.setDate(1); // First of current month
      date.setMonth(date.getMonth() + 1); // Next month
      // Find first Sunday
      while (date.getDay() !== 0) {
        date.setDate(date.getDate() + 1);
      }
      date.setHours(4, 0, 0, 0);
      break;
      
    case 'quarterly':
      // First Sunday of next quarter at 4am
      date.setDate(1);
      const currentQuarter = Math.floor(date.getMonth() / 3);
      date.setMonth((currentQuarter + 1) * 3); // First month of next quarter
      // Find first Sunday
      while (date.getDay() !== 0) {
        date.setDate(date.getDate() + 1);
      }
      date.setHours(4, 0, 0, 0);
      break;
      
    case 'yearly':
      // First Sunday of next year at 4am
      date.setFullYear(date.getFullYear() + 1);
      date.setMonth(0);
      date.setDate(1);
      // Find first Sunday
      while (date.getDay() !== 0) {
        date.setDate(date.getDate() + 1);
      }
      date.setHours(4, 0, 0, 0);
      break;
  }
  
  return date;
}

export function generateItineraryDates(
  startDate: Date,
  endDate: Date,
  timeScale: TimeScale
): Date[] {
  const dates: Date[] = [];
  let currentDate = getNextOccurrence(startDate, timeScale);
  
  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate = getNextOccurrence(currentDate, timeScale);
  }
  
  return dates;
}

export function getTimeBlocksForDay(date: Date = new Date()): { start: Date; end: Date }[] {
  const blocks: { start: Date; end: Date }[] = [];
  const dayStart = new Date(date);
  dayStart.setHours(4, 0, 0, 0); // 4am
  
  const dayEnd = new Date(date);
  dayEnd.setHours(22, 0, 0, 0); // 10pm
  
  let currentTime = new Date(dayStart);
  
  while (currentTime < dayEnd) {
    const blockStart = new Date(currentTime);
    currentTime.setMinutes(currentTime.getMinutes() + 30);
    const blockEnd = new Date(currentTime);
    
    blocks.push({
      start: blockStart,
      end: blockEnd,
    });
  }
  
  return blocks;
} 