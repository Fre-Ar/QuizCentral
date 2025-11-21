import { useState, useEffect, useRef } from 'react';

const MIN_SIDEBAR_WIDTH = 0;
const DEFAULT_SIDEBAR_WIDTH = 20;
const MAX_SIDEBAR_WIDTH = 100;

export function useDragging() {
    const [dragging, setDragging] = useState<string | null>(null);
    const [leftSidebarWidth, setLeftSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH);
    const [rightSidebarWidth, setRightSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH);
    const [selectedDivId, setSelectedDivId] = useState<string | null>(null);
    const mainRef = useRef<HTMLDivElement>(null);

    const handleMouseDown = (sidebar: string) => {
        setDragging(sidebar);
    };

    const handleMouseUp = () => {
        setDragging(null);
    };

    const handleDivClick = (e: MouseEvent) => {
        if(mainRef.current && mainRef.current.contains(e.target as Node))
        if(!mainRef.current.isEqualNode(e.target as Node))
            setSelectedDivId((e.target as HTMLElement).id);
        else
            setSelectedDivId(null);
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
        document.addEventListener('click', handleDivClick);
    
        return () => {
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
          document.removeEventListener('click', handleDivClick);
        };
      }, [dragging]);

    return { leftSidebarWidth,  rightSidebarWidth,  selectedDivId, mainRef, handleMouseDown };
}