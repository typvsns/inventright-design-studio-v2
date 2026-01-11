import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Clock, User, Building2, FileText, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import GlassCard from '../ui/GlassCard';
import StatusBadge from '../ui/StatusBadge';
import { cn } from '@/lib/utils';
import { getWordPressUser } from '../utils/wordpressAuth';

export default function JobCard({ job, isStale }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    const userData = getWordPressUser();
    setUser(userData);
  }, []);

  const deleteJobMutation = useMutation({
    mutationFn: async (jobId) => {
      const messages = await base44.entities.Message.filter({ job_id: jobId });
      await Promise.all(messages.map(msg => base44.entities.Message.delete(msg.id)));
      
      const files = await base44.entities.FileUpload.filter({ job_id: jobId });
      await Promise.all(files.map(file => base44.entities.FileUpload.delete(file.id)));
      
      await base44.entities.Job.delete(jobId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-jobs'] });
      toast.success('Job deleted successfully');
      setShowDeleteDialog(false);
    },
    onError: () => {
      toast.error('Failed to delete job');
    }
  });

  const handleDelete = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    deleteJobMutation.mutate(job.id);
  };
  return (
    <>
      <Link to={createPageUrl('JobDetail') + `?id=${job.id}`}>
        <GlassCard
          className={cn(
            'hover:glass-strong transition-all cursor-pointer',
            isStale && 'bg-pink-100/50 border-pink-400'
          )}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-black mb-1">
                    {job.job_name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Job #{job.job_number}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={job.status} />
                  {user?.role === 'admin' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleDelete}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-gray-700">
                <Building2 className="w-4 h-4 text-[#4791FF]" />
                <span>{job.client_name}</span>
              </div>
              
              <div className="flex items-center gap-2 text-gray-700">
                <FileText className="w-4 h-4 text-[#4791FF]" />
                <span>{job.department_name}</span>
              </div>
              
              <div className="flex items-center gap-2 text-gray-700">
                <User className="w-4 h-4 text-[#4791FF]" />
                <span>{job.designer_name || 'Unassigned'}</span>
              </div>
              
              <div className="flex items-center gap-2 text-gray-700">
                <Clock className="w-4 h-4 text-[#4791FF]" />
                <span>
                  {job.created_date && new Date(job.created_date + 'Z').toLocaleDateString()}
                </span>
              </div>

              {job.client_phone && (
                <div className="flex items-center gap-2 text-gray-700">
                  <span className="text-[#4791FF] text-xs">📞</span>
                  <span>{job.client_phone}</span>
                </div>
              )}
            </div>
          </div>
          
          {job.last_activity_date && (
            <div className="text-xs text-gray-500 text-right">
              Last update: {new Date(job.last_activity_date + 'Z').toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
            </div>
          )}
        </div>
      </GlassCard>
    </Link>

    <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Job</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{job.job_name}"? This will permanently delete the job and all associated messages and files. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={confirmDelete}
            className="bg-red-600 hover:bg-red-700"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}