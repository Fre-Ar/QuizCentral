'use client';

import React, { useState, useEffect, useRef} from 'react';
import { useQuiz, Group, GroupSettings, User } from '@/components/session-context';
import { useRouter } from 'next/navigation';

import Header from '@/components/header';
import NavMenu from '@/components/nav-menu';
import DragHandle from '@/components/drag-handle';
import Sidebar from '@/components/sidebar';
import SideButton from '@/components/side-button';
import { FaFolderOpen, FaEnvelope, FaTrash, FaPlus, FaCog } from "react-icons/fa";

const MIN_SIDEBAR_WIDTH = 0;
const DEFAULT_SIDEBAR_WIDTH = 20;
const MAX_SIDEBAR_WIDTH = 100;


export default function Page()  {
  const { quizSession, setQuizSession } = useQuiz();
  const router = useRouter()

  const [leftSidebarWidth, setLeftSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH);
  const [rightSidebarWidth, setRightSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH);
  const [dragging, setDragging] = useState<string | null>(null);

  const [nextid, setNextId] = useState<number>(0);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<{ groupId: string; emailIndex: number } | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);

  const handleAddGroup = () => {

    if(quizSession){

      setNextId(nextid+1)

      const settings: GroupSettings = {
        submitResponse: false,
        startAt: false,
        endAt: false,
        lastFor: false,
      }
  
      const newGroup: Group = {
        id: `group-${nextid}`,
        name: `Group ${nextid}`,
        emails: [],
        permission: 'Viewer',
        settings: settings
      };

      // Update the quiz session groups
      const updatedGroups = [...quizSession.groups, newGroup];
  
      // Update the quiz session
      setQuizSession({ ...quizSession, groups: updatedGroups });
    }
  };

  const handleAddEmail = (groupId: string, newEmail: string='example@gmail.com') => {
    if (quizSession) {
      const updatedGroups = quizSession.groups.map(group =>
        group.id === groupId
          ? { ...group, emails: [...group.emails, {email: newEmail, accessId: ''}] }
          : group
      );

      setQuizSession({ ...quizSession, groups: updatedGroups as Group[] });
    }
  };

  const handleEditEmail = (groupId: string, emailIndex: number, newEmail: string) => {
    if (quizSession) {
      const updatedGroups = quizSession.groups.map(group =>
        group.id === groupId
          ? {
              ...group,
              emails: group.emails.map((email, index) =>
                index === emailIndex ? {email: newEmail, accessId: ''} : email
              ),
            }
          : group
      );

      setQuizSession({ ...quizSession, groups: updatedGroups });
    }
  };

  const handleDeleteEmail = (groupId: string, emailIndex: number) => {
    if (quizSession) {
      const updatedGroups = quizSession.groups.map(group =>
        group.id === groupId
          ? {
              ...group,
              emails: group.emails.filter((_, index) => index !== emailIndex),
            }
          : group
      );

      setQuizSession({ ...quizSession, groups: updatedGroups });
    }
  };

  const handleEditGroup = (groupId: string, newName: string) => {
    if (quizSession) {
      const updatedGroups = quizSession.groups.map(group =>
        group.id === groupId ? { ...group, name: newName } : group
      );

      setQuizSession({ ...quizSession, groups: updatedGroups });
    }
  };

  const handleDeleteGroup = (groupId: string) => {
    if (quizSession) {
      const updatedGroups = quizSession.groups.filter(group => group.id !== groupId);

      setQuizSession({ ...quizSession, groups: updatedGroups });

      if (selectedGroup === groupId) {
        setSelectedGroup(null);
      }
    }
  };

  const handlePermissionChange = (groupId: string | null, permission: string) => {
    if (groupId && quizSession) {
      const updatedGroups = quizSession.groups.map(group =>
        group.id === groupId ? { ...group, permission } : group
      );

      setQuizSession({ ...quizSession, groups: updatedGroups });
    }
  };

  const handleGroupSelect = (groupId: string) => {
    setSelectedGroup(groupId);
    setSelectedEmail(null);
  };

  const handleEmailSelect = (groupId: string, emailIndex: number) => {
    setSelectedGroup(null);
    setSelectedEmail({ groupId, emailIndex });
  };

  const handleClickOutside = (event: MouseEvent) => {


    if ((containerRef.current && containerRef.current.contains(event.target as Node))) {
      setSelectedGroup(null);
      setSelectedEmail(null);
    }
  };

  const handlePaste = async (e: ClipboardEvent) => {
    if (selectedGroup && quizSession) {
        const text = e.clipboardData?.getData('text');
        if (text) {
            const lines = text.split('\n').map((line) => line.trim()).filter((line) => line.length > 0);

            // Find the selected group
            const updatedGroups = quizSession.groups.map(group => {
                if (group.id === selectedGroup) {
                    // Add all new emails to the selected group's emails array
                    const newEmails = [...group.emails];
                    lines.forEach(line => {
                        newEmails.push({ email: line, accessId: '' });
                    });

                    return {
                        ...group,
                        emails: newEmails,
                    };
                }
                return group;
            });

            // Update the quiz session with the modified groups
            setQuizSession({ ...quizSession, groups: updatedGroups });
        }
    }
};


  const handleMouseDown = (sidebar: string) => {
    setDragging(sidebar);
  };

  const handleMouseUp = () => {
    setDragging(null);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!dragging) return;

    const totalWidth = window.innerWidth;

    if (dragging === 'left') {
      const newWidth = (e.clientX / totalWidth) * 100;
      if (newWidth >= MIN_SIDEBAR_WIDTH && newWidth <= MAX_SIDEBAR_WIDTH) {
        setLeftSidebarWidth(newWidth);
      }
    }

    if (dragging === 'right') {
      const newWidth = ((totalWidth - e.clientX) / totalWidth) * 100;
      if (newWidth >= MIN_SIDEBAR_WIDTH && newWidth <= MAX_SIDEBAR_WIDTH) {
        setRightSidebarWidth(newWidth);
      }
    }
  };

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('click', handleClickOutside, true);
    document.addEventListener('paste', handlePaste); 
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('click', handleClickOutside, true);
      document.removeEventListener('paste', handlePaste);
    };
  }, [dragging, selectedGroup, quizSession]);

  useEffect(() => {
    // If quizData doesn't exist, redirect to the homepage
    if (!quizSession) {
      router.push('/');
    }
  }, [quizSession, router]);

  return (
    <div className="min-h-screen max-h-screen flex flex-col">
      <Header />
      <NavMenu tab="users"/>
      <div className="flex flex-grow overflow-hidden">

        <Sidebar width={`${leftSidebarWidth}%`}>
        <h2 className="text-lg font-bold mb-4 ml-2">Manage Users & Groups</h2>
          <SideButton title='Import Group' chosen={false}>
            <FaFolderOpen size="2em" className="p-1"/>
          </SideButton>

        </Sidebar>
        <DragHandle onMouseDown={() => handleMouseDown('left')}/>

        <main className="flex-grow flex center-fix overflow-auto text-nowrap"
          ref={containerRef}
          style={{
            width: `calc(100% - ${leftSidebarWidth}% - ${rightSidebarWidth}% - 10px)` // 10px for the resizers
          }}>
          <div className="flex flex-col border-x border-uni-grey mx-4 p-4 gap-y-4 ">
            <span className="flex flex-row w-full gap-x-2 items-center">
              <FaEnvelope size="4em" className="text-white bg-uni-grey rounded p-2"/>
              <div className="">
                <h3 className="font-bold">Users & Groups</h3>
                <p className="text-xs">Create a group and assign users identified by their emails to it.</p>
              </div>
            </span>
            <button className="bg-uni-blue text-white font-bold py-2 px-4 rounded" onClick={handleAddGroup}>+ Add Group</button>
            {quizSession?.groups.map(group => (
              <div key={group.id} className={`border p-4 rounded ${selectedGroup === group.id ? 'border-uni-selec' : 'border-uni-grey'}`} onClick={(e) => { e.stopPropagation(); handleGroupSelect(group.id); }}>
                <div className="flex justify-between items-center mb-2">
                  <input
                    type="text"
                    value={group.name}
                    onChange={(e) => handleEditGroup(group.id, e.target.value)}
                    className="w-full font-bold focus:outline-none text-lg text-uni-red"
                  />
                  
                  <div className="flex-col space-x-2">
                    <button 
                      className={`bg-uni-grey text-white rounded p-1 ${selectedGroup === group.id ? '' : 'hidden'}`}  
                      onClick={(e) => { e.stopPropagation(); handleGroupSelect(group.id); }}>
                        <FaCog size="1em"/>
                    </button>
                    <button 
                      className={`bg-uni-red text-white rounded p-1 ${selectedGroup === group.id ? '' : 'hidden'}`} 
                      onClick={(e) => { e.stopPropagation(); handleDeleteGroup(group.id); }}>
                        <FaTrash size="1em"/>
                    </button>
                  </div>
                </div>
                <ul>
                  {group.emails.map((email, index) => (
                    <li key={index} className="flex items-center gap-x-2 mb-1">
                      <span className="flex flex-row items-center">
                        <FaEnvelope size="1.5em" className="text-uni-red"/>
                        <input
                          type="text"
                          value={email.email}
                          onChange={(e) => handleEditEmail(group.id, index, e.target.value)}
                          className="ml-1 pl-1 w-full rounded focus:outline-none focus:ring-2 focus:ring-uni-blue"
                          onClick={(e) => { e.stopPropagation(); handleEmailSelect(group.id, index); }}
                        />
                      </span>
                      {selectedEmail && selectedEmail.groupId === group.id && selectedEmail.emailIndex === index && (
                        <button 
                        className="bg-uni-red text-white rounded p-1" 
                        onClick={(e) => { e.stopPropagation(); handleDeleteEmail(group.id, index); }}>
                          <FaTrash size="1em"/>
                        </button>
                      )}
                    </li>
                  ))}
                  <button className="flex flex-row items-center gap-x-2" onClick={() => handleAddEmail(group.id)}>
                    <FaPlus size="1.2em" className="text-white bg-uni-grey rounded p-0.5"/>
                    New Email
                    </button>
                </ul>
              </div>
            ))}
          </div>
        </main>

        <DragHandle onMouseDown={() => handleMouseDown('right')}/>
        
        <Sidebar width={`${rightSidebarWidth}%`}>
          <h2 className="text-lg font-bold mb-4 m-2">Permissions</h2>
          <div className="w-full px-2 min-w-max">
            {selectedGroup && <select 
              className="w-full border border-uni-black bg-uni-light p-2"
              value={quizSession?.groups.find(group => group.id === selectedGroup)?.permission || 'Viewer'}
              onChange={(e) => handlePermissionChange(selectedGroup, e.target.value)}
            >
              <option value="Viewer">Viewer</option>
              <option value="Player">Player</option>
              <option value="Editor">Editor</option>
            </select>}
          </div>
        </Sidebar>
      </div>
    </div>
  );
};
