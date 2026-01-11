import React from 'react';
import { cn } from '@/lib/utils';

const STATUS_STYLES = {
  'New Job': 'bg-[#4791FF] text-white border-[#4791FF]/30',
  'Job in Progress': 'bg-green-500 text-white border-green-500/30',
  'Proof Sent': 'bg-purple-500 text-white border-purple-500/30',
  'Revisions Requested': 'bg-red-500 text-white border-red-500/30',
  'Job Complete': 'bg-gray-500 text-white border-gray-500/30',
  'On Hold': 'bg-black text-white border-black/30',
  'Stuck or Client Response Needed': 'bg-orange-500 text-white border-orange-500/30',
  'Small Change': 'bg-red-800 text-white border-red-800/30'
};

export default function StatusBadge({ status, className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border backdrop-blur-sm',
        STATUS_STYLES[status] || 'bg-gray-400 text-white',
        className
      )}
    >
      {status}
    </span>
  );
}