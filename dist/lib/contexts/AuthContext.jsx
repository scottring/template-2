"use strict";
"use client";
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
exports.useAuth = exports.AuthContext = void 0;
exports.AuthProvider = AuthProvider;
const react_1 = require("react");
const auth_1 = require("firebase/auth");
const firebase_1 = require("@/lib/firebase/firebase");
const AuthContext = (0, react_1.createContext)({
    user: null,
    loading: true,
    signInWithGoogle: () => __awaiter(void 0, void 0, void 0, function* () { }),
    signOut: () => __awaiter(void 0, void 0, void 0, function* () { }),
});
exports.AuthContext = AuthContext;
function AuthProvider({ children }) {
    const [user, setUser] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(true);
    (0, react_1.useEffect)(() => {
        const unsubscribe = (0, auth_1.onAuthStateChanged)(firebase_1.auth, (user) => {
            setUser(user);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);
    const signInWithGoogle = () => __awaiter(this, void 0, void 0, function* () {
        try {
            const provider = new auth_1.GoogleAuthProvider();
            yield (0, auth_1.signInWithPopup)(firebase_1.auth, provider);
        }
        catch (error) {
            console.error('Error signing in with Google:', error);
            throw error;
        }
    });
    const signOut = () => __awaiter(this, void 0, void 0, function* () {
        try {
            yield signOut();
        }
        catch (error) {
            console.error('Error signing out:', error);
            throw error;
        }
    });
    return (<AuthContext.Provider value={{
            user,
            loading,
            signInWithGoogle,
            signOut,
        }}>
      {children}
    </AuthContext.Provider>);
}
const useAuth = () => {
    const context = (0, react_1.useContext)(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
exports.useAuth = useAuth;
