'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useUserStore } from '@/lib/stores/useUserStore';
import { FormError } from '@/components/error/FormError';
import { UserPlus, UserMinus, Share2 } from 'lucide-react';

export function FamilyManagement() {
  const { currentUserProfile, familyMembers, inviteUserToFamily, removeUserFromFamily, shareItemWithUser } =
    useUserStore();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(undefined);
    setIsSubmitting(true);

    try {
      await inviteUserToFamily(email);
      setEmail('');
    } catch (error) {
      setError('Failed to invite user. Please check the email and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async (userId: string) => {
    try {
      await removeUserFromFamily(userId);
    } catch (error) {
      setError('Failed to remove user from family.');
    }
  };

  if (!currentUserProfile) return null;

  return (
    <div className="space-y-6">
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
          <input
            type="email"
            name="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
            placeholder="Enter email address"
            required
          />
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-x-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <UserPlus className="h-4 w-4" />
          Invite
        </button>
      </form>

      <FormError error={error} />

      <div className="divide-y divide-gray-200">
        {familyMembers.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between py-4"
          >
            <div className="flex items-center min-w-0 gap-x-4">
              {member.photoURL ? (
                <Image
                  src={member.photoURL}
                  alt={`${member.displayName}'s profile photo`}
                  width={40}
                  height={40}
                  className="h-12 w-12 flex-none rounded-full bg-gray-50"
                />
              ) : (
                <div className="flex h-12 w-12 flex-none items-center justify-center rounded-full bg-gray-100">
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
            <div className="flex items-center gap-x-4">
              <button
                type="button"
                onClick={() => handleRemove(member.id)}
                className="rounded-full p-1 text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Remove member</span>
                <UserMinus className="h-5 w-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
