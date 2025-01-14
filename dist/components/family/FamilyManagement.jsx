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
exports.FamilyManagement = FamilyManagement;
const react_1 = require("react");
const useUserStore_1 = require("@/lib/stores/useUserStore");
const FormError_1 = require("@/components/error/FormError");
const lucide_react_1 = require("lucide-react");
function FamilyManagement() {
    const { currentUserProfile, familyMembers, inviteUserToFamily, removeUserFromFamily, shareItemWithUser } = (0, useUserStore_1.useUserStore)();
    const [email, setEmail] = (0, react_1.useState)('');
    const [error, setError] = (0, react_1.useState)();
    const [isSubmitting, setIsSubmitting] = (0, react_1.useState)(false);
    const handleInvite = (e) => __awaiter(this, void 0, void 0, function* () {
        e.preventDefault();
        setError(undefined);
        setIsSubmitting(true);
        try {
            yield inviteUserToFamily(email);
            setEmail('');
        }
        catch (error) {
            setError('Failed to invite user. Please check the email and try again.');
        }
        finally {
            setIsSubmitting(false);
        }
    });
    const handleRemove = (userId) => __awaiter(this, void 0, void 0, function* () {
        try {
            yield removeUserFromFamily(userId);
        }
        catch (error) {
            setError('Failed to remove user from family.');
        }
    });
    if (!currentUserProfile)
        return null;
    return (<div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-gray-900">Family Members</h2>
        <p className="mt-1 text-sm text-gray-500">
          Manage your family members and their access to shared goals and tasks.
        </p>
      </div>

      <form onSubmit={handleInvite} className="flex gap-x-4">
        <div className="flex-grow">
          <label htmlFor="email" className="sr-only">
            Email address
          </label>
          <input type="email" name="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6" placeholder="Enter email address" required/>
        </div>
        <button type="submit" disabled={isSubmitting} className="inline-flex items-center gap-x-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed">
          <lucide_react_1.UserPlus className="h-4 w-4"/>
          Invite
        </button>
      </form>

      <FormError_1.FormError error={error}/>

      <div className="divide-y divide-gray-200">
        {familyMembers.map((member) => {
            var _a;
            return (<div key={member.id} className="flex items-center justify-between py-4">
            <div className="flex items-center min-w-0 gap-x-4">
              {member.photoURL ? (<img src={member.photoURL} alt={member.displayName} className="h-12 w-12 flex-none rounded-full bg-gray-50"/>) : (<div className="flex h-12 w-12 flex-none items-center justify-center rounded-full bg-gray-100">
                  {((_a = member.displayName) === null || _a === void 0 ? void 0 : _a[0]) || member.email[0]}
                </div>)}
              <div className="min-w-0 flex-auto">
                <p className="text-sm font-semibold leading-6 text-gray-900">
                  {member.displayName}
                </p>
                <p className="mt-1 truncate text-xs leading-5 text-gray-500">
                  {member.email}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-x-4">
              <button type="button" onClick={() => handleRemove(member.id)} className="rounded-full p-1 text-gray-400 hover:text-gray-500">
                <span className="sr-only">Remove member</span>
                <lucide_react_1.UserMinus className="h-5 w-5"/>
              </button>
            </div>
          </div>);
        })}
      </div>
    </div>);
}
