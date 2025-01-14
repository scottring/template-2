"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metadata = void 0;
exports.default = RootLayout;
const google_1 = require("next/font/google");
require("./globals.css");
const AuthContext_1 = require("@/lib/contexts/AuthContext");
const ProtectedRoute_1 = require("@/components/auth/ProtectedRoute");
const UserMenu_1 = require("@/components/layout/UserMenu");
const ErrorBoundary_1 = require("@/components/error/ErrorBoundary");
const inter = (0, google_1.Inter)({ subsets: ["latin"] });
exports.metadata = {
    title: "FamilyGoals - Collaborative Life Planning",
    description: "Transform your family's aspirations into achievable actions",
};
function RootLayout({ children, }) {
    return (<html lang="en" className="h-full">
      <body className={`${inter.className} h-full`}>
        <AuthContext_1.AuthProvider>
          <ErrorBoundary_1.ErrorBoundary>
            <ProtectedRoute_1.ProtectedRoute>
              <div className="min-h-full">
                <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
                  <div className="flex flex-1 justify-end gap-x-4 self-stretch lg:gap-x-6">
                    <div className="flex items-center gap-x-4 lg:gap-x-6">
                      <UserMenu_1.UserMenu />
                    </div>
                  </div>
                </div>
                <main className="py-10">
                  <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {children}
                  </div>
                </main>
              </div>
            </ProtectedRoute_1.ProtectedRoute>
          </ErrorBoundary_1.ErrorBoundary>
        </AuthContext_1.AuthProvider>
      </body>
    </html>);
}
