import { useState, useEffect } from 'react';
import axios from 'axios';
import { Send, ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { parse } from 'csv-parse/browser/esm';
import { RecipientChips } from './RecipientChips';

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ComposeModal = ({ isOpen, onClose }: ComposeModalProps) => {
  const [senders, setSenders] = useState<any[]>([]);
  const [senderId, setSenderId] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [leads, setLeads] = useState<string[]>([]);
  const [startTime, setStartTime] = useState('');
  const [delaySeconds, setDelaySeconds] = useState(2);
  const [hourlyLimit, setHourlyLimit] = useState(100);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchSenders();
    }
  }, [isOpen]);

  const fetchSenders = async () => {
    try {
      const { data } = await axios.get('/api/senders');
      setSenders(data);
      if (data.length > 0 && !senderId) {
        setSenderId(data[0].id);
      }
    } catch (err) {
      toast.error('Failed to load senders');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const csvData = event.target?.result as string;
      parse(csvData, {
        columns: false,
        skip_empty_lines: true,
      }, (err, records) => {
        if (err) {
          toast.error('Failed to parse CSV');
          return;
        }
        
        const extractedEmails: string[] = [];
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        records.forEach((row: string[]) => {
          row.forEach(cell => {
            const clean = cell.trim();
            if (emailRegex.test(clean)) {
              extractedEmails.push(clean);
            }
          });
        });

        const unique = Array.from(new Set([...leads, ...extractedEmails]));
        setLeads(unique);
        toast.success(`Found ${extractedEmails.length} valid emails (Total: ${unique.length})`);
      });
    };
    reader.readAsText(file);
    e.target.value = ''; // reset file input
  };

  const handleRemoveLead = (emailToRemove: string) => {
    setLeads(leads.filter(email => email !== emailToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderId || !subject || !body || leads.length === 0 || !startTime) {
      toast.error('Please fill all fields and upload valid leads');
      return;
    }

    setIsSubmitting(true);
    try {
      const idempotencyKey = crypto.randomUUID();
      const delayMs = delaySeconds * 1000;

      await axios.post('/api/campaigns', {
        senderId,
        subject,
        body,
        leads,
        startTime: new Date(startTime).toISOString(),
        delayMs,
        hourlyLimit,
      }, {
        headers: { 'Idempotency-Key': idempotencyKey }
      });

      toast.success('Campaign scheduled successfully');
      setLeads([]);
      setSubject('');
      setBody('');
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to schedule campaign');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm transition-opacity p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center px-6 py-4 border-b border-gray-100 bg-white">
          <button onClick={onClose} className="mr-3 text-gray-400 hover:text-gray-600 transition">
            <ChevronLeft size={20} />
          </button>
          <h2 className="text-lg font-semibold text-gray-800">Compose New Email</h2>
        </div>

        {/* Editor Body */}
        <div className="flex flex-col flex-1 overflow-y-auto bg-white">
          <form id="compose-form" onSubmit={handleSubmit} className="flex flex-col h-full">
            
            {/* From */}
            <div className="flex items-center px-4 py-2 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-500 min-w-[50px] pl-2">From:</span>
              <select
                required
                className="flex-1 bg-transparent border-none text-sm font-medium text-gray-900 focus:ring-0 cursor-pointer outline-none"
                value={senderId}
                onChange={(e) => setSenderId(e.target.value)}
              >
                <option value="" disabled>Select a sender...</option>
                {senders.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
                ))}
              </select>
            </div>

            {/* To (CSV Chips) */}
            <RecipientChips 
              leads={leads}
              onRemoveLead={handleRemoveLead}
              onFileUpload={handleFileUpload}
            />

            {/* Subject */}
            <div className="flex items-center px-4 py-3 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-500 min-w-[50px] pl-2">Subject:</span>
              <input
                required
                type="text"
                className="flex-1 bg-transparent border-none text-sm text-gray-900 focus:ring-0 outline-none placeholder-gray-300 font-medium"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Type your subject here..."
              />
            </div>

            {/* Body */}
            <div className="flex-1 p-6 bg-white min-h-[300px]">
              <textarea
                required
                className="w-full h-full resize-none border-none text-sm text-gray-800 focus:ring-0 outline-none placeholder-gray-300"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Type your reply..."
              />
            </div>

            {/* Bottom Controls Bar */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-6">
                
                {/* Delay */}
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-gray-500">Delay (sec):</label>
                  <input
                    required
                    type="number"
                    min="0"
                    className="w-16 px-2 py-1 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition"
                    value={delaySeconds}
                    onChange={(e) => setDelaySeconds(Number(e.target.value))}
                  />
                </div>

                {/* Hourly Limit */}
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-gray-500">Hourly limit:</label>
                  <input
                    required
                    type="number"
                    min="1"
                    className="w-16 px-2 py-1 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition"
                    value={hourlyLimit}
                    onChange={(e) => setHourlyLimit(Number(e.target.value))}
                  />
                </div>
                
                {/* Start Time */}
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-gray-500">Start:</label>
                  <input
                    required
                    type="datetime-local"
                    className="px-2 py-1 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition text-gray-700"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 ml-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm text-gray-500 font-medium hover:text-gray-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="compose-form"
                  disabled={isSubmitting || leads.length === 0}
                  className="px-5 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 transition disabled:opacity-50 flex items-center gap-2 shadow-sm"
                >
                  {isSubmitting ? 'Scheduling...' : 'Send Later'}
                  {!isSubmitting && <Send size={14} />}
                </button>
              </div>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};
