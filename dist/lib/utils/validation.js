"use strict";
'use client';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskSchema = exports.projectSchema = exports.goalSchema = exports.areaSchema = exports.dateSchema = exports.descriptionSchema = exports.nameSchema = void 0;
exports.validateData = validateData;
const zod_1 = require("zod");
// Common validation schemas
exports.nameSchema = zod_1.z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters');
exports.descriptionSchema = zod_1.z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional();
exports.dateSchema = zod_1.z.date({
    required_error: 'Date is required',
    invalid_type_error: 'Invalid date format',
});
// Area validation
exports.areaSchema = zod_1.z.object({
    name: exports.nameSchema,
    description: exports.descriptionSchema,
    isActive: zod_1.z.boolean(),
    isFocus: zod_1.z.boolean(),
});
// Goal validation
exports.goalSchema = zod_1.z.object({
    name: exports.nameSchema,
    description: exports.descriptionSchema,
    areaId: zod_1.z.string().min(1, 'Area is required'),
    targetDate: exports.dateSchema,
    successCriteria: zod_1.z.array(zod_1.z.string()).min(1, 'At least one success criterion is required'),
});
// Project validation
exports.projectSchema = zod_1.z.object({
    name: exports.nameSchema,
    description: exports.descriptionSchema,
    goalId: zod_1.z.string().min(1, 'Goal is required'),
    startDate: exports.dateSchema,
    endDate: exports.dateSchema,
    assignedTo: zod_1.z.array(zod_1.z.string()),
});
// Task validation
exports.taskSchema = zod_1.z.object({
    name: exports.nameSchema,
    description: exports.descriptionSchema,
    projectId: zod_1.z.string().optional(),
    dueDate: exports.dateSchema,
    isRecurring: zod_1.z.boolean(),
    completionCriteria: zod_1.z.array(zod_1.z.string()),
    assignedTo: zod_1.z.array(zod_1.z.string()),
    severity: zod_1.z.enum(['low', 'medium', 'high']),
});
// Helper function to validate data
function validateData(schema, data) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const validData = yield schema.parseAsync(data);
            return { success: true, data: validData };
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
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
    });
}
