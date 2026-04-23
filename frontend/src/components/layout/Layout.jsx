import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';

export function Layout() {
  return (
    <div className="flex bg-background min-h-screen text-on-background">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-72 relative overflow-hidden">
        <TopNav />
        <main className="flex-1 p-12 min-h-screen">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
