'use client';

import React, { useState }  from 'react';
import Header from '../../components/header';

export default function AccessQuiz() {
    const [sessionId, setSessionId] = useState('');

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSessionId(e.target.value);
    };

    const handleSubmit = () => {
        console.log(`Session ID: ${sessionId}`);
    };
    return (
        <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-grow flex justify-center">
                <div className="flex flex-col w-full max-w-md border-l border-r border-uni-grey mx-4 lg:mx-0">
                    <div className="flex-grow flex flex-col justify-center space-y-4 items-center p-4">
                        <input
                            type="text"
                            value={sessionId}
                            onChange={handleInputChange}
                            placeholder="Enter Session ID"
                            className="border border-uni-grey rounded py-2 px-4 w-full"
                        />
                        <button
                            onClick={handleSubmit}
                            className="bg-uni-blue text-white font-bold py-4 px-8 rounded"
                        >
                            Enter Session
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}