import React from 'react';
//import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '../components/header';

export default function Home() {

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow flex justify-center">
        <div className="flex flex-col w-full max-w-md border-l border-r border-uni-grey mx-4 lg:mx-0">
          <div className="flex-grow flex flex-col justify-center space-y-4 items-center p-4">
            <Link href="/access">
              <button 
                className="bg-uni-red text-white font-bold py-4 px-8 rounded"
              >
                Access Quiz
              </button>
            </Link>
            <Link href="/create-quiz">
              <button className="bg-uni-blue text-white font-bold py-4 px-8 rounded">Create Quiz</button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
