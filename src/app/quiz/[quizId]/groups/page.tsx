'use client';

import Header from '@/components/header';
import NavMenu from '@/components/NavHeader';
import DragHandle from '@/components/drag-handle';
import Sidebar from '@/components/sidebar';
import SideButton from '@/components/side-button';
import { useDragging } from '@/hooks/resizing';
import { getGroupHandlers } from '@/hooks/groups';

import { FaFolderOpen, FaEnvelope, FaTrash, FaPlus, FaCog } from "react-icons/fa";


export default function Page()  {
  const { leftSidebarWidth, rightSidebarWidth, selectedDivId, mainRef, handleMouseDown } = useDragging();
  const { 
    addGroup,
    addEmail,
    editEmail, 
    deleteEmail, 
    editGroup, 
    deleteGroup, 
    selectGroup, 
    selectEmail,
    changePermission,
    containerRef,
    selectedEmail,
    selectedGroup
  } = getGroupHandlers(quizSession, setQuizSession);



  const handleAddGroup = () => {  
    addGroup(nextId, setNextId);
  }; 

  const handleAddEmail = (groupId: string, newEmail: string='example@gmail.com') => {
    addEmail(groupId, newEmail);
  };

  const handleEditEmail = (groupId: string, emailIndex: number, newEmail: string) => {
    editEmail(groupId, emailIndex, newEmail);
  };

  const handleDeleteEmail = (groupId: string, emailIndex: number) => {
    deleteEmail(groupId, emailIndex);
  };

  const handleEditGroup = (groupId: string, newName: string) => {
    editGroup(groupId, newName);
  };

  const handleDeleteGroup = (groupId: string) => {
    deleteGroup(groupId);
  };

  const handlePermissionChange = (groupId: string | null, permission: string) => {
    changePermission(groupId, permission);
  };

  const handleSelectGroup = (groupId: string) => {
    selectGroup(groupId);
  };

  const handleSelectEmail = (groupId: string, emailIndex: number) => {
    selectEmail(groupId, emailIndex);
  };

  return (
    <div className="min-h-screen max-h-screen flex flex-col">
      <Header />
      <NavMenu tab="users" id={''}/>
      <div className="flex grow overflow-hidden">

        <Sidebar width={`${leftSidebarWidth}%`}>
        <h2 className="text-lg font-bold mb-4 ml-2">Manage Users & Groups</h2>
          <SideButton title='Import Group' chosen={false}>
            <FaFolderOpen size="2em" className="p-1"/>
          </SideButton>

        </Sidebar>
        <DragHandle onMouseDown={() => handleMouseDown('left')}/>

        <main className="grow flex center-fix overflow-auto text-nowrap"
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
              <div key={group.id} className={`border p-4 rounded ${selectedGroup === group.id ? 'border-uni-selec' : 'border-uni-grey'}`} onClick={(e) => { e.stopPropagation(); handleSelectGroup(group.id); }}>
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
                      onClick={(e) => { e.stopPropagation(); handleSelectGroup(group.id); }}>
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
                          onClick={(e) => { e.stopPropagation(); handleSelectEmail(group.id, index); }}
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
