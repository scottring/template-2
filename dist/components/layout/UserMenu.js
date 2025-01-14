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
exports.UserMenu = UserMenu;
const react_1 = require("react");
const react_2 = require("@headlessui/react");
const navigation_1 = require("next/navigation");
const AuthContext_1 = require("@/lib/contexts/AuthContext");
const lucide_react_1 = require("lucide-react");
function UserMenu() {
    var _a, _b;
    const { user, signOutUser } = (0, AuthContext_1.useAuth)();
    const router = (0, navigation_1.useRouter)();
    const handleSignOut = () => __awaiter(this, void 0, void 0, function* () {
        try {
            yield signOutUser();
            router.push('/auth/signin');
        }
        catch (error) {
            console.error('Error signing out:', error);
        }
    });
    if (!user)
        return null;
    return (<react_2.Menu as="div" className="relative">
      <react_2.Menu.Button className="flex items-center gap-x-4 rounded-full bg-white p-2 text-sm font-semibold leading-6 text-gray-900 shadow-sm ring-1 ring-gray-900/10 hover:ring-gray-900/20">
        {user.photoURL ? (<img src={user.photoURL} alt={user.displayName || 'User avatar'} className="h-8 w-8 rounded-full bg-gray-50"/>) : (<div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white">
            {((_a = user.displayName) === null || _a === void 0 ? void 0 : _a[0]) || ((_b = user.email) === null || _b === void 0 ? void 0 : _b[0]) || 'U'}
          </div>)}
      </react_2.Menu.Button>
      <react_2.Transition as={react_1.Fragment} enter="transition ease-out duration-100" enterFrom="transform opacity-0 scale-95" enterTo="transform opacity-100 scale-100" leave="transition ease-in duration-75" leaveFrom="transform opacity-100 scale-100" leaveTo="transform opacity-0 scale-95">
        <react_2.Menu.Items className="absolute right-0 z-10 mt-2.5 w-32 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none">
          <react_2.Menu.Item>
            {({ active }) => (<button onClick={() => router.push('/settings')} className={`${active ? 'bg-gray-50' : ''} flex w-full items-center gap-x-3 px-3 py-1 text-sm leading-6 text-gray-900`}>
                <lucide_react_1.Settings className="h-4 w-4"/>
                Settings
              </button>)}
          </react_2.Menu.Item>
          <react_2.Menu.Item>
            {({ active }) => (<button onClick={handleSignOut} className={`${active ? 'bg-gray-50' : ''} flex w-full items-center gap-x-3 px-3 py-1 text-sm leading-6 text-gray-900`}>
                <lucide_react_1.LogOut className="h-4 w-4"/>
                Sign out
              </button>)}
          </react_2.Menu.Item>
        </react_2.Menu.Items>
      </react_2.Transition>
    </react_2.Menu>);
}
