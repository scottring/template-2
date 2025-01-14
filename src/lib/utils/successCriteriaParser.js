"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseSuccessCriteria = parseSuccessCriteria;
function parseSuccessCriteria(criteria) {
    var lowerCaseCriteria = criteria.toLowerCase();
    var match = lowerCaseCriteria.match(/^(.*) at least (\d+)x\/(\w+)$/);
    if (!match) {
        return null;
    }
    var action = match[1].trim();
    var frequency = parseInt(match[2], 10);
    var unit = match[3];
    return {
        action: action,
        frequency: frequency,
        unit: unit,
    };
}
// Test cases
var testCriteria1 = "go to crossfit at least 2x/week";
var parsed1 = parseSuccessCriteria(testCriteria1);
console.log("Test 1:", parsed1);
var testCriteria2 = "invalid criteria";
var parsed2 = parseSuccessCriteria(testCriteria2);
console.log("Test 2:", parsed2);
