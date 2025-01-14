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
exports.default = AreasPage;
const useAreaStore_1 = require("@/lib/stores/useAreaStore");
const lucide_react_1 = require("lucide-react");
const react_1 = require("react");
const CreateAreaDialog_1 = require("@/components/areas/CreateAreaDialog");
const EditAreaDialog_1 = require("@/components/areas/EditAreaDialog");
const firestore_1 = require("firebase/firestore");
const firebase_1 = require("@/lib/firebase/firebase");
const react_2 = require("@headlessui/react");
const react_3 = require("react");
const navigation_1 = require("next/navigation");
function AreasPage() {
    const { areas, setAreas, deleteArea } = (0, useAreaStore_1.useAreaStore)();
    const [isCreateDialogOpen, setIsCreateDialogOpen] = (0, react_1.useState)(false);
    const [editingArea, setEditingArea] = (0, react_1.useState)(null);
    const router = (0, navigation_1.useRouter)();
    (0, react_1.useEffect)(() => {
        let isMounted = true;
        const q = (0, firestore_1.query)((0, firestore_1.collection)(firebase_1.db, 'areas'), (0, firestore_1.orderBy)('createdAt', 'desc'));
        const unsubscribe = (0, firestore_1.onSnapshot)(q, (snapshot) => {
            if (!isMounted)
                return;
            const newAreas = snapshot.docs.map((doc) => {
                var _a, _b;
                return (Object.assign(Object.assign({ id: doc.id }, doc.data()), { createdAt: (_a = doc.data().createdAt) === null || _a === void 0 ? void 0 : _a.toDate(), updatedAt: (_b = doc.data().updatedAt) === null || _b === void 0 ? void 0 : _b.toDate() }));
            });
            // Only update if areas have actually changed
            if (JSON.stringify(newAreas) !== JSON.stringify(areas)) {
                setAreas(newAreas);
            }
        });
        return () => {
            isMounted = false;
            unsubscribe();
        };
    }, [setAreas, areas]);
    const handleDelete = (areaId) => __awaiter(this, void 0, void 0, function* () {
        if (window.confirm('Are you sure you want to delete this area? This action cannot be undone.')) {
            try {
                yield deleteArea(areaId);
            }
            catch (error) {
                console.error('Error deleting area:', error);
            }
        }
    });
    return (<div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Life Areas</h1>
        <button type="button" onClick={() => setIsCreateDialogOpen(true)} className="inline-flex items-center gap-x-2 rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
          <lucide_react_1.PlusIcon className="-ml-0.5 h-5 w-5" aria-hidden="true"/>
          New Area
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {areas.map((area) => (<div key={area.id} className="relative flex flex-col overflow-hidden rounded-lg border bg-white shadow-sm">
            <div className="absolute right-4 top-4">
              <react_2.Menu as="div" className="relative inline-block text-left">
                <react_2.Menu.Button className="flex items-center rounded-full bg-white text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                  <span className="sr-only">Open options</span>
                  <lucide_react_1.MoreVertical className="h-5 w-5" aria-hidden="true"/>
                </react_2.Menu.Button>
                <react_2.Transition as={react_3.Fragment} enter="transition ease-out duration-100" enterFrom="transform opacity-0 scale-95" enterTo="transform opacity-100 scale-100" leave="transition ease-in duration-75" leaveFrom="transform opacity-100 scale-100" leaveTo="transform opacity-0 scale-95">
                  <react_2.Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="py-1">
                      <react_2.Menu.Item>
                        {({ active }) => (<button onClick={() => setEditingArea(area)} className={`${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} block w-full px-4 py-2 text-left text-sm`}>
                            Edit
                          </button>)}
                      </react_2.Menu.Item>
                      <react_2.Menu.Item>
                        {({ active }) => (<button onClick={() => handleDelete(area.id)} className={`${active ? 'bg-red-50 text-red-900' : 'text-red-700'} block w-full px-4 py-2 text-left text-sm`}>
                            Delete
                          </button>)}
                      </react_2.Menu.Item>
                    </div>
                  </react_2.Menu.Items>
                </react_2.Transition>
              </react_2.Menu>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-x-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  {area.name}
                </h3>
                {area.isFocus && (<span className="inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20">
                    Focus
                  </span>)}
                {area.isActive && (<span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                    Active
                  </span>)}
              </div>
              <p className="mt-2 text-sm text-gray-500">{area.description}</p>
            </div>
            <div className="mt-auto flex divide-x border-t">
              <button type="button" onClick={() => router.push(`/areas/${area.id}`)} className="flex w-full items-center justify-center gap-x-2.5 p-3 text-sm font-semibold text-gray-900 hover:bg-gray-50">
                View Goals
              </button>
            </div>
          </div>))}

        {areas.length === 0 && (<div className="col-span-full flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center">
            <h3 className="mt-2 text-sm font-semibold text-gray-900">
              No areas defined
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new life area
            </p>
            <button type="button" onClick={() => setIsCreateDialogOpen(true)} className="mt-6 inline-flex items-center gap-x-2 rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
              <lucide_react_1.PlusIcon className="-ml-0.5 h-5 w-5" aria-hidden="true"/>
              New Area
            </button>
          </div>)}
      </div>

      <CreateAreaDialog_1.CreateAreaDialog open={isCreateDialogOpen} onClose={() => setIsCreateDialogOpen(false)}/>

      {editingArea && (<EditAreaDialog_1.EditAreaDialog area={editingArea} open={true} onClose={() => setEditingArea(null)}/>)}
    </div>);
}
