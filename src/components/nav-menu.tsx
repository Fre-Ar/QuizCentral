import React from 'react';
import Link from 'next/link';

import ToggleButton from './toggle-button';

export default function NavMenu() {
  return (
    <div className="bg-uni-red text-white">
        <div className="container mx-auto flex items-center ">
          <div className="flex-1" />
          <div className="flex space-x-4">
            <Link href="/create-quiz">
              <button className="py-2 px-4">Create</button>
            </Link>
            <Link href="/create-ai">
              <button className="py-2 px-4">AI</button>
            </Link>
            <Link href="/settings">
              <button className="py-2 px-4">Settings</button>
            </Link>
            <Link href="/users">
              <button className="py-2 px-4">Manage Users</button>
            </Link>
            <Link href="/launch">
              <button className="py-2 px-4">Launch</button>
            </Link>
          </div>
          <div className="flex-1 flex justify-end items-center">
            Preview Quiz  
            <div className="px-4"><ToggleButton /></div>   
          </div>
        </div>
    </div>
  );
};