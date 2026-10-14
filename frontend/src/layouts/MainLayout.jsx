import React from 'react';
import { Outlet } from 'react-router-dom';
import { DemoRoleBar } from '../components/common/DemoRoleBar';
import { Navbar } from '../components/common/Navbar';
import { Footer } from '../components/common/Footer';

export function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-900 text-slate-100">
      <DemoRoleBar />
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
