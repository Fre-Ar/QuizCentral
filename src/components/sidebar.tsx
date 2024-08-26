import React from 'react';

interface SidebarProps {
  width: string
  children?: React.ReactNode
}

export default function Sidebar({ width, children}: SidebarProps) {
  return (
    <aside
      style={{ width }}
      className={`bg-uni-grey text-white text-nowrap py-4 overflow-auto`}
    >
        <div className="">
            {children}
        </div>
    </aside>
  );
};
