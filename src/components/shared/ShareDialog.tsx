'use client';

import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useUserStore } from '@/lib/stores/useUserStore';
import { FormError } from '@/components/error/FormError';
import { X, Share2, Check } from 'lucide-react';

interface ShareDialogProps {
  open: boolean;
  onClose: () => void;
  itemType: string;
  itemId: string;
  itemName: string;
}

export function ShareDialog({ open, onClose, itemType, itemId, itemName }: ShareDialogProps) {
  const { currentUserProfile, familyMembers, shareItemWithUser, unshareItemWithUser } = useUserStore();
  const [error, setError] = useState<string>();
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleShare = async () => {
    setError(undefined);
    setIsSubmitting(true);

    try {
      // Share with selected members
      const sharePromises = Array.from(selectedMembers).map((memberId) =>
        shareItemWithUser(memberId, itemType, itemId)
      );
      await Promise.all(sharePromises);
      onClose();
    } catch (error) {
      setError('Failed to share item. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMember = (memberId: string) => {
    const newSelected = new Set(selectedMembers);
    if (newSelected.has(memberId)) {
      newSelected.delete(memberId);
    } else {
      newSelected.add(memberId);
    }
    setSelectedMembers(newSelected);
  };

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                    <Share2 className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                    <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900">
                      Share {itemName}
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Select family members to share this {itemType.toLowerCase()} with.
                      </p>
                    </div>
                  </div>
                </div>

                <FormError error={error} />

                <div className="mt-4 divide-y divide-gray-200">
                  {familyMembers
                    .filter((member) => member.id !== currentUserProfile?.id)
                    .map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between py-4"
                        onClick={() => toggleMember(member.id)}
                      >
                        <div className="flex items-center min-w-0 gap-x-4">
                          {member.photoURL ? (
                            <img
                              src={member.photoURL}
                              alt={member.displayName}
                              className="h-10 w-10 flex-none rounded-full bg-gray-50"
                            />
                          ) : (
                            <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-gray-100">
                              {member.displayName?.[0] || member.email[0]}
                            </div>
                          )}
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
                          {selectedMembers.has(member.id) ? (
                            <Check className="h-5 w-5 text-blue-600" />
                          ) : null}
                        </div>
                      </div>
                    ))}
                </div>

                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:ml-3 sm:w-auto"
                    onClick={handleShare}
                    disabled={isSubmitting || selectedMembers.size === 0}
                  >
                    Share
                  </button>
                  <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                    onClick={onClose}
                  >
                    Cancel
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
} 