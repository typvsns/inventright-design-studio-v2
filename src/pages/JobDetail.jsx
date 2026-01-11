import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Upload, Send, Download, CheckCircle, Loader2, Paperclip, User, Clock, Archive, ArchiveRestore } from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';
import StatusBadge from '../components/ui/StatusBadge';
import JobTimeline from '../components/jobs/JobTimeline';
import CommentThread from '../components/jobs/CommentThread';
import StatusAutomationInfo from '../components/jobs/StatusAutomationInfo';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  canEditJob,
  canChangeStatus,
  canAssignDesigner,
  canSendProof,
  canCompleteJob,
  hasPermission,
  getAvailableStatuses
} from '../components/utils/permissions';
import { getWordPressUser, isAuthenticated } from '../components/utils/wordpressAuth';

export default function JobDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const jobId = urlParams.get('id');

  const [user, setUser] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [supportEmails, setSupportEmails] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = () => {
    if (!isAuthenticated()) {
      navigate(createPageUrl('WordPressLogin'));
      return;
    }
    const userData = getWordPressUser();
    setUser(userData);
  };

  const { data: job, isLoading: jobLoading } = useQuery({
    queryKey: ['job', jobId],
    queryFn: async () => {
      const jobs = await base44.entities.Job.filter({ id: jobId });
      return jobs[0];
    },
    enabled: !!jobId
  });

  const { data: messages } = useQuery({
    queryKey: ['messages', jobId],
    queryFn: () => base44.entities.Message.filter({ job_id: jobId }, '-created_date'),
    enabled: !!jobId,
    initialData: []
  });

  const { data: files } = useQuery({
    queryKey: ['files', jobId],
    queryFn: () => base44.entities.FileUpload.filter({ job_id: jobId }, '-created_date'),
    enabled: !!jobId,
    initialData: []
  });

  // Designers list not available for WordPress-authenticated users
  const designers = [];

  const updateJobMutation = useMutation({
    mutationFn: async ({ data, trigger }) => {
      const result = await base44.entities.Job.update(jobId, data);
      
      if (trigger) {
        try {
          await base44.functions.invoke('sendJobNotification', {
            jobId,
            trigger
          });
        } catch (error) {
          console.error('Failed to send notification:', error);
        }
      }
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job', jobId] });
      toast.success('Job updated');
    }
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ messageData, isProof }) => {
      const result = await base44.entities.Message.create(messageData);
      
      // Auto-update status based on context
      if (!job.manual_status_override) {
        if (isProof) {
          await updateJobMutation.mutateAsync({ 
            data: { status: 'Proof Sent', last_activity_date: new Date().toISOString() },
            trigger: 'proof_sent'
          });
        } else if (user.role === 'client' && job.status === 'Proof Sent') {
          await updateJobMutation.mutateAsync({ 
            data: { status: 'Revisions Requested', last_activity_date: new Date().toISOString() },
            trigger: 'revisions_requested'
          });
        } else {
          await base44.entities.Job.update(jobId, {
            last_activity_date: new Date().toISOString()
          });
        }
      } else {
        await base44.entities.Job.update(jobId, {
          last_activity_date: new Date().toISOString()
        });
      }
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', jobId] });
      queryClient.invalidateQueries({ queryKey: ['job', jobId] });
      setNewMessage('');
      toast.success('Message sent');
    }
  });

  useEffect(() => {
    // Auto-update status to "Job in Progress" when designer opens job
    if (job && user?.role === 'designer' && job.status === 'New Job' && !job.manual_status_override) {
      updateJobMutation.mutate({
        data: {
          status: 'Job in Progress',
          last_activity_date: new Date().toISOString()
        },
        trigger: 'job_started'
      });
    }
  }, [job, user]);

  const handleMessageSent = async (messageData, isProof = false) => {
    await sendMessageMutation.mutateAsync({ messageData, isProof });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      const userName = user.first_name && user.last_name 
        ? `${user.first_name} ${user.last_name}` 
        : user.full_name || user.email;
      
      await base44.entities.FileUpload.create({
        job_id: jobId,
        uploader_id: user.id,
        uploader_name: userName,
        file_name: file.name,
        file_url,
        file_type: file.type,
        file_size: file.size
      });

      queryClient.invalidateQueries({ queryKey: ['files', jobId] });
      toast.success('File uploaded');
    } catch (error) {
      toast.error('Failed to upload file');
    }
    setUploading(false);
  };

  const handleStatusChange = async (status) => {
    // Determine notification trigger based on status change
    let trigger = null;
    if (status === 'Proof Sent') trigger = 'proof_sent';
    if (status === 'Revisions Requested') trigger = 'revisions_requested';
    if (status === 'Job Complete') trigger = 'job_completed';
    if (status === 'Job in Progress' && job.status === 'New Job') trigger = 'job_started';
    
    const updateData = {
      status,
      manual_status_override: true,
      last_activity_date: new Date().toISOString()
    };
    
    // Add completion date when job is marked complete
    if (status === 'Job Complete') {
      updateData.completed_date = new Date().toISOString();
    }
    
    await updateJobMutation.mutateAsync({
      data: updateData,
      trigger
    });
  };

  const handleEnableAutoUpdates = async () => {
    await updateJobMutation.mutateAsync({
      data: {
        manual_status_override: false
      }
    });
    toast.success('Automatic status updates re-enabled');
  };

  const handleArchiveJob = async () => {
    await updateJobMutation.mutateAsync({
      data: {
        archived: true,
        archived_date: new Date().toISOString()
      }
    });
    toast.success('Job archived');
    navigate(getDashboardUrl());
  };

  const handleDuplicateAndReactivate = async () => {
    const confirmed = confirm('This will create a new job with the same details, including all messages and files. Continue?');
    if (!confirmed) return;

    try {
      // Create new job with data from archived job
      const newJobNumber = `${job.job_number}-R${Date.now().toString().slice(-4)}`;
      const newJob = await base44.entities.Job.create({
        job_number: newJobNumber,
        job_name: job.job_name,
        previous_job_number: job.job_number,
        department_id: job.department_id,
        department_name: job.department_name,
        client_id: job.client_id,
        client_name: job.client_name,
        designer_id: job.designer_id,
        designer_name: job.designer_name,
        status: 'New Job',
        form_data: job.form_data,
        support_emails: job.support_emails,
        last_activity_date: new Date().toISOString()
      });

      // Copy all messages from old job
      const oldMessages = await base44.entities.Message.filter({ job_id: jobId }, 'created_date');
      for (const msg of oldMessages) {
        await base44.entities.Message.create({
          job_id: newJob.id,
          sender_id: msg.sender_id,
          sender_name: msg.sender_name,
          sender_role: msg.sender_role,
          content: msg.content,
          is_proof: msg.is_proof,
          attachments: msg.attachments
        });
      }

      // Copy all file uploads from old job
      const oldFiles = await base44.entities.FileUpload.filter({ job_id: jobId });
      for (const file of oldFiles) {
        await base44.entities.FileUpload.create({
          job_id: newJob.id,
          uploader_id: file.uploader_id,
          uploader_name: file.uploader_name,
          file_name: file.file_name,
          file_url: file.file_url,
          google_drive_file_id: file.google_drive_file_id,
          file_type: file.file_type,
          file_size: file.file_size
        });
      }

      const userName = user.first_name && user.last_name 
        ? `${user.first_name} ${user.last_name}` 
        : user.full_name || user.email;
      
      // Add a message to the new job noting it was reactivated
      await base44.entities.Message.create({
        job_id: newJob.id,
        sender_id: user.id,
        sender_name: userName,
        sender_role: user.role || 'client',
        content: `Job reactivated from previous job #${job.job_number}`,
        is_proof: false
      });

      toast.success('Job duplicated and reactivated with all messages and files');
      navigate(createPageUrl('JobDetail') + `?id=${newJob.id}`);
    } catch (error) {
      toast.error('Failed to duplicate job');
    }
  };



  const handleCompleteJob = async () => {
    await updateJobMutation.mutateAsync({
      data: {
        status: 'Job Complete',
        completed_date: new Date().toISOString(),
        last_activity_date: new Date().toISOString()
      },
      trigger: 'job_completed'
    });
    
    // Check if survey already exists for this job
    const existingSurveys = await base44.entities.Survey.filter({ job_id: jobId });
    
    if (existingSurveys.length === 0 && user.role === 'client') {
      // Show survey prompt to client
      const takeSurvey = confirm('Would you like to complete a quick satisfaction survey about this job?');
      if (takeSurvey) {
        navigate(createPageUrl('ClientSurvey') + `?jobId=${jobId}`);
      }
    } else {
      toast.success('Job marked as complete');
    }
  };

  const handleDesignerChange = async (designerId) => {
    const designer = designers.find(d => d.id === designerId);
    
    // Auto-update status to "Job in Progress" when designer is assigned
    const statusUpdate = job.status === 'New Job' && !job.manual_status_override 
      ? { status: 'Job in Progress' } 
      : {};
    
    await updateJobMutation.mutateAsync({
      data: {
        designer_id: designerId,
        designer_name: designer?.full_name,
        last_activity_date: new Date().toISOString(),
        ...statusUpdate
      },
      trigger: 'job_assigned'
    });
    
    if (statusUpdate.status) {
      toast.success('Designer assigned and status updated to Job in Progress');
    } else {
      toast.success('Designer assigned');
    }
  };

  const handleSupportEmailsUpdate = async () => {
    const emailArray = supportEmails.split(',').map(e => e.trim()).filter(e => e);
    await updateJobMutation.mutateAsync({
      data: {
        support_emails: emailArray
      }
    });
    toast.success('Support emails updated');
  };

  if (jobLoading || !user || !job) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <GlassCard className="p-8">
          <Loader2 className="w-8 h-8 animate-spin text-[#4791FF]" />
        </GlassCard>
      </div>
    );
  }

  // Permission checks using granular permission system
  const userCanEditJob = canEditJob(user, job);
  const userCanChangeStatus = canChangeStatus(user, job);
  const userCanAssignDesigner = canAssignDesigner(user);
  const userCanSendProof = canSendProof(user, job);
  const userCanCompleteJob = canCompleteJob(user, job);
  const userCanToggleAutoStatus = hasPermission(user, 'TOGGLE_AUTO_STATUS');
  const userCanManageSupportEmails = hasPermission(user, 'MANAGE_SUPPORT_EMAILS');
  const userCanArchive = hasPermission(user, 'ARCHIVE_JOB');
  const availableStatuses = getAvailableStatuses(user, job);

  const getDashboardUrl = () => {
    if (user.role === 'client') return createPageUrl('ClientDashboard');
    if (user.role === 'designer') return createPageUrl('DesignerDashboard');
    if (user.role === 'admin') return createPageUrl('AdminDashboard');
    if (user.role === 'manager') return createPageUrl('ManagerDashboard');
    return createPageUrl('ClientDashboard');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Button
        variant="ghost"
        onClick={() => navigate(getDashboardUrl())}
        className="mb-6 text-gray-700 hover:text-black"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Dashboard
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Job Header */}
          <GlassCard>
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="text-2xl font-bold text-black">{job.job_name}</h1>
                  {job.previous_job_number && (
                    <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded">
                      REACTIVATED
                    </span>
                  )}
                </div>
                <p className="text-gray-600">Job #{job.job_number}</p>
                {job.previous_job_number && (
                  <p className="text-gray-600 text-sm mt-1">
                    Previous Job #: {job.previous_job_number}
                  </p>
                )}
              </div>
              <StatusBadge status={job.status} />
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Client:</span>
                <p className="text-black font-medium">{job.client_name}</p>
              </div>
              <div>
                <span className="text-gray-600">Department:</span>
                <p className="text-black font-medium">{job.department_name}</p>
              </div>
              <div>
                <span className="text-gray-600">Designer:</span>
                <p className="text-black font-medium">{job.designer_name || 'Unassigned'}</p>
              </div>
              <div>
                <span className="text-gray-600">Created:</span>
                <p className="text-black font-medium">
                  {new Date(job.created_date + 'Z').toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
                </p>
              </div>
              {job.client_email && (
                <div>
                  <span className="text-gray-600">Client Email:</span>
                  <p className="text-black font-medium">{job.client_email}</p>
                </div>
              )}
              {job.client_phone && (
                <div>
                  <span className="text-gray-600">Client Phone:</span>
                  <p className="text-black font-medium">{job.client_phone}</p>
                </div>
              )}
            </div>

            {job.form_data && Object.keys(job.form_data).length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h3 className="text-black font-semibold mb-2">Job Details</h3>
                {Object.entries(job.form_data).map(([key, value]) => (
                  <div key={key} className="mb-2">
                    <span className="text-gray-600 text-sm">{key}:</span>
                    <p className="text-black">{value}</p>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>

          {/* Timeline & Communication Tabs */}
          <GlassCard>
            <Tabs defaultValue="comments" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="comments">
                  <Send className="w-4 h-4 mr-2" />
                  Comments
                </TabsTrigger>
                <TabsTrigger value="timeline">
                  <Clock className="w-4 h-4 mr-2" />
                  Timeline
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="comments">
                <CommentThread
                  messages={messages}
                  jobId={jobId}
                  user={user}
                  job={job}
                  onMessageSent={handleMessageSent}
                  canSendProof={userCanSendProof}
                />
              </TabsContent>
              
              <TabsContent value="timeline">
                <JobTimeline 
                  job={job} 
                  messages={messages} 
                  files={files} 
                />
              </TabsContent>
            </Tabs>
          </GlassCard>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Management */}
          {userCanChangeStatus && availableStatuses.length > 0 && (
            <GlassCard>
              <h3 className="text-black font-semibold mb-3">Change Status</h3>
              <Select value={job.status} onValueChange={handleStatusChange}>
                <SelectTrigger className="glass border-[#4791FF]/30 text-black">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableStatuses.map(status => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {job.manual_status_override && userCanToggleAutoStatus && (
                <div className="mt-3 p-3 bg-amber-50 rounded-lg">
                  <p className="text-xs text-amber-800 mb-2">
                    Manual override active - automatic updates disabled
                  </p>
                  <Button
                    onClick={handleEnableAutoUpdates}
                    size="sm"
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    Re-enable Automatic Updates
                  </Button>
                </div>
              )}
            </GlassCard>
          )}
          
          {/* Automation Info */}
          {userCanToggleAutoStatus && !job.manual_status_override && (
            <StatusAutomationInfo />
          )}

          {/* Designer Assignment */}
          {userCanAssignDesigner && (
            <GlassCard>
              <h3 className="text-black font-semibold mb-3">Assign Designer</h3>
              <Select value={job.designer_id || ''} onValueChange={handleDesignerChange}>
                <SelectTrigger className="glass border-[#4791FF]/30 text-black">
                  <SelectValue placeholder="Select designer" />
                </SelectTrigger>
                <SelectContent>
                  {designers.map(designer => (
                    <SelectItem key={designer.id} value={designer.id}>
                      {designer.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </GlassCard>
          )}

          {/* Support Emails */}
          {userCanManageSupportEmails && (
            <GlassCard>
              <h3 className="text-black font-semibold mb-3">Support Staff Emails</h3>
              <Input
                value={supportEmails}
                onChange={(e) => setSupportEmails(e.target.value)}
                placeholder="email1@example.com, email2@example.com"
                className="glass border-[#4791FF]/30 text-black placeholder:text-gray-500 mb-2"
              />
              <Button
                onClick={handleSupportEmailsUpdate}
                className="w-full bg-[#4791FF] hover:bg-[#3680ee] text-white"
                size="sm"
              >
                Update Emails
              </Button>
              {job.support_emails?.length > 0 && (
                <div className="mt-2 text-xs text-gray-600">
                  Current: {job.support_emails.join(', ')}
                </div>
              )}
            </GlassCard>
          )}

          {/* Files */}
          <GlassCard>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-black font-semibold">Files</h3>
              <label htmlFor="file-upload-detail" className="cursor-pointer">
                <div className="glass-strong hover:glass px-3 py-1 rounded-lg text-black text-sm flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Upload
                </div>
                <input
                  id="file-upload-detail"
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {uploading && (
              <div className="flex items-center gap-2 text-gray-600 mb-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Uploading...</span>
              </div>
            )}

            <div className="space-y-2">
              {files.map((file) => (
                <div key={file.id} className="glass rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-black text-sm font-medium">{file.file_name}</p>
                      <p className="text-gray-500 text-xs">
                        {file.uploader_name} • {new Date(file.created_date + 'Z').toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
                      </p>
                    </div>
                    <a
                      href={file.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-black"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              ))}
              {files.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-4">No files uploaded</p>
              )}
            </div>
          </GlassCard>

          {/* Complete Job */}
          {userCanCompleteJob && job.status !== 'Job Complete' && (
            <GlassCard>
              <Button
                onClick={handleCompleteJob}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Mark Job Complete
              </Button>
            </GlassCard>
          )}

          {/* Archive/Duplicate Job */}
          {userCanArchive && (
            <GlassCard>
              {job.archived ? (
                <Button
                  onClick={handleDuplicateAndReactivate}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <ArchiveRestore className="w-4 h-4 mr-2" />
                  Duplicate & Reactivate Job
                </Button>
              ) : (
                <Button
                  onClick={handleArchiveJob}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white"
                >
                  <Archive className="w-4 h-4 mr-2" />
                  Archive Job
                </Button>
              )}
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
}