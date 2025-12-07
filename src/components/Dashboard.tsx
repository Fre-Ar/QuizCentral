import React, { useState } from "react";
import { UserAccount } from "@/session/types";

interface DashboardProps {
  user: UserAccount;
  onSelectQuiz: (id: string) => void;
  onCreateQuiz: (title: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onSelectQuiz, onCreateQuiz }) => {
  const [newTitle, setNewTitle] = useState("");

  return (
    <div className="max-w-4xl mx-auto p-8">
      <header className="mb-10 border-b pb-4">
        <h1 className="text-3xl font-bold">Welcome, {user.userName}</h1>
        <p className="text-gray-500">Manage your interactive lessons.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* LEFT: Quiz List */}
        <div className="p-6 rounded-lg shadow border">
          <h2 className="text-xl font-semibold mb-4">Your Quizzes</h2>
          {user.quizzes.length === 0 ? (
            <p className="text-gray-400 italic">No quizzes yet.</p>
          ) : (
            <ul className="space-y-3">
              {user.quizzes.map((q) => (
                <li key={q.id}>
                  <button
                    onClick={() => onSelectQuiz(q.id)}
                    className="w-full text-left px-4 py-3 rounded bg-gray-500 hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-colors flex justify-between items-center group"
                  >
                    <span className="font-medium text-gray-900 group-hover:text-blue-700">
                      {q.title}
                    </span>
                    <span className="text-xs text-gray-200 group-hover:text-blue-700">ID: {q.id}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* RIGHT: Create New */}
        <div className="p-6 rounded-lg border border-dashed border-gray-300">
          <h2 className="text-xl font-semibold mb-4">Create New</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Quiz Title
              </label>
              <input 
                type="text" 
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Biology 101"
              />
            </div>
            <button 
              onClick={() => {
                if (newTitle.trim()) {
                  onCreateQuiz(newTitle);
                  setNewTitle("");
                }
              }}
              disabled={!newTitle.trim()}
              className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Start Building
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};