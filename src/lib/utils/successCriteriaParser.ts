export interface ParsedSuccessCriteria {
  action: string;
  frequency: number;
  unit: string;
}

export function parseSuccessCriteria(criteria: string): ParsedSuccessCriteria | null {
  const lowerCaseCriteria = criteria.toLowerCase();
  const match = lowerCaseCriteria.match(/^(.*) at least (\d+)x\/(\w+)$/);

  if (!match) {
    return null;
  }

  const action = match[1].trim();
  const frequency = parseInt(match[2], 10);
  const unit = match[3];

  return {
    action,
    frequency,
    unit,
  };
}

// Test cases
const testCriteria1 = "go to crossfit at least 2x/week";
const parsed1 = parseSuccessCriteria(testCriteria1);
console.log("Test 1:", parsed1);

const testCriteria2 = "invalid criteria";
const parsed2 = parseSuccessCriteria(testCriteria2);
console.log("Test 2:", parsed2);
