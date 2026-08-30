import { useState, useEffect } from 'react';
import axios from 'axios';
import { ComposeModal } from '../components/ComposeModal';
import { Search, Plus, Hash, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export const Dashboard = () => {
  const [slackConnected, setSlackConnected] = useState(false);
  const [slackWorkspace, setSlackWorkspace] = useState('');
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

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

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const { data } = await axios.get(`/api/emails/search?q=${encodeURIComponent(searchQuery)}`);
        setSearchResults(data);
      } catch (err) {
        toast.error('Search failed');
      } finally {
        setIsSearching(false);
      }
    }, 500); // debounce

    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <div className="flex flex-col gap-8 h-full">
      {/* Top Actions */}
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="relative w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150 ease-in-out"
            placeholder="Search emails by recipient, subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex gap-4 items-center">
          {slackConnected ? (
            <button
              onClick={handleDisconnectSlack}
              className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-md text-sm font-medium hover:bg-green-100 transition"
            >
              <Hash size={16} />
              Slack Connected ({slackWorkspace})
            </button>
          ) : (
            <button
              onClick={handleConnectSlack}
              className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 transition"
            >
              <Hash size={16} />
              Connect Slack
            </button>
          )}

          <button
            onClick={() => setIsComposeOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition shadow-sm"
          >
            <Plus size={16} />
            Compose Campaign
          </button>
        </div>
      </div>

      {/* Search Results / Main Area */}
      <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm p-6 overflow-y-auto">
        {searchQuery ? (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Search Results
              {isSearching && <RefreshCw className="inline animate-spin ml-2 h-4 w-4 text-gray-400" />}
            </h3>
            
            {searchResults.length === 0 && !isSearching && (
              <p className="text-gray-500 text-sm">No emails found matching "{searchQuery}"</p>
            )}

            <div className="space-y-4">
              {searchResults.map((email) => (
                <div key={email.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                  <div className="flex justify-between mb-2">
                    <span className="font-medium text-gray-900">{email.recipient}</span>
                    <span className="text-xs px-2 py-1 bg-gray-100 rounded text-gray-600">{email.status}</span>
                  </div>
                  <div className="text-sm text-gray-800 font-medium mb-1">{email.subject}</div>
                  <div className="text-sm text-gray-500 truncate">{email.body}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-4">
            <div className="p-4 bg-gray-50 rounded-full">
              <Search className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-lg">Start searching or compose a new campaign</p>
          </div>
        )}
      </div>

      <ComposeModal isOpen={isComposeOpen} onClose={() => setIsComposeOpen(false)} />
    </div>
  );
};
