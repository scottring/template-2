"use strict";
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
exports.useGoalStore = void 0;
const zustand_1 = require("zustand");
const firestore_1 = require("firebase/firestore");
const firebase_1 = require("../firebase/firebase");
exports.useGoalStore = (0, zustand_1.create)((set) => ({
    goals: [],
    setGoals: (goals) => set({ goals }),
    addGoal: (goalData) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const newGoal = Object.assign(Object.assign({}, goalData), { progress: 0, createdAt: new Date(), updatedAt: new Date() });
            const docRef = yield (0, firestore_1.addDoc)((0, firestore_1.collection)(firebase_1.db, 'goals'), newGoal);
            const goal = Object.assign(Object.assign({}, newGoal), { id: docRef.id });
            set((state) => ({ goals: [...state.goals, goal] }));
        }
        catch (error) {
            console.error('Error adding goal:', error);
            throw error;
        }
    }),
    updateGoal: (goalId, updates) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const goalRef = (0, firestore_1.doc)(firebase_1.db, 'goals', goalId);
            const updatedGoal = Object.assign(Object.assign({}, updates), { updatedAt: new Date() });
            yield (0, firestore_1.updateDoc)(goalRef, updatedGoal);
            set((state) => ({
                goals: state.goals.map((goal) => goal.id === goalId ? Object.assign(Object.assign({}, goal), updatedGoal) : goal),
            }));
        }
        catch (error) {
            console.error('Error updating goal:', error);
            throw error;
        }
    }),
    deleteGoal: (goalId) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            yield (0, firestore_1.deleteDoc)((0, firestore_1.doc)(firebase_1.db, 'goals', goalId));
            set((state) => ({
                goals: state.goals.filter((goal) => goal.id !== goalId),
            }));
        }
        catch (error) {
            console.error('Error deleting goal:', error);
            throw error;
        }
    }),
}));
