"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.Notepad = Notepad;
const react_1 = require("react");
function Notepad({ initialContent = '' }) {
    const [content, setContent] = (0, react_1.useState)(initialContent);
    return (<div className="overflow-hidden rounded-lg bg-white shadow">
      <div className="p-6">
        <h2 className="text-lg font-medium text-gray-900">Notepad</h2>
        <div className="mt-4">
          <textarea value={content} onChange={(e) => setContent(e.target.value)} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" rows={10} placeholder="Write your notes here..."/>
        </div>
      </div>
    </div>);
}
