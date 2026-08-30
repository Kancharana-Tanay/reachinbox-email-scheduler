import { X, Upload } from 'lucide-react';

interface RecipientChipsProps {
  leads: string[];
  onRemoveLead: (email: string) => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const RecipientChips = ({ leads, onRemoveLead, onFileUpload }: RecipientChipsProps) => {
  return (
    <div className="flex flex-wrap items-center gap-2 p-1.5 min-h-[42px] border-b border-gray-100 bg-white">
      <span className="text-sm font-medium text-gray-500 min-w-[50px] pl-2">To:</span>
      
      {leads.slice(0, 3).map((lead) => (
        <span key={lead} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
          {lead}
          <button
            type="button"
            onClick={() => onRemoveLead(lead)}
            className="hover:text-green-900 focus:outline-none"
          >
            <X size={12} />
          </button>
        </span>
      ))}
      
      {leads.length > 3 && (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
          +{leads.length - 3} more
        </span>
      )}

      {leads.length === 0 && (
        <span className="text-sm text-gray-400 italic">No recipients detected</span>
      )}

      <div className="relative ml-auto pr-2">
        <input
          type="file"
          accept=".csv"
          onChange={onFileUpload}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          title="Upload CSV"
        />
        <button
          type="button"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-600 rounded-md text-xs font-medium hover:bg-gray-50 transition"
        >
          <Upload size={14} />
          Upload CSV
        </button>
      </div>
    </div>
  );
};
