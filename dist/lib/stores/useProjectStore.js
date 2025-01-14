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
exports.useProjectStore = void 0;
const zustand_1 = require("zustand");
const firestore_1 = require("firebase/firestore");
const firebase_1 = require("../firebase/firebase");
exports.useProjectStore = (0, zustand_1.create)((set) => ({
    projects: [],
    setProjects: (projects) => set({ projects }),
    addProject: (projectData) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const newProject = Object.assign(Object.assign({}, projectData), { progress: 0, createdAt: new Date(), updatedAt: new Date() });
            const docRef = yield (0, firestore_1.addDoc)((0, firestore_1.collection)(firebase_1.db, 'projects'), newProject);
            const project = Object.assign(Object.assign({}, newProject), { id: docRef.id });
            set((state) => ({ projects: [...state.projects, project] }));
        }
        catch (error) {
            console.error('Error adding project:', error);
            throw error;
        }
    }),
    updateProject: (projectId, updates) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const projectRef = (0, firestore_1.doc)(firebase_1.db, 'projects', projectId);
            const updatedProject = Object.assign(Object.assign({}, updates), { updatedAt: new Date() });
            yield (0, firestore_1.updateDoc)(projectRef, updatedProject);
            set((state) => ({
                projects: state.projects.map((project) => project.id === projectId ? Object.assign(Object.assign({}, project), updatedProject) : project),
            }));
        }
        catch (error) {
            console.error('Error updating project:', error);
            throw error;
        }
    }),
    deleteProject: (projectId) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            yield (0, firestore_1.deleteDoc)((0, firestore_1.doc)(firebase_1.db, 'projects', projectId));
            set((state) => ({
                projects: state.projects.filter((project) => project.id !== projectId),
            }));
        }
        catch (error) {
            console.error('Error deleting project:', error);
            throw error;
        }
    }),
}));
