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
exports.useTaskStore = void 0;
const zustand_1 = require("zustand");
const firestore_1 = require("firebase/firestore");
const firebase_1 = require("../firebase/firebase");
exports.useTaskStore = (0, zustand_1.create)((set, get) => ({
    tasks: [],
    setTasks: (tasks) => set({ tasks }),
    addTask: (taskData) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const newTask = Object.assign(Object.assign({}, taskData), { isCompleted: false, createdAt: new Date(), updatedAt: new Date() });
            const docRef = yield (0, firestore_1.addDoc)((0, firestore_1.collection)(firebase_1.db, 'tasks'), newTask);
            const task = Object.assign(Object.assign({}, newTask), { id: docRef.id });
            set((state) => ({ tasks: [...state.tasks, task] }));
        }
        catch (error) {
            console.error('Error adding task:', error);
            throw error;
        }
    }),
    updateTask: (taskId, updates) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const taskRef = (0, firestore_1.doc)(firebase_1.db, 'tasks', taskId);
            const updatedTask = Object.assign(Object.assign({}, updates), { updatedAt: new Date() });
            yield (0, firestore_1.updateDoc)(taskRef, updatedTask);
            set((state) => ({
                tasks: state.tasks.map((task) => task.id === taskId ? Object.assign(Object.assign({}, task), updatedTask) : task),
            }));
        }
        catch (error) {
            console.error('Error updating task:', error);
            throw error;
        }
    }),
    deleteTask: (taskId) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            yield (0, firestore_1.deleteDoc)((0, firestore_1.doc)(firebase_1.db, 'tasks', taskId));
            set((state) => ({
                tasks: state.tasks.filter((task) => task.id !== taskId),
            }));
        }
        catch (error) {
            console.error('Error deleting task:', error);
            throw error;
        }
    }),
    toggleTaskCompletion: (taskId) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const task = get().tasks.find((t) => t.id === taskId);
            if (!task)
                return;
            const taskRef = (0, firestore_1.doc)(firebase_1.db, 'tasks', taskId);
            const updatedTask = { isCompleted: !task.isCompleted, updatedAt: new Date() };
            yield (0, firestore_1.updateDoc)(taskRef, updatedTask);
            set((state) => ({
                tasks: state.tasks.map((t) => t.id === taskId ? Object.assign(Object.assign({}, t), updatedTask) : t),
            }));
        }
        catch (error) {
            console.error('Error toggling task completion:', error);
            throw error;
        }
    }),
}));
