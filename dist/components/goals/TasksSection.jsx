"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.TasksSection = TasksSection;
const react_1 = require("react");
const lucide_react_1 = require("lucide-react");
const useTaskStore_1 = require("@/lib/stores/useTaskStore");
const CreateTaskDialog_1 = require("@/components/tasks/CreateTaskDialog");
function TasksSection({ goalId }) {
    const [isCreateDialogOpen, setIsCreateDialogOpen] = (0, react_1.useState)(false);
    const { tasks } = (0, useTaskStore_1.useTaskStore)();
    const goalTasks = tasks.filter((task) => task.goalId === goalId);
    return (<div className="overflow-hidden rounded-lg bg-white shadow">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">Tasks</h2>
          <button type="button" onClick={() => setIsCreateDialogOpen(true)} className="inline-flex items-center gap-x-2 rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
            <lucide_react_1.PlusIcon className="-ml-0.5 h-5 w-5" aria-hidden="true"/>
            New Task
          </button>
        </div>
        <div className="mt-6 divide-y divide-gray-200">
          {goalTasks.map((task) => (<div key={task.id} className="flex items-center justify-between py-4">
              <div>
                <h3 className="text-sm font-medium text-gray-900">{task.name}</h3>
                <p className="mt-1 text-sm text-gray-500">{task.description}</p>
              </div>
              <div className="flex items-center gap-x-2">
                <input type="checkbox" checked={task.isCompleted} onChange={() => { }} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"/>
              </div>
            </div>))}
          {goalTasks.length === 0 && (<div className="py-4 text-center text-sm text-gray-500">
              No tasks yet. Create one to get started!
            </div>)}
        </div>
      </div>

      <CreateTaskDialog_1.CreateTaskDialog goalId={goalId} open={isCreateDialogOpen} onClose={() => setIsCreateDialogOpen(false)}/>
    </div>);
}
