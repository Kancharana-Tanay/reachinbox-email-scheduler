import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Inbox, Send, LogOut } from 'lucide-react';
import clsx from 'clsx';

interface SidebarProps {
  onCompose: () => void;
}

export const Sidebar = ({ onCompose }: SidebarProps) => {
  const { user, logout } = useAuth();

  return (
    <aside className="w-56 bg-neutral-900 text-white flex flex-col h-full shrink-0">
      {/* Branding */}
      <div className="h-14 flex items-center px-4 font-semibold text-lg tracking-wider border-b border-neutral-800">
        REACHINBOX
      </div>

      {/* User Section */}
      <div className="px-4 py-4 flex items-center gap-3">
        {user?.avatarUrl ? (
          <img src={user.avatarUrl} alt="Avatar" className="w-8 h-8 rounded-full" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-medium">
            {user?.name?.charAt(0) || 'U'}
          </div>
        )}
        <div className="flex flex-col overflow-hidden">
          <span className="text-sm font-medium truncate">{user?.name}</span>
          <span className="text-xs text-neutral-400 truncate">{user?.email}</span>
        </div>
      </div>

      {/* Compose Button */}
      <div className="px-4 mb-4 mt-2">
        <button
          onClick={onCompose}
          className="w-full py-2 bg-white text-green-700 font-medium rounded-full text-sm shadow-sm hover:bg-neutral-100 transition flex items-center justify-center gap-2"
        >
          Compose
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col px-2 gap-1">
        <NavLink
          to="/dashboard/scheduled"
          className={({ isActive }) =>
            clsx(
              'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition',
              isActive ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            )
          }
        >
          <Inbox size={16} />
          Scheduled
        </NavLink>
        <NavLink
          to="/dashboard/sent"
          className={({ isActive }) =>
            clsx(
              'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition',
              isActive ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            )
          }
        >
          <Send size={16} />
          Sent
        </NavLink>
      </nav>

      {/* Footer / Logout */}
      <div className="p-4">
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 py-2 text-sm text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-md transition"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </aside>
  );
};
