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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Dashboard = Dashboard;
const react_1 = require("react");
const react_2 = require("@headlessui/react");
const lucide_react_1 = require("lucide-react");
const utils_1 = require("@/lib/utils");
const link_1 = __importDefault(require("next/link"));
const navigation_1 = require("next/navigation");
const DashboardContent_1 = require("./DashboardContent");
const AuthContext_1 = require("@/lib/contexts/AuthContext");
const navigation = [
    { name: 'Dashboard', href: '/', icon: lucide_react_1.Home },
    { name: 'Areas', href: '/areas', icon: lucide_react_1.Folder },
    { name: 'Goals', href: '/goals', icon: lucide_react_1.Target },
    { name: 'Tasks', href: '/tasks', icon: lucide_react_1.CheckCircle },
    { name: 'Calendar', href: '/calendar', icon: lucide_react_1.Calendar },
    { name: 'Family', href: '/family', icon: lucide_react_1.Users },
];
function Dashboard() {
    const [sidebarOpen, setSidebarOpen] = (0, react_1.useState)(false);
    const pathname = (0, navigation_1.usePathname)();
    const { user, signOut } = (0, AuthContext_1.useAuth)();
    const handleSignOut = () => __awaiter(this, void 0, void 0, function* () {
        try {
            yield signOut();
        }
        catch (error) {
            console.error('Error signing out:', error);
        }
    });
    return (<>
      <div>
        <react_2.Transition.Root show={sidebarOpen} as={react_1.Fragment}>
          <react_2.Dialog as="div" className="relative z-50 lg:hidden" onClose={setSidebarOpen}>
            <react_2.Transition.Child as={react_1.Fragment} enter="transition-opacity ease-linear duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="transition-opacity ease-linear duration-300" leaveFrom="opacity-100" leaveTo="opacity-0">
              <div className="fixed inset-0 bg-gray-900/80"/>
            </react_2.Transition.Child>

            <div className="fixed inset-0 flex">
              <react_2.Transition.Child as={react_1.Fragment} enter="transition ease-in-out duration-300 transform" enterFrom="-translate-x-full" enterTo="translate-x-0" leave="transition ease-in-out duration-300 transform" leaveFrom="translate-x-0" leaveTo="-translate-x-full">
                <react_2.Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                  <react_2.Transition.Child as={react_1.Fragment} enter="ease-in-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in-out duration-300" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                      <button type="button" className="-m-2.5 p-2.5" onClick={() => setSidebarOpen(false)}>
                        <span className="sr-only">Close sidebar</span>
                        <lucide_react_1.X className="h-6 w-6 text-white" aria-hidden="true"/>
                      </button>
                    </div>
                  </react_2.Transition.Child>
                  <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4">
                    <div className="flex h-16 shrink-0 items-center">
                      <h1 className="text-2xl font-bold">FamilyGoals</h1>
                    </div>
                    <nav className="flex flex-1 flex-col">
                      <ul role="list" className="flex flex-1 flex-col gap-y-7">
                        <li>
                          <ul role="list" className="-mx-2 space-y-1">
                            {navigation.map((item) => (<li key={item.name}>
                                <link_1.default href={item.href} className={(0, utils_1.classNames)(pathname === item.href
                ? 'bg-gray-50 text-blue-600'
                : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50', 'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold')}>
                                  <item.icon className={(0, utils_1.classNames)(pathname === item.href ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-600', 'h-6 w-6 shrink-0')} aria-hidden="true"/>
                                  {item.name}
                                </link_1.default>
                              </li>))}
                          </ul>
                        </li>
                      </ul>
                    </nav>
                  </div>
                </react_2.Dialog.Panel>
              </react_2.Transition.Child>
            </div>
          </react_2.Dialog>
        </react_2.Transition.Root>

        {/* Static sidebar for desktop */}
        <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
          <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 pb-4">
            <div className="flex h-16 shrink-0 items-center">
              <h1 className="text-2xl font-bold">FamilyGoals</h1>
            </div>
            <nav className="flex flex-1 flex-col">
              <ul role="list" className="flex flex-1 flex-col gap-y-7">
                <li>
                  <ul role="list" className="-mx-2 space-y-1">
                    {navigation.map((item) => (<li key={item.name}>
                        <link_1.default href={item.href} className={(0, utils_1.classNames)(pathname === item.href
                ? 'bg-gray-50 text-blue-600'
                : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50', 'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold')}>
                          <item.icon className={(0, utils_1.classNames)(pathname === item.href ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-600', 'h-6 w-6 shrink-0')} aria-hidden="true"/>
                          {item.name}
                        </link_1.default>
                      </li>))}
                  </ul>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        <div className="lg:pl-72">
          <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
            <button type="button" className="-m-2.5 p-2.5 text-gray-700 lg:hidden" onClick={() => setSidebarOpen(true)}>
              <span className="sr-only">Open sidebar</span>
              <lucide_react_1.Menu className="h-6 w-6" aria-hidden="true"/>
            </button>

            <div className="h-6 w-px bg-gray-200 lg:hidden" aria-hidden="true"/>

            <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
              <div className="flex flex-1"></div>
              <div className="flex items-center gap-x-4 lg:gap-x-6">
                <react_2.Menu as="div" className="relative">
                  <react_2.Menu.Button className="-m-1.5 flex items-center p-1.5">
                    <span className="sr-only">Open user menu</span>
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-gray-100"></div>
                      <span className="ml-3 hidden text-sm font-medium text-gray-700 lg:block">
                        {user === null || user === void 0 ? void 0 : user.displayName}
                      </span>
                    </div>
                  </react_2.Menu.Button>
                  <react_2.Transition as={react_1.Fragment} enter="transition ease-out duration-100" enterFrom="transform opacity-0 scale-95" enterTo="transform opacity-100 scale-100" leave="transition ease-in duration-75" leaveFrom="transform opacity-100 scale-100" leaveTo="transform opacity-0 scale-95">
                    <react_2.Menu.Items className="absolute right-0 z-10 mt-2.5 w-32 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none">
                      <react_2.Menu.Item>
                        {({ active }) => (<button onClick={handleSignOut} className={(0, utils_1.classNames)(active ? 'bg-gray-50' : '', 'flex w-full items-center px-3 py-1.5 text-sm text-gray-900')}>
                            <lucide_react_1.LogOut className="mr-2 h-4 w-4"/>
                            Sign out
                          </button>)}
                      </react_2.Menu.Item>
                    </react_2.Menu.Items>
                  </react_2.Transition>
                </react_2.Menu>
              </div>
            </div>
          </div>

          <main className="py-10">
            <div className="px-4 sm:px-6 lg:px-8">
              <DashboardContent_1.DashboardContent />
            </div>
          </main>
        </div>
      </div>
    </>);
}
