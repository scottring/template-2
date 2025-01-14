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
exports.uploadFile = exports.deleteDocument = exports.updateDocument = exports.getDocuments = exports.addDocument = exports.signInWithGoogle = exports.logoutUser = void 0;
const firebase_1 = require("./firebase");
const auth_1 = require("firebase/auth");
const firestore_1 = require("firebase/firestore");
const storage_1 = require("firebase/storage");
// Auth functions
const logoutUser = () => (0, auth_1.signOut)(firebase_1.auth);
exports.logoutUser = logoutUser;
const signInWithGoogle = () => __awaiter(void 0, void 0, void 0, function* () {
    const provider = new auth_1.GoogleAuthProvider();
    try {
        const result = yield (0, auth_1.signInWithPopup)(firebase_1.auth, provider);
        return result.user;
    }
    catch (error) {
        console.error("Error signing in with Google", error);
        throw error;
    }
});
exports.signInWithGoogle = signInWithGoogle;
// Firestore functions
const addDocument = (collectionName, data) => (0, firestore_1.addDoc)((0, firestore_1.collection)(firebase_1.db, collectionName), data);
exports.addDocument = addDocument;
const getDocuments = (collectionName) => __awaiter(void 0, void 0, void 0, function* () {
    const querySnapshot = yield (0, firestore_1.getDocs)((0, firestore_1.collection)(firebase_1.db, collectionName));
    return querySnapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
});
exports.getDocuments = getDocuments;
const updateDocument = (collectionName, id, data) => (0, firestore_1.updateDoc)((0, firestore_1.doc)(firebase_1.db, collectionName, id), data);
exports.updateDocument = updateDocument;
const deleteDocument = (collectionName, id) => (0, firestore_1.deleteDoc)((0, firestore_1.doc)(firebase_1.db, collectionName, id));
exports.deleteDocument = deleteDocument;
// Storage functions
const uploadFile = (file, path) => __awaiter(void 0, void 0, void 0, function* () {
    const storageRef = (0, storage_1.ref)(firebase_1.storage, path);
    yield (0, storage_1.uploadBytes)(storageRef, file);
    return (0, storage_1.getDownloadURL)(storageRef);
});
exports.uploadFile = uploadFile;
