import { useState, useEffect } from 'react';
import axios from 'axios';
import { useOutletContext } from 'react-router-dom';
import { EmailList } from '../components/EmailList';
import { EmailRow } from '../components/EmailRow';
import toast from 'react-hot-toast';

export const SentEmails = () => {
  const [emails, setEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { searchQuery } = useOutletContext<{ searchQuery: string }>();

  const fetchEmails = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('/api/emails/sent');
      setEmails(data);
    } catch (err) {
      toast.error('Failed to load sent emails');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails();
  }, []);

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
        emptyTitle={searchQuery ? "No search results" : "No sent emails"}
        emptyDescription={searchQuery ? "Try adjusting your search terms" : "Emails that have been successfully sent or failed will appear here."}
      >
        {filteredEmails.map(email => (
          <EmailRow key={email.id} email={email} />
        ))}
      </EmailList>
    </div>
  );
};
