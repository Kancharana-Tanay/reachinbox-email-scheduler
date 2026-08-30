import clsx from 'clsx';
import { Send, Clock, AlertCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const isScheduled = status === 'SCHEDULED';
  const isSent = status === 'SENT';
  const isFailed = status === 'FAILED';

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium uppercase tracking-wider',
        isScheduled && 'bg-blue-50 text-blue-700 border border-blue-200/50',
        isSent && 'bg-green-50 text-green-700 border border-green-200/50',
        isFailed && 'bg-red-50 text-red-700 border border-red-200/50',
        !isScheduled && !isSent && !isFailed && 'bg-gray-50 text-gray-700 border border-gray-200'
      )}
    >
      {isScheduled && <Clock size={10} />}
      {isSent && <Send size={10} />}
      {isFailed && <AlertCircle size={10} />}
      {status}
    </span>
  );
};
