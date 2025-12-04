import { QuizSession } from '@/components/session-context';
import { Group, GroupSettings, User } from '@/components/session-context';
import { useState, useRef } from 'react';
import { generateAccessId, saveQuizToSupabase, sendEmailToUser } from '@/lib/client-utils'

const updateNext = (quizSession: QuizSession | null, setQuizSession: (session: QuizSession) => void, nextId: number, setNextId: (id: number) => void) => {
    setNextId(nextId + 1);
    if(quizSession){
      setQuizSession({ ...quizSession, nextGroup: nextId+1});
    }
  }

export function getGroupHandlers(quizSession: QuizSession | null, setQuizSession: (session: QuizSession) => void) {
    const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
    const [selectedEmail, setSelectedEmail] = useState<{ groupId: string; emailIndex: number } | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const addGroup = (nextId: number, setNextId: (id: number) => void) => {

        if(quizSession){

        updateNext(quizSession, setQuizSession, nextId, setNextId)

        const settings: GroupSettings = {
            submitResponse: false,
            startAt: false,
            endAt: false,
            lastFor: false,
        }
    
        const newGroup: Group = {
            id: `group-${nextId}`,
            name: `Group ${nextId}`,
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

    const addEmail = (groupId: string, newEmail: string='example@gmail.com') => {
        if (quizSession) {
        const updatedGroups = quizSession.groups.map(group =>
            group.id === groupId
            ? { ...group, emails: [...group.emails, {email: newEmail, accessId: ''}] }
            : group
        );

        setQuizSession({ ...quizSession, groups: updatedGroups as Group[] });
        }
    };

    const editEmail = (groupId: string, emailIndex: number, newEmail: string) => {
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

    const deleteEmail = (groupId: string, emailIndex: number) => {
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

        if (selectedEmail?.groupId === groupId &&  selectedEmail?.emailIndex === emailIndex) {
            setSelectedEmail(null);
        }
        }
    };

    const editGroup = (groupId: string, newName: string) => {
        if (quizSession) {
        const updatedGroups = quizSession.groups.map(group =>
            group.id === groupId ? { ...group, name: newName } : group
        );

        setQuizSession({ ...quizSession, groups: updatedGroups });
        }
    };

    const deleteGroup = (groupId: string) => {
        if (quizSession) {
        const updatedGroups = quizSession.groups.filter(group => group.id !== groupId);

        setQuizSession({ ...quizSession, groups: updatedGroups });

        if (selectedGroup === groupId) {
            setSelectedGroup(null);
        }
        }
    };

    const changePermission = (groupId: string | null, permission: string) => {
        if (groupId && quizSession) {
        const updatedGroups = quizSession.groups.map(group =>
            group.id === groupId ? { ...group, permission } : group
        );

        setQuizSession({ ...quizSession, groups: updatedGroups });
        }
    };

    const selectGroup = (groupId: string) => {
        setSelectedGroup(groupId);
        setSelectedEmail(null);
    };

    const selectEmail = (groupId: string, emailIndex: number) => {
        setSelectedGroup(null);
        setSelectedEmail({ groupId, emailIndex });
    };


    const handleClickOutside = (event: MouseEvent) => {

        if(containerRef.current && containerRef.current.contains(event.target as Node))
        if(!containerRef.current.isEqualNode(event.target as Node)){
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

    return {addGroup, addEmail, editEmail, deleteEmail, editGroup, deleteGroup, selectGroup, selectEmail, changePermission, containerRef, selectedEmail, selectedGroup}
};


export function getGroupAccess(quizSession: QuizSession | null, setQuizSession: (session: QuizSession) => void) {
    const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

    const openQuizToGroup = async (groupId: string) => {
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
            //TODO: Solve param mismatch probably needs new function or unpack quiz object
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

    
    return { expandedGroups, openQuizToGroup}
};