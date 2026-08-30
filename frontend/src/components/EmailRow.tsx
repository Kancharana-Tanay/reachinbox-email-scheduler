import { StatusBadge } from './StatusBadge';
import type { ReactNode } from 'react';

interface EmailRowProps {
  email: any;
  showSender?: boolean;
  action?: ReactNode;
}

export const EmailRow = ({ email, showSender = true, action }: EmailRowProps) => {
  const formattedTime = new Date(email.scheduledAt || email.sentAt || email.createdAt).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <div className="flex items-center justify-between py-3 px-4 hover:bg-neutral-50 border-b border-gray-100 group transition cursor-pointer">
      <div className="flex flex-col flex-1 min-w-0 pr-4">
        <div className="flex items-center gap-3 mb-1">
          <span className="font-semibold text-gray-900 truncate text-sm">{email.recipient}</span>
          <StatusBadge status={email.status} />
        </div>
        <div className="flex items-center gap-2 text-sm">
          {showSender && email.sender && (
            <>
              <span className="text-gray-500 truncate max-w-[150px]">From: {email.sender.name}</span>
              <span className="text-gray-300">•</span>
            </>
          )}
          <span className="text-gray-600 truncate font-medium">{email.subject}</span>
          <span className="text-gray-400 truncate hidden sm:inline-block">- {email.body}</span>
        </div>
      </div>
      <div className="flex items-center gap-4 text-xs text-gray-400 whitespace-nowrap group-hover:text-gray-600 transition">
        {formattedTime}
        {action && (
          <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
            {action}
          </div>
        )}
      </div>
    </div>
  );
};
