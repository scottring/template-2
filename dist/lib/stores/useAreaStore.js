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
exports.useAreaStore = void 0;
const zustand_1 = require("zustand");
const firestore_1 = require("firebase/firestore");
const firebase_1 = require("../firebase/firebase");
exports.useAreaStore = (0, zustand_1.create)((set) => ({
    areas: [],
    setAreas: (areas) => set({ areas }),
    addArea: (areaData) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const newArea = Object.assign(Object.assign({}, areaData), { createdAt: new Date(), updatedAt: new Date() });
            const docRef = yield (0, firestore_1.addDoc)((0, firestore_1.collection)(firebase_1.db, 'areas'), newArea);
            const area = Object.assign(Object.assign({}, newArea), { id: docRef.id });
            set((state) => ({ areas: [...state.areas, area] }));
        }
        catch (error) {
            console.error('Error adding area:', error);
            throw error;
        }
    }),
    updateArea: (areaId, updates) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const areaRef = (0, firestore_1.doc)(firebase_1.db, 'areas', areaId);
            const updatedArea = Object.assign(Object.assign({}, updates), { updatedAt: new Date() });
            yield (0, firestore_1.updateDoc)(areaRef, updatedArea);
            set((state) => ({
                areas: state.areas.map((area) => area.id === areaId ? Object.assign(Object.assign({}, area), updatedArea) : area),
            }));
        }
        catch (error) {
            console.error('Error updating area:', error);
            throw error;
        }
    }),
    deleteArea: (areaId) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            yield (0, firestore_1.deleteDoc)((0, firestore_1.doc)(firebase_1.db, 'areas', areaId));
            set((state) => ({
                areas: state.areas.filter((area) => area.id !== areaId),
            }));
        }
        catch (error) {
            console.error('Error deleting area:', error);
            throw error;
        }
    }),
}));
