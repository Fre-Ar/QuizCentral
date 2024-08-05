import React from 'react';
import Link from 'next/link';

export default function Header() {
  return (
    <header className="border-2 border-uni-grey shadow p-4">
      <div className="container mx-auto flex items-center">
        <Link href="/" className="flex items-center">
            <div className="bg-uni-blue text-white font-bold py-2 px-4 rounded">Q</div>
            <div className="bg-uni-red text-white font-bold py-2 px-4 rounded">C</div>
        </Link>
      </div>
    </header>
  );
};