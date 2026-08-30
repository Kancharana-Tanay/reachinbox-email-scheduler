import { Search, Hash } from 'lucide-react';
import axios from 'axios';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface HeaderProps {
  title: string;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const Header = ({ title, searchQuery, onSearchChange }: HeaderProps) => {
  const [slackConnected, setSlackConnected] = useState(false);
  const [slackWorkspace, setSlackWorkspace] = useState('');

  useEffect(() => {
    fetchSlackStatus();
  }, []);

  const fetchSlackStatus = async () => {
    try {
      const { data } = await axios.get('/api/slack/status');
      setSlackConnected(data.connected);
      setSlackWorkspace(data.workspaceName);
    } catch (err) {
      console.error(err);
    }
  };

  const handleConnectSlack = async () => {
    try {
      const { data } = await axios.get('/api/slack/connect');
      window.location.href = data.url;
    } catch (err) {
      toast.error('Failed to initiate Slack connection');
    }
  };

  const handleDisconnectSlack = async () => {
    try {
      await axios.post('/api/slack/disconnect');
      setSlackConnected(false);
      setSlackWorkspace('');
      toast.success('Slack disconnected');
    } catch (err) {
      toast.error('Failed to disconnect Slack');
    }
  };

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
      <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
      
      <div className="flex items-center gap-4">
        {/* Compact Search Bar */}
        <div className="relative w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-md text-sm leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition"
            placeholder="Search emails..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Slack Connection */}
        {slackConnected ? (
          <button
            onClick={handleDisconnectSlack}
            className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-md text-xs font-medium hover:bg-green-100 transition"
          >
            <Hash size={14} />
            Connected ({slackWorkspace})
          </button>
        ) : (
          <button
            onClick={handleConnectSlack}
            className="flex items-center gap-2 px-3 py-1.5 bg-white text-gray-600 border border-gray-200 rounded-md text-xs font-medium hover:bg-gray-50 transition"
          >
            <Hash size={14} />
            Connect Slack
          </button>
        )}
      </div>
    </header>
  );
};
