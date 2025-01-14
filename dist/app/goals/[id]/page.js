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
exports.default = GoalDetailPage;
const react_1 = require("react");
const firestore_1 = require("firebase/firestore");
const firebase_1 = require("@/lib/firebase/firebase");
const navigation_1 = require("next/navigation");
const lucide_react_1 = require("lucide-react");
const useGoalStore_1 = require("@/lib/stores/useGoalStore");
const useProjectStore_1 = require("@/lib/stores/useProjectStore");
const EditGoalDialog_1 = require("@/components/goals/EditGoalDialog");
const CreateProjectDialog_1 = require("@/components/projects/CreateProjectDialog");
const TasksSection_1 = require("@/components/goals/TasksSection");
function GoalDetailPage({ params }) {
    const [goal, setGoal] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [isEditDialogOpen, setIsEditDialogOpen] = (0, react_1.useState)(false);
    const [isCreateProjectDialogOpen, setIsCreateProjectDialogOpen] = (0, react_1.useState)(false);
    const router = (0, navigation_1.useRouter)();
    const { deleteGoal } = (0, useGoalStore_1.useGoalStore)();
    const { projects, setProjects } = (0, useProjectStore_1.useProjectStore)();
    const goalProjects = projects.filter((project) => project.goalId === params.id);
    (0, react_1.useEffect)(() => {
        const unsubscribe = (0, firestore_1.onSnapshot)((0, firestore_1.doc)(firebase_1.db, 'goals', params.id), (doc) => {
            var _a, _b, _c;
            if (doc.exists()) {
                setGoal(Object.assign(Object.assign({ id: doc.id }, doc.data()), { createdAt: (_a = doc.data().createdAt) === null || _a === void 0 ? void 0 : _a.toDate(), updatedAt: (_b = doc.data().updatedAt) === null || _b === void 0 ? void 0 : _b.toDate(), targetDate: (_c = doc.data().targetDate) === null || _c === void 0 ? void 0 : _c.toDate() }));
            }
            else {
                router.push('/areas');
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, [params.id, router]);
    (0, react_1.useEffect)(() => {
        const q = (0, firestore_1.query)((0, firestore_1.collection)(firebase_1.db, 'projects'), (0, firestore_1.orderBy)('createdAt', 'desc'));
        const unsubscribe = (0, firestore_1.onSnapshot)(q, (snapshot) => {
            const projects = snapshot.docs.map((doc) => {
                var _a, _b, _c, _d;
                return (Object.assign(Object.assign({ id: doc.id }, doc.data()), { createdAt: (_a = doc.data().createdAt) === null || _a === void 0 ? void 0 : _a.toDate(), updatedAt: (_b = doc.data().updatedAt) === null || _b === void 0 ? void 0 : _b.toDate(), startDate: (_c = doc.data().startDate) === null || _c === void 0 ? void 0 : _c.toDate(), endDate: (_d = doc.data().endDate) === null || _d === void 0 ? void 0 : _d.toDate() }));
            });
            setProjects(projects);
        });
        return () => unsubscribe();
    }, [setProjects]);
    const handleDeleteGoal = () => __awaiter(this, void 0, void 0, function* () {
        if (window.confirm('Are you sure you want to delete this goal? This action cannot be undone.')) {
            try {
                yield deleteGoal(goal.id);
                router.push('/areas');
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
    if (!goal) {
        return null;
    }
    return (<div className="space-y-6">
      <div className="flex items-center gap-x-4">
        <button type="button" onClick={() => router.back()} className="rounded-full p-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
          <lucide_react_1.ArrowLeft className="h-5 w-5"/>
        </button>
        <div className="flex-grow">
          <h1 className="text-2xl font-semibold text-gray-900">{goal.name}</h1>
          <p className="mt-1 text-sm text-gray-500">{goal.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="overflow-hidden rounded-lg bg-white shadow">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900">Progress</h2>
                <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-sm font-medium text-blue-800">
                  {goal.progress}% Complete
                </span>
              </div>
              <div className="mt-4">
                <div className="relative h-2 overflow-hidden rounded-full bg-gray-200">
                  <div className="absolute inset-y-0 left-0 bg-blue-600 transition-all duration-300" style={{ width: `${goal.progress}%` }}/>
                </div>
              </div>
            </div>
          </div>

          <TasksSection_1.TasksSection goalId={params.id}/>

          <div className="overflow-hidden rounded-lg bg-white shadow">
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 flex items-center justify-between">
                Projects
                <button type="button" onClick={() => setIsCreateProjectDialogOpen(true)} className="inline-flex items-center rounded-md bg-blue-600 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
                  <lucide_react_1.PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true"/>
                  New Project
                </button>
              </h2>
              <div className="mt-6 divide-y divide-gray-200">
                {goalProjects.map((project) => (<div key={project.id} className="flex items-center justify-between py-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">{project.name}</h3>
                      <p className="mt-1 text-sm text-gray-500">{project.description}</p>
                    </div>
                    <button type="button" onClick={() => router.push(`/projects/${project.id}`)} className="inline-flex items-center rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                      View Details
                    </button>
                  </div>))}
                {goalProjects.length === 0 && (<div className="py-4 text-center text-sm text-gray-500">
                    No projects yet. Create one to get started!
                  </div>)}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="overflow-hidden rounded-lg bg-white shadow">
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900">Details</h2>
              <dl className="mt-4 space-y-4">
                <div className="flex items-center gap-x-4">
                  <dt className="flex-shrink-0">
                    <lucide_react_1.Calendar className="h-5 w-5 text-gray-400" aria-hidden="true"/>
                  </dt>
                  <dd className="text-sm text-gray-900">
                    Due by {goal.targetDate.toLocaleDateString()}
                  </dd>
                </div>
                <div>
                  <dt className="flex items-center gap-x-4">
                    <lucide_react_1.Target className="h-5 w-5 text-gray-400" aria-hidden="true"/>
                    <span className="text-sm font-medium text-gray-900">Success Criteria</span>
                  </dt>
                  <dd className="mt-2 text-sm text-gray-500">
                    <ul className="space-y-2">
                      {goal.successCriteria.map((criteria, index) => (<li key={index} className="flex items-start gap-x-2">
                          <lucide_react_1.CheckCircle className="h-5 w-5 text-gray-400" aria-hidden="true"/>
                          <span>{criteria}</span>
                        </li>))}
                    </ul>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {isEditDialogOpen && (<EditGoalDialog_1.EditGoalDialog goal={goal} open={isEditDialogOpen} onClose={() => setIsEditDialogOpen(false)}/>)}

      <CreateProjectDialog_1.CreateProjectDialog goalId={goal.id} open={isCreateProjectDialogOpen} onClose={() => setIsCreateProjectDialogOpen(false)}/>
    </div>);
}
