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
exports.default = AreaDetailPage;
const react_1 = require("react");
const firestore_1 = require("firebase/firestore");
const firebase_1 = require("@/lib/firebase/firebase");
const navigation_1 = require("next/navigation");
const lucide_react_1 = require("lucide-react");
const useGoalStore_1 = require("@/lib/stores/useGoalStore");
const CreateGoalDialog_1 = require("@/components/goals/CreateGoalDialog");
const EditGoalDialog_1 = require("@/components/goals/EditGoalDialog");
const react_2 = require("@headlessui/react");
const react_3 = require("react");
function AreaDetailPage({ params }) {
    const [area, setArea] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = (0, react_1.useState)(false);
    const [editingGoal, setEditingGoal] = (0, react_1.useState)(null);
    const router = (0, navigation_1.useRouter)();
    const { goals, setGoals, deleteGoal } = (0, useGoalStore_1.useGoalStore)();
    const areaGoals = goals.filter((goal) => goal.areaId === params.id);
    (0, react_1.useEffect)(() => {
        const unsubscribe = (0, firestore_1.onSnapshot)((0, firestore_1.doc)(firebase_1.db, 'areas', params.id), (doc) => {
            var _a, _b;
            if (doc.exists()) {
                setArea(Object.assign(Object.assign({ id: doc.id }, doc.data()), { createdAt: (_a = doc.data().createdAt) === null || _a === void 0 ? void 0 : _a.toDate(), updatedAt: (_b = doc.data().updatedAt) === null || _b === void 0 ? void 0 : _b.toDate() }));
            }
            else {
                router.push('/areas');
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, [params.id, router]);
    (0, react_1.useEffect)(() => {
        const q = (0, firestore_1.query)((0, firestore_1.collection)(firebase_1.db, 'goals'), (0, firestore_1.orderBy)('createdAt', 'desc'));
        const unsubscribe = (0, firestore_1.onSnapshot)(q, (snapshot) => {
            const goals = snapshot.docs.map((doc) => {
                var _a, _b, _c;
                return (Object.assign(Object.assign({ id: doc.id }, doc.data()), { createdAt: (_a = doc.data().createdAt) === null || _a === void 0 ? void 0 : _a.toDate(), updatedAt: (_b = doc.data().updatedAt) === null || _b === void 0 ? void 0 : _b.toDate(), targetDate: (_c = doc.data().targetDate) === null || _c === void 0 ? void 0 : _c.toDate() }));
            });
            setGoals(goals);
        });
        return () => unsubscribe();
    }, [setGoals]);
    const handleDeleteGoal = (goalId) => __awaiter(this, void 0, void 0, function* () {
        if (window.confirm('Are you sure you want to delete this goal? This action cannot be undone.')) {
            try {
                yield deleteGoal(goalId);
            }
            catch (error) {
                console.error('Error deleting goal:', error);
            }
        }
    });
    if (loading) {
        return (<div className="flex min-h-screen items-center justify-center">
        <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
      </div>);
    }
    if (!area) {
        return null;
    }
    return (<div className="space-y-6">
      <div className="flex items-center gap-x-4">
        <button type="button" onClick={() => router.back()} className="rounded-full p-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
          <lucide_react_1.ArrowLeft className="h-5 w-5"/>
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{area.name}</h1>
          <p className="mt-1 text-sm text-gray-500">{area.description}</p>
        </div>
        <div className="ml-auto">
          <button type="button" onClick={() => setIsCreateDialogOpen(true)} className="inline-flex items-center gap-x-2 rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
            <lucide_react_1.PlusIcon className="-ml-0.5 h-5 w-5" aria-hidden="true"/>
            New Goal
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {areaGoals.map((goal) => (<div key={goal.id} className="relative flex flex-col overflow-hidden rounded-lg border bg-white shadow-sm">
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
                        {({ active }) => (<button onClick={() => setEditingGoal(goal)} className={`${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} block w-full px-4 py-2 text-left text-sm`}>
                            Edit
                          </button>)}
                      </react_2.Menu.Item>
                      <react_2.Menu.Item>
                        {({ active }) => (<button onClick={() => handleDeleteGoal(goal.id)} className={`${active ? 'bg-red-50 text-red-900' : 'text-red-700'} block w-full px-4 py-2 text-left text-sm`}>
                            Delete
                          </button>)}
                      </react_2.Menu.Item>
                    </div>
                  </react_2.Menu.Items>
                </react_2.Transition>
              </react_2.Menu>
            </div>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900">
                {goal.name}
              </h3>
              <p className="mt-2 text-sm text-gray-500">{goal.description}</p>
              <div className="mt-4">
                <div className="relative h-2 overflow-hidden rounded-full bg-gray-200">
                  <div className="absolute inset-y-0 left-0 bg-blue-600 transition-all duration-300" style={{ width: `${goal.progress}%` }}/>
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  {goal.progress}% complete
                </p>
              </div>
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-900">Success Criteria:</h4>
                <ul className="mt-2 space-y-1">
                  {goal.successCriteria.map((criteria, index) => (<li key={index} className="text-sm text-gray-500">
                      • {criteria}
                    </li>))}
                </ul>
              </div>
            </div>
            <div className="mt-auto flex divide-x border-t">
              <button type="button" onClick={() => router.push(`/goals/${goal.id}`)} className="flex w-full items-center justify-center gap-x-2.5 p-3 text-sm font-semibold text-gray-900 hover:bg-gray-50">
                View Details
              </button>
            </div>
          </div>))}

        {areaGoals.length === 0 && (<div className="col-span-full flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center">
            <h3 className="mt-2 text-sm font-semibold text-gray-900">
              No goals defined
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new goal for this area
            </p>
            <button type="button" onClick={() => setIsCreateDialogOpen(true)} className="mt-6 inline-flex items-center gap-x-2 rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
              <lucide_react_1.PlusIcon className="-ml-0.5 h-5 w-5" aria-hidden="true"/>
              New Goal
            </button>
          </div>)}
      </div>

      <CreateGoalDialog_1.CreateGoalDialog areaId={area.id} open={isCreateDialogOpen} onClose={() => setIsCreateDialogOpen(false)}/>

      {editingGoal && (<EditGoalDialog_1.EditGoalDialog goal={editingGoal} open={true} onClose={() => setEditingGoal(null)}/>)}
    </div>);
}
