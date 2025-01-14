"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.Providers = Providers;
const AuthContext_1 = require("@/lib/contexts/AuthContext");
function Providers({ children }) {
    return (<AuthContext_1.AuthProvider>
      {children}
    </AuthContext_1.AuthProvider>);
}
