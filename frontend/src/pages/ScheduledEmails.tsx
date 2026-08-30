import { useState, useEffect } from 'react';
import axios from 'axios';
import { useOutletContext } from 'react-router-dom';
import { EmailList } from '../components/EmailList';
import { EmailRow } from '../components/EmailRow';
import toast from 'react-hot-toast';

import { XCircle } from 'lucide-react';

export const ScheduledEmails = () => {
  const [emails, setEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { searchQuery } = useOutletContext<{ searchQuery: string }>();

  const fetchEmails = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('/api/emails/scheduled');
      setEmails(data);
    } catch (err) {
      toast.error('Failed to load scheduled emails');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails();
  }, []);

  const handleCancel = async (id: string) => {
    try {
      await axios.post(`/api/emails/${id}/cancel`);
      toast.success('Email cancelled successfully');
      fetchEmails();
    } catch (err) {
      toast.error('Failed to cancel email');
    }
  };

  const filteredEmails = emails.filter((email) => 
    !searchQuery || 
    email.recipient.toLowerCase().includes(searchQuery.toLowerCase()) || 
    email.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full max-w-5xl mx-auto">
      <EmailList 
        isLoading={loading}
        isEmpty={filteredEmails.length === 0}
        emptyTitle={searchQuery ? "No search results" : "No scheduled emails"}
        emptyDescription={searchQuery ? "Try adjusting your search terms" : "When you schedule a campaign, the emails will appear here."}
      >
        {filteredEmails.map(email => (
          <EmailRow 
            key={email.id} 
            email={email} 
            action={
              <button
                onClick={() => handleCancel(email.id)}
                className="text-gray-400 hover:text-red-600 transition flex items-center justify-center p-1 rounded-full hover:bg-red-50"
                title="Cancel email"
              >
                <XCircle size={14} />
              </button>
            }
          />
        ))}
      </EmailList>
    </div>
  );
};
