import type { ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';
import { EmptyState } from './EmptyState';

interface EmailListProps {
  isLoading: boolean;
  isEmpty: boolean;
  emptyTitle: string;
  emptyDescription: string;
  onCompose?: () => void;
  children: ReactNode;
}

export const EmailList = ({ isLoading, isEmpty, emptyTitle, emptyDescription, onCompose, children }: EmailListProps) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <RefreshCw className="animate-spin h-6 w-6 mr-2" />
        <span>Loading emails...</span>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        onCompose={onCompose}
      />
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="flex flex-col">
        {children}
      </div>
    </div>
  );
};
