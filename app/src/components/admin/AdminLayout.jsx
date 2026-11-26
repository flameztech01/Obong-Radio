// src/components/admin/AdminLayout.jsx
import React from 'react';
import { Outlet } from 'react-router';
import AdminSidebar from './AdminSidebar';
import AdminTopbar from './AdminTopbar';
import AdminBottombar from './AdminBottombar';

const AdminLayout = () => {
  return (
    <div className="flex h-screen bg-zinc-950 overflow-hidden text-white selection:bg-red-500/30">
      
      {/* Desktop Sidebar */}
      <AdminSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header */}
        <AdminTopbar />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto pb-24 lg:pb-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <AdminBottombar />
      
    </div>
  );
};

export default AdminLayout;