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
exports.default = SettingsPage;
const react_1 = require("react");
const navigation_1 = require("next/navigation");
const AuthContext_1 = require("@/lib/contexts/AuthContext");
const firestore_1 = require("firebase/firestore");
const firebase_1 = require("@/lib/firebase/firebase");
const lucide_react_1 = require("lucide-react");
const FamilyManagement_1 = require("@/components/family/FamilyManagement");
function SettingsPage() {
    const { user, signOutUser } = (0, AuthContext_1.useAuth)();
    const router = (0, navigation_1.useRouter)();
    const [isSubmitting, setIsSubmitting] = (0, react_1.useState)(false);
    const [settings, setSettings] = (0, react_1.useState)({
        emailNotifications: true,
        pushNotifications: true,
        weeklyDigest: true,
        theme: 'light',
    });
    const handleSubmit = (e) => __awaiter(this, void 0, void 0, function* () {
        e.preventDefault();
        if (!user)
            return;
        setIsSubmitting(true);
        try {
            yield (0, firestore_1.updateDoc)((0, firestore_1.doc)(firebase_1.db, 'users', user.uid), {
                settings,
                updatedAt: new Date(),
            });
        }
        catch (error) {
            console.error('Error updating settings:', error);
        }
        finally {
            setIsSubmitting(false);
        }
    });
    const handleSignOut = () => __awaiter(this, void 0, void 0, function* () {
        try {
            yield signOutUser();
            router.push('/auth/signin');
        }
        catch (error) {
            console.error('Error signing out:', error);
        }
    });
    return (<div className="space-y-6">
      <div className="flex items-center gap-x-4">
        <button type="button" onClick={() => router.back()} className="rounded-full p-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
          <lucide_react_1.ArrowLeft className="h-5 w-5"/>
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your account settings and preferences</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="overflow-hidden rounded-lg bg-white shadow">
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900">Account Information</h2>
              <dl className="mt-4 space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900">{user === null || user === void 0 ? void 0 : user.email}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Name</dt>
                  <dd className="mt-1 text-sm text-gray-900">{user === null || user === void 0 ? void 0 : user.displayName}</dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg bg-white shadow">
            <form onSubmit={handleSubmit} className="divide-y divide-gray-200">
              <div className="p-6">
                <h2 className="text-lg font-medium text-gray-900">Notifications</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Manage how you receive notifications and updates
                </p>
                <div className="mt-6 space-y-6">
                  <div className="flex items-center">
                    <input id="emailNotifications" name="emailNotifications" type="checkbox" checked={settings.emailNotifications} onChange={(e) => setSettings((prev) => (Object.assign(Object.assign({}, prev), { emailNotifications: e.target.checked })))} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"/>
                    <label htmlFor="emailNotifications" className="ml-3 text-sm text-gray-700">
                      Email notifications
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input id="pushNotifications" name="pushNotifications" type="checkbox" checked={settings.pushNotifications} onChange={(e) => setSettings((prev) => (Object.assign(Object.assign({}, prev), { pushNotifications: e.target.checked })))} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"/>
                    <label htmlFor="pushNotifications" className="ml-3 text-sm text-gray-700">
                      Push notifications
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input id="weeklyDigest" name="weeklyDigest" type="checkbox" checked={settings.weeklyDigest} onChange={(e) => setSettings((prev) => (Object.assign(Object.assign({}, prev), { weeklyDigest: e.target.checked })))} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"/>
                    <label htmlFor="weeklyDigest" className="ml-3 text-sm text-gray-700">
                      Weekly digest email
                    </label>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <h2 className="text-lg font-medium text-gray-900">Theme</h2>
                <p className="mt-1 text-sm text-gray-500">Choose your preferred theme</p>
                <div className="mt-6">
                  <select id="theme" name="theme" value={settings.theme} onChange={(e) => setSettings((prev) => (Object.assign(Object.assign({}, prev), { theme: e.target.value })))} className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6">
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="system">System</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-end gap-x-6 p-6">
                <button type="submit" disabled={isSubmitting} className="inline-flex justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed">
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="space-y-6">
          <div className="overflow-hidden rounded-lg bg-white shadow">
            <div className="p-6">
              <FamilyManagement_1.FamilyManagement />
            </div>
          </div>

          <div className="overflow-hidden rounded-lg bg-white shadow">
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900">Sign Out</h2>
              <p className="mt-1 text-sm text-gray-500">
                Sign out of your account on this device
              </p>
              <div className="mt-6">
                <button type="button" onClick={handleSignOut} className="inline-flex justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600">
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>);
}
