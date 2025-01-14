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
exports.ShareDialog = ShareDialog;
const react_1 = require("react");
const react_2 = require("@headlessui/react");
const useUserStore_1 = require("@/lib/stores/useUserStore");
const FormError_1 = require("@/components/error/FormError");
const lucide_react_1 = require("lucide-react");
function ShareDialog({ open, onClose, itemType, itemId, itemName }) {
    const { currentUserProfile, familyMembers, shareItemWithUser, unshareItemWithUser } = (0, useUserStore_1.useUserStore)();
    const [error, setError] = (0, react_1.useState)();
    const [selectedMembers, setSelectedMembers] = (0, react_1.useState)(new Set());
    const [isSubmitting, setIsSubmitting] = (0, react_1.useState)(false);
    const handleShare = () => __awaiter(this, void 0, void 0, function* () {
        setError(undefined);
        setIsSubmitting(true);
        try {
            // Share with selected members
            const sharePromises = Array.from(selectedMembers).map((memberId) => shareItemWithUser(memberId, itemType, itemId));
            yield Promise.all(sharePromises);
            onClose();
        }
        catch (error) {
            setError('Failed to share item. Please try again.');
        }
        finally {
            setIsSubmitting(false);
        }
    });
    const toggleMember = (memberId) => {
        const newSelected = new Set(selectedMembers);
        if (newSelected.has(memberId)) {
            newSelected.delete(memberId);
        }
        else {
            newSelected.add(memberId);
        }
        setSelectedMembers(newSelected);
    };
    return (<react_2.Transition.Root show={open} as={react_1.Fragment}>
      <react_2.Dialog as="div" className="relative z-50" onClose={onClose}>
        <react_2.Transition.Child as={react_1.Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"/>
        </react_2.Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <react_2.Transition.Child as={react_1.Fragment} enter="ease-out duration-300" enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95" enterTo="opacity-100 translate-y-0 sm:scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 translate-y-0 sm:scale-100" leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95">
              <react_2.Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                  <button type="button" className="rounded-md bg-white text-gray-400 hover:text-gray-500" onClick={onClose}>
                    <span className="sr-only">Close</span>
                    <lucide_react_1.X className="h-6 w-6"/>
                  </button>
                </div>
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                    <lucide_react_1.Share2 className="h-6 w-6 text-blue-600"/>
                  </div>
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                    <react_2.Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900">
                      Share {itemName}
                    </react_2.Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Select family members to share this {itemType.toLowerCase()} with.
                      </p>
                    </div>
                  </div>
                </div>

                <FormError_1.FormError error={error}/>

                <div className="mt-4 divide-y divide-gray-200">
                  {familyMembers
            .filter((member) => member.id !== (currentUserProfile === null || currentUserProfile === void 0 ? void 0 : currentUserProfile.id))
            .map((member) => {
            var _a;
            return (<div key={member.id} className="flex items-center justify-between py-4" onClick={() => toggleMember(member.id)}>
                        <div className="flex items-center min-w-0 gap-x-4">
                          {member.photoURL ? (<img src={member.photoURL} alt={member.displayName} className="h-10 w-10 flex-none rounded-full bg-gray-50"/>) : (<div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-gray-100">
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
                        <div className="ml-4 flex-shrink-0">
                          {selectedMembers.has(member.id) ? (<lucide_react_1.Check className="h-5 w-5 text-blue-600"/>) : null}
                        </div>
                      </div>);
        })}
                </div>

                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                  <button type="button" className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:ml-3 sm:w-auto" onClick={handleShare} disabled={isSubmitting || selectedMembers.size === 0}>
                    Share
                  </button>
                  <button type="button" className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto" onClick={onClose}>
                    Cancel
                  </button>
                </div>
              </react_2.Dialog.Panel>
            </react_2.Transition.Child>
          </div>
        </div>
      </react_2.Dialog>
    </react_2.Transition.Root>);
}
