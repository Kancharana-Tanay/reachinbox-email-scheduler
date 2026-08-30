import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { useState } from 'react';
import { ComposeModal } from '../components/ComposeModal';

export const Layout = () => {
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();

  let title = 'Inbox';
  if (location.pathname.includes('/scheduled')) title = 'Scheduled';
  if (location.pathname.includes('/sent')) title = 'Sent';
  if (location.pathname === '/dashboard') title = 'Dashboard';

  return (
    <div className="flex h-screen bg-[#F4F5F9] font-sans overflow-hidden">
      <Sidebar onCompose={() => setIsComposeOpen(true)} />
      
      <div className="flex-1 flex flex-col min-w-0">
        <Header 
          title={title} 
          searchQuery={searchQuery} 
          onSearchChange={setSearchQuery} 
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet context={{ searchQuery }} />
        </main>
      </div>

      <ComposeModal isOpen={isComposeOpen} onClose={() => setIsComposeOpen(false)} />
    </div>
  );
};

