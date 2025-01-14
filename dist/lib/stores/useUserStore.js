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
exports.useUserStore = void 0;
const zustand_1 = require("zustand");
const firestore_1 = require("firebase/firestore");
const firebase_1 = require("@/lib/firebase/firebase");
exports.useUserStore = (0, zustand_1.create)((set, get) => ({
    currentUserProfile: null,
    familyMembers: [],
    setCurrentUserProfile: (profile) => set({ currentUserProfile: profile }),
    setFamilyMembers: (members) => set({ familyMembers: members }),
    fetchUserProfile: (userId) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const userDoc = yield (0, firestore_1.getDoc)((0, firestore_1.doc)(firebase_1.db, 'users', userId));
            if (userDoc.exists()) {
                const profile = Object.assign({ id: userDoc.id }, userDoc.data());
                set({ currentUserProfile: profile });
                // If user has a family, fetch family members
                if (profile.familyId) {
                    get().fetchFamilyMembers(profile.familyId);
                }
            }
        }
        catch (error) {
            console.error('Error fetching user profile:', error);
        }
    }),
    fetchFamilyMembers: (familyId) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const q = (0, firestore_1.query)((0, firestore_1.collection)(firebase_1.db, 'users'), (0, firestore_1.where)('familyId', '==', familyId));
            const querySnapshot = yield (0, firestore_1.getDocs)(q);
            const members = querySnapshot.docs.map((doc) => (Object.assign({ id: doc.id }, doc.data())));
            set({ familyMembers: members });
        }
        catch (error) {
            console.error('Error fetching family members:', error);
        }
    }),
    inviteUserToFamily: (email) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const { currentUserProfile } = get();
            if (!(currentUserProfile === null || currentUserProfile === void 0 ? void 0 : currentUserProfile.familyId))
                return;
            // Find user by email
            const q = (0, firestore_1.query)((0, firestore_1.collection)(firebase_1.db, 'users'), (0, firestore_1.where)('email', '==', email));
            const querySnapshot = yield (0, firestore_1.getDocs)(q);
            if (!querySnapshot.empty) {
                const userDoc = querySnapshot.docs[0];
                yield (0, firestore_1.updateDoc)((0, firestore_1.doc)(firebase_1.db, 'users', userDoc.id), {
                    familyId: currentUserProfile.familyId,
                    sharedWith: (0, firestore_1.arrayUnion)(currentUserProfile.id),
                });
                // Update current user's sharedWith array
                yield (0, firestore_1.updateDoc)((0, firestore_1.doc)(firebase_1.db, 'users', currentUserProfile.id), {
                    sharedWith: (0, firestore_1.arrayUnion)(userDoc.id),
                });
                // Refresh family members
                yield get().fetchFamilyMembers(currentUserProfile.familyId);
            }
        }
        catch (error) {
            console.error('Error inviting user to family:', error);
        }
    }),
    removeUserFromFamily: (userId) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const { currentUserProfile } = get();
            if (!(currentUserProfile === null || currentUserProfile === void 0 ? void 0 : currentUserProfile.familyId))
                return;
            yield (0, firestore_1.updateDoc)((0, firestore_1.doc)(firebase_1.db, 'users', userId), {
                familyId: null,
                sharedWith: (0, firestore_1.arrayRemove)(currentUserProfile.id),
            });
            yield (0, firestore_1.updateDoc)((0, firestore_1.doc)(firebase_1.db, 'users', currentUserProfile.id), {
                sharedWith: (0, firestore_1.arrayRemove)(userId),
            });
            // Refresh family members
            yield get().fetchFamilyMembers(currentUserProfile.familyId);
        }
        catch (error) {
            console.error('Error removing user from family:', error);
        }
    }),
    shareItemWithUser: (userId, itemType, itemId) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const { currentUserProfile } = get();
            if (!currentUserProfile)
                return;
            // Update the shared item's permissions
            yield (0, firestore_1.updateDoc)((0, firestore_1.doc)(firebase_1.db, itemType, itemId), {
                sharedWith: (0, firestore_1.arrayUnion)(userId),
            });
            // Add to user's shared items
            yield (0, firestore_1.updateDoc)((0, firestore_1.doc)(firebase_1.db, 'users', userId), {
                [`shared${itemType}`]: (0, firestore_1.arrayUnion)(itemId),
            });
        }
        catch (error) {
            console.error('Error sharing item:', error);
        }
    }),
    unshareItemWithUser: (userId, itemType, itemId) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const { currentUserProfile } = get();
            if (!currentUserProfile)
                return;
            // Remove user from item's permissions
            yield (0, firestore_1.updateDoc)((0, firestore_1.doc)(firebase_1.db, itemType, itemId), {
                sharedWith: (0, firestore_1.arrayRemove)(userId),
            });
            // Remove from user's shared items
            yield (0, firestore_1.updateDoc)((0, firestore_1.doc)(firebase_1.db, 'users', userId), {
                [`shared${itemType}`]: (0, firestore_1.arrayRemove)(itemId),
            });
        }
        catch (error) {
            console.error('Error unsharing item:', error);
        }
    }),
}));
