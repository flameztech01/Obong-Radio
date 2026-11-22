import React, { useState } from 'react';
import { Outlet } from 'react-router'; 
import Topbar from './Topbar';
import Bottombar from './Bottombar';
import Sidebar from './Sidebar';

const Layout = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    // 1. Changed bg-gray-50 to bg-zinc-950
    <div className="flex h-screen bg-zinc-950 overflow-hidden text-white">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <Topbar toggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)} />

        {/* 2. Removed padding (p-4 md:p-6 lg:p-8) so pages can touch the edges */}
        {/* Kept pb-24 lg:pb-8 so mobile content doesn't hide behind the bottombar */}
        <main className="flex-1 overflow-y-auto pb-24 lg:pb-8">
          
          {/* 3. Removed max-w-7xl mx-auto because Homepage.jsx already has it */}
          <Outlet />
          
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <Bottombar />
    </div>
  );
};

export default Layout;