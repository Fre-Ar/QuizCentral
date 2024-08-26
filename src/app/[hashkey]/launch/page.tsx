'use client';

import React, { useState, useEffect, useRef} from 'react';
import { useQuiz, Group, QuizSession } from '@/components/session-context';
import { useRouter } from 'next/navigation';

import Header from '@/components/header';
import NavMenu from '@/components/nav-menu';
import { FaSpinner, FaEnvelope, FaRocket } from "react-icons/fa";
import { v4 as uuidv4 } from 'uuid';



export default function Page()  {
  const { quizSession, setQuizSession } = useQuiz();
  const router = useRouter()

  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

  const saveQuizToSupabase = async (quizSession: QuizSession, launchedGroup: Group) => {
    try {

      const response = await fetch('/api/quiz/launch-quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({quizSession: quizSession, launchedGroup: launchedGroup}),
      });

      const data = await response.json();

      if (data.error) throw new Error(data.error);

      document.cookie = `quizHash=${quizSession?.hash}; path=/; max-age=${7 * 24 * 60 * 60}; secure; samesite=strict`;

    } catch (error) {
      console.error('Error saving launched group and users:', error);
    }
  };
  

  // Function to generate a unique ID of less than 16 characters
  const generateAccessId = () => {
    return uuidv4().replaceAll("-", "").slice(0, 16);
  };

  const sendEmailToUser = async (email: string, hashKey: string, accessId: string) => {
    try {
      const response = await fetch('/api/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: email,
          subject: `Invitation to Access Quiz - ${hashKey}`,
          text: `You've been invited to access the quiz. Use the following link: ${process.env.NEXT_PUBLIC_BASE_URL}/access/${hashKey}/${accessId}`,
          html: `<p>You've been invited to access the quiz. Use the following link:</p>
                 <a href="${process.env.NEXT_PUBLIC_BASE_URL}/access/${hashKey}/${accessId}">${process.env.NEXT_PUBLIC_BASE_URL}/access/${hashKey}/${accessId}</a>`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send email');
      }

      const data = await response.json();
      console.log(data.message);
    } catch (error) {
      console.error('Error sending email:', error);
    }
  };

  const handleToggleGroup = async (groupId: string) => {
    const updatedGroups = quizSession?.groups.map(group => {
      if (group.id === groupId) {
        const updatedEmails = group.emails.map(user => {
          if (!user.accessId) {
            return { ...user, accessId: generateAccessId() };
          }
          return user;
        });
        return { ...group, emails: updatedEmails };
      }
      return group;
    });
  
    if (quizSession) {
      setQuizSession({ ...quizSession, groups: updatedGroups as Group[] });
    }
    if (quizSession) {
  
      const group = updatedGroups?.find(group => group.id === groupId);
      if (group) {
        await saveQuizToSupabase(quizSession, group);

        for (const user of group.emails) {
          if (user.email !== 'example@gmail.com') {
            await sendEmailToUser(user.email, quizSession.hash, user.accessId || '');
          }
        }
      }
    }
  
    if (expandedGroups.includes(groupId)) {
      setExpandedGroups(expandedGroups.filter(id => id !== groupId));
    } else {
      setExpandedGroups([...expandedGroups, groupId]);
    }
  };


  useEffect(() => {
    // If quizData doesn't exist, redirect to the homepage
    if (!quizSession) {
      router.push('/');
    }
  }, [quizSession, router]);

  return (
    <div className="min-h-screen max-h-screen flex flex-col">
      <Header />
      <NavMenu tab="launch"/>
      <div className="flex flex-grow overflow-hidden">



        <main className="flex-grow flex center-fix overflow-auto text-nowrap">
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
                    onClick={() => handleToggleGroup(group.id)}>
                    
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
