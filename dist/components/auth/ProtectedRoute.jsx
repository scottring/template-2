"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProtectedRoute = ProtectedRoute;
const react_1 = require("react");
const navigation_1 = require("next/navigation");
const AuthContext_1 = require("@/lib/contexts/AuthContext");
function ProtectedRoute({ children }) {
    const { user, loading } = (0, AuthContext_1.useAuth)();
    const router = (0, navigation_1.useRouter)();
    (0, react_1.useEffect)(() => {
        if (!loading && !user) {
            router.push('/auth/signin');
        }
    }, [user, loading, router]);
    if (loading) {
        return (<div className="flex min-h-screen items-center justify-center">
        <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
      </div>);
    }
    if (!user) {
        return null;
    }
    return <>{children}</>;
}
