'use client';

import React from 'react';
import { FaSpinner, FaEnvelope, FaRocket } from "react-icons/fa";

import Header from '@/components/header';
import NavMenu from '@/components/nav-menu';

import { useQuizSession } from '@/hooks/quiz';
import { getGroupAccess } from '@/hooks/groups';



export default function Page()  {
  const { quizSession, setQuizSession }  = useQuizSession(); 
  const { expandedGroups, openQuizToGroup } = getGroupAccess(quizSession, setQuizSession);
  

  return (
    <div className="min-h-screen max-h-screen flex flex-col">
      <Header />
      <NavMenu tab="launch"/>
      <div className="flex grow overflow-hidden">



        <main className="grow flex center-fix overflow-auto text-nowrap">
          <div className="flex flex-col border-x border-uni-grey mx-4 p-4 gap-y-4 ">
            <span className="flex flex-row w-full gap-x-2 items-center">
              <FaRocket size="4em" className="text-white bg-uni-grey rounded p-2"/>
              <div className="">
                <h3 className="font-bold">Launch Quiz</h3>
                <p className="text-xs">Send emails to groups requesting to access the quiz.</p>
              </div>
            </span>

            {quizSession?.groups.map(group => (
            <div className="relative flex flex-row">
            
              <div key={group.id} className={` w-full border p-4 rounded ${expandedGroups.includes(group.id) ? 'border-uni-selec' : 'border-uni-grey'}`}>
                <div className="flex justify-between items-center mb-2">
                  <span className="w-full font-bold text-lg text-uni-red">{group.name}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-x-4 mt-4">
                  <div className="flex flex-col">
                    <h3 className="text-sm font-bold">Emails</h3>
                    {group.emails.map((user, index) => (
                      <span key={index} className="flex items-center">
                        <FaEnvelope size="1.5em" className="text-uni-red" />
                        <span className="ml-2">{user.email}</span>
                      </span>
                    ))}
                  </div>

                  {/* Show other columns only if the group is expanded */}
                  {expandedGroups.includes(group.id) && (
                    <>
                      <div className="flex flex-col">
                        <h3 className="text-sm font-bold">Access IDs</h3>
                        {group.emails.map((user, index) => (
                          <span key={index}>{user.accessId}</span>
                        ))}
                      </div>
                      <div className="flex flex-col">
                        <h3 className="text-sm font-bold">Submissions</h3>
                        {group.emails.map((user, index) => (
                          <a key={index} href={`/submission/${user.accessId}`} className="text-uni-blue underline">Submission</a>
                        ))}
                      </div>
                      <div className="flex flex-col">
                        <h3 className="text-sm font-bold">Scores</h3>
                        {group.emails.map((_, index) => (
                          <span key={index}>0%</span>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
              <span className="absolute right-0 transform translate-x-full"
                    style={{ top: `calc((100% - 2em)/2)`}}> 
                  <button 
                    className={`bg-${expandedGroups.includes(group.id) ? 'uni-red' : 'uni-blue'} text-white rounded p-1 ml-2`}  
                    onClick={() => openQuizToGroup(group.id)}>
                    
                    {expandedGroups.includes(group.id) ? <FaSpinner className="rounded p-1" size="2em"/> :
                                                         <FaRocket className="rounded p-1" size="2em"/>}
                  </button>
              </span>
            </div>
          ))}
          </div>
        </main>
      </div>
    </div>
  );
};
