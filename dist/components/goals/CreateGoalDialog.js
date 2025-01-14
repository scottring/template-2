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
exports.CreateGoalDialog = CreateGoalDialog;
const react_1 = require("react");
const react_2 = require("@headlessui/react");
const lucide_react_1 = require("lucide-react");
const useGoalStore_1 = require("@/lib/stores/useGoalStore");
function CreateGoalDialog({ areaId, open, onClose }) {
    const addGoal = (0, useGoalStore_1.useGoalStore)((state) => state.addGoal);
    const [formData, setFormData] = (0, react_1.useState)({
        name: '',
        description: '',
        areaId: areaId,
        targetDate: new Date(),
        successCriteria: [''],
        progress: 0,
    });
    const [isSubmitting, setIsSubmitting] = (0, react_1.useState)(false);
    const handleSubmit = (e) => __awaiter(this, void 0, void 0, function* () {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            yield addGoal(Object.assign(Object.assign({}, formData), { successCriteria: formData.successCriteria.filter(Boolean) }));
            onClose();
            setFormData({
                name: '',
                description: '',
                areaId: areaId,
                targetDate: new Date(),
                successCriteria: [''],
                progress: 0,
            });
        }
        catch (error) {
            console.error('Error creating goal:', error);
        }
        finally {
            setIsSubmitting(false);
        }
    });
    const addCriteria = () => {
        setFormData((prev) => (Object.assign(Object.assign({}, prev), { successCriteria: [...prev.successCriteria, ''] })));
    };
    const removeCriteria = (index) => {
        setFormData((prev) => (Object.assign(Object.assign({}, prev), { successCriteria: prev.successCriteria.filter((_, i) => i !== index) })));
    };
    const updateCriteria = (index, value) => {
        setFormData((prev) => (Object.assign(Object.assign({}, prev), { successCriteria: prev.successCriteria.map((c, i) => (i === index ? value : c)) })));
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
                  <button type="button" className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" onClick={onClose}>
                    <span className="sr-only">Close</span>
                    <lucide_react_1.X className="h-6 w-6" aria-hidden="true"/>
                  </button>
                </div>
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <react_2.Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                      Create New Goal
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

                        <div>
                          <label htmlFor="targetDate" className="block text-sm font-medium leading-6 text-gray-900">
                            Target Date
                          </label>
                          <div className="mt-2">
                            <input type="date" name="targetDate" id="targetDate" required value={formData.targetDate.toISOString().split('T')[0]} onChange={(e) => setFormData((prev) => (Object.assign(Object.assign({}, prev), { targetDate: new Date(e.target.value) })))} className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"/>
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between">
                            <label className="block text-sm font-medium leading-6 text-gray-900">
                              Success Criteria
                            </label>
                            <button type="button" onClick={addCriteria} className="inline-flex items-center rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                              <lucide_react_1.Plus className="h-4 w-4 mr-1"/>
                              Add Criteria
                            </button>
                          </div>
                          <div className="mt-2 space-y-2">
                            {formData.successCriteria.map((criteria, index) => (<div key={index} className="flex gap-x-2">
                                <input type="text" value={criteria} onChange={(e) => updateCriteria(index, e.target.value)} placeholder="Enter success criteria" className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"/>
                                {formData.successCriteria.length > 1 && (<button type="button" onClick={() => removeCriteria(index)} className="inline-flex items-center rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-red-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-red-50">
                                    <lucide_react_1.Trash className="h-4 w-4"/>
                                  </button>)}
                              </div>))}
                          </div>
                        </div>

                        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                          <button type="submit" disabled={isSubmitting} className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:ml-3 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed">
                            {isSubmitting ? 'Creating...' : 'Create Goal'}
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
