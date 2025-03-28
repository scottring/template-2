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
exports.CreateProjectDialog = CreateProjectDialog;
const react_1 = require("react");
const react_2 = require("@headlessui/react");
const lucide_react_1 = require("lucide-react");
const useProjectStore_1 = require("@/lib/stores/useProjectStore");
function CreateProjectDialog({ goalId, open, onClose }) {
    const addProject = (0, useProjectStore_1.useProjectStore)((state) => state.addProject);
    const [formData, setFormData] = (0, react_1.useState)({
        name: '',
        description: '',
        goalId: goalId,
        startDate: new Date(),
        endDate: new Date(),
        progress: 0,
        assignedTo: [],
    });
    const [isSubmitting, setIsSubmitting] = (0, react_1.useState)(false);
    const handleSubmit = (e) => __awaiter(this, void 0, void 0, function* () {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            yield addProject(formData);
            onClose();
            setFormData({
                name: '',
                description: '',
                goalId: goalId,
                startDate: new Date(),
                endDate: new Date(),
                progress: 0,
                assignedTo: [],
            });
        }
        catch (error) {
            console.error('Error creating project:', error);
        }
        finally {
            setIsSubmitting(false);
        }
    });
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
                  <button type="button" className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" onClick={onClose}>
                    <span className="sr-only">Close</span>
                    <lucide_react_1.X className="h-6 w-6" aria-hidden="true"/>
                  </button>
                </div>
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <react_2.Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                      Create New Project
                    </react_2.Dialog.Title>
                    <div className="mt-4">
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                          <label htmlFor="name" className="block text-sm font-medium leading-6 text-gray-900">
                            Name
                          </label>
                          <div className="mt-2">
                            <input type="text" name="name" id="name" required value={formData.name} onChange={(e) => setFormData((prev) => (Object.assign(Object.assign({}, prev), { name: e.target.value })))} className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"/>
                          </div>
                        </div>

                        <div>
                          <label htmlFor="description" className="block text-sm font-medium leading-6 text-gray-900">
                            Description
                          </label>
                          <div className="mt-2">
                            <textarea id="description" name="description" rows={3} value={formData.description} onChange={(e) => setFormData((prev) => (Object.assign(Object.assign({}, prev), { description: e.target.value })))} className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"/>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="startDate" className="block text-sm font-medium leading-6 text-gray-900">
                              Start Date
                            </label>
                            <div className="mt-2">
                              <input type="date" name="startDate" id="startDate" required value={formData.startDate.toISOString().split('T')[0]} onChange={(e) => setFormData((prev) => (Object.assign(Object.assign({}, prev), { startDate: new Date(e.target.value) })))} className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"/>
                            </div>
                          </div>

                          <div>
                            <label htmlFor="endDate" className="block text-sm font-medium leading-6 text-gray-900">
                              End Date
                            </label>
                            <div className="mt-2">
                              <input type="date" name="endDate" id="endDate" required value={formData.endDate.toISOString().split('T')[0]} onChange={(e) => setFormData((prev) => (Object.assign(Object.assign({}, prev), { endDate: new Date(e.target.value) })))} className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"/>
                            </div>
                          </div>
                        </div>

                        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                          <button type="submit" disabled={isSubmitting} className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:ml-3 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed">
                            {isSubmitting ? 'Creating...' : 'Create Project'}
                          </button>
                          <button type="button" className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto" onClick={onClose}>
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </react_2.Dialog.Panel>
            </react_2.Transition.Child>
          </div>
        </div>
      </react_2.Dialog>
    </react_2.Transition.Root>);
}
