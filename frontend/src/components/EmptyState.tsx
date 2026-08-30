import { Mail, Plus } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  onCompose?: () => void;
}

export const EmptyState = ({ title, description, onCompose }: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto pt-20">
      <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-6">
        <Mail className="w-8 h-8 text-blue-600" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 mb-8">{description}</p>
      
      {onCompose && (
        <button
          onClick={onCompose}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition shadow-sm"
        >
          <Plus size={16} />
          Compose New Email
        </button>
      )}
    </div>
  );
};
