import React from 'react';
import { format } from 'date-fns';
import { Clock, User, FileText, CheckCircle, AlertCircle, Send, Upload } from 'lucide-react';

export default function JobTimeline({ job, messages, files }) {
  const events = [];

  // Job creation
  events.push({
    type: 'created',
    date: job.created_date,
    title: 'Job Created',
    description: `Created by ${job.client_name}`,
    icon: FileText,
    color: 'blue'
  });

  // Designer assignment
  if (job.designer_id) {
    events.push({
      type: 'assigned',
      date: job.created_date,
      title: 'Designer Assigned',
      description: `Assigned to ${job.designer_name}`,
      icon: User,
      color: 'purple'
    });
  }

  // Status changes - we'll track from messages and job data
  const statusChanges = [];
  
  // Track status from job history (we can infer from messages with proof, etc.)
  messages.forEach(msg => {
    if (msg.is_proof) {
      statusChanges.push({
        type: 'status',
        date: msg.created_date,
        title: 'Proof Sent',
        description: `Proof sent by ${msg.sender_name}`,
        icon: Send,
        color: 'green'
      });
    }
  });

  // File uploads
  files.forEach(file => {
    events.push({
      type: 'file',
      date: file.created_date,
      title: 'File Uploaded',
      description: `${file.file_name} by ${file.uploader_name}`,
      icon: Upload,
      color: 'orange'
    });
  });

  // Add status changes
  events.push(...statusChanges);

  // Completion
  if (job.status === 'Job Complete' && job.completed_date) {
    events.push({
      type: 'completed',
      date: job.completed_date,
      title: 'Job Completed',
      description: 'Job marked as complete',
      icon: CheckCircle,
      color: 'green'
    });
  }

  // Sort by date (newest first)
  events.sort((a, b) => new Date(b.date) - new Date(a.date));

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-600',
      purple: 'bg-purple-100 text-purple-600',
      green: 'bg-green-100 text-green-600',
      orange: 'bg-orange-100 text-orange-600',
      gray: 'bg-gray-100 text-gray-600'
    };
    return colors[color] || colors.gray;
  };

  return (
    <div className="relative">
      <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200"></div>
      
      <div className="space-y-6">
        {events.map((event, index) => {
          const Icon = event.icon;
          return (
            <div key={index} className="relative flex gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 ${getColorClasses(event.color)}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 pb-4">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-black font-medium">{event.title}</h4>
                  <span className="text-xs text-gray-500">
                    {new Date(event.date + 'Z').toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{event.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}