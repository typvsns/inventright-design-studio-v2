import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import StatusBadge from '../ui/StatusBadge';

export default function JobRowCompact({ job }) {
  return (
    <Link 
      to={createPageUrl('JobDetail') + `?id=${job.id}`}
      className="block"
    >
      <div className="glass rounded-lg p-3 hover:shadow-md transition-all border border-transparent hover:border-[#4791FF]/30">
        <div className="grid grid-cols-5 gap-4 items-center">
          <div className="font-medium text-black truncate">
            {job.job_name || 'Untitled Job'}
          </div>
          <div className="text-sm text-gray-700 truncate">
            {job.client_name}
          </div>
          <div className="text-sm text-gray-700 truncate">
            {job.client_phone || <span className="text-gray-400">No phone</span>}
          </div>
          <div className="text-sm text-gray-700 truncate">
            {job.designer_name || <span className="text-gray-400">Unassigned</span>}
          </div>
          <div className="flex justify-end">
            <StatusBadge status={job.status} />
          </div>
        </div>
      </div>
    </Link>
  );
}