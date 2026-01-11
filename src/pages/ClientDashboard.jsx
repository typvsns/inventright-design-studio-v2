import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Plus, Loader2, Trash2, Info, Search, List, Grid } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import GlassCard from '../components/ui/GlassCard';
import JobCard from '../components/jobs/JobCard';
import JobRowCompact from '../components/jobs/JobRowCompact';
import { getWordPressUser, isAuthenticated } from '../components/utils/wordpressAuth';

export default function ClientDashboard() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [viewMode, setViewMode] = useState('card');

  useEffect(() => {
    if (!isAuthenticated()) {
      window.location.href = createPageUrl('WordPressLogin');
      return;
    }
    const userData = getWordPressUser();
    setUser(userData);
  }, []);

  const deleteDraftMutation = useMutation({
    mutationFn: async (jobId) => {
      await base44.entities.Job.delete(jobId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-jobs'] });
      toast.success('Draft deleted successfully');
      setDeleteDialogOpen(false);
      setJobToDelete(null);
    },
    onError: () => {
      toast.error('Failed to delete draft');
    }
  });

  const handleDeleteDraft = (job) => {
    setJobToDelete(job);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (jobToDelete) {
      deleteDraftMutation.mutate(jobToDelete.id);
    }
  };

  const { data: jobs, isLoading } = useQuery({
    queryKey: ['client-jobs', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const allJobs = await base44.entities.Job.filter({ client_id: user.id }, '-created_date');
      
      // Filter out drafts older than 90 days and archived jobs
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      
      return allJobs.filter(job => {
        if (job.archived) return false;
        if (job.status === 'Draft') {
          const jobDate = new Date(job.created_date);
          return jobDate > ninetyDaysAgo;
        }
        return true;
      });
    },
    enabled: !!user,
    initialData: []
  });

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: () => base44.entities.Department.list(),
    initialData: []
  });

  // Filter jobs
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = !searchTerm || 
      job.job_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.job_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.department_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDepartment = filterDepartment === 'all' || job.department_id === filterDepartment;
    
    return matchesSearch && matchesDepartment;
  });

  const draftJobs = filteredJobs.filter(job => job.status === 'Draft');
  const activeJobs = filteredJobs.filter(job => job.status !== 'Job Complete' && job.status !== 'Draft');
  const closedJobs = filteredJobs.filter(job => job.status === 'Job Complete');

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <GlassCard className="p-8">
          <Loader2 className="w-8 h-8 animate-spin text-[#4791FF]" />
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#0D1238] mb-2">My Jobs</h1>
          <p className="text-gray-700">Track and manage your design projects</p>
        </div>
        <Link to={createPageUrl('JobIntake')}>
          <Button className="bg-[#4791FF] hover:bg-[#3680ee] text-white">
            <Plus className="w-4 h-4 mr-2" />
            Create Design Studio Order
          </Button>
        </Link>
      </div>

      {draftJobs.length > 0 && (
        <GlassCard variant="strong" className="mb-6">
          <div className="flex items-start justify-between mb-4">
            <h2 className="text-xl font-bold text-black">Drafts</h2>
            <div className="flex items-center gap-2 text-sm text-gray-600 bg-blue-50 px-3 py-1.5 rounded-lg">
              <Info className="w-4 h-4" />
              <span>Drafts auto-delete after 90 days</span>
            </div>
          </div>
          <div className="space-y-3">
            {draftJobs.map(job => (
              <div
                key={job.id}
                className="p-4 rounded-lg border-2 border-dashed border-[#4791FF]/40 hover:border-[#4791FF] transition-all group"
              >
                <div className="flex items-center justify-between">
                  <Link 
                    to={createPageUrl('JobIntake') + `?draftId=${job.id}`}
                    className="flex-1 hover:bg-blue-50/50 -m-4 p-4 rounded-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-black">{job.job_name}</h3>
                        <p className="text-sm text-gray-600">
                          Last edited: {new Date((job.last_activity_date || job.updated_date) + 'Z').toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
                        </p>
                      </div>
                      <span className="text-sm text-[#4791FF] font-medium">Continue Editing →</span>
                    </div>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.preventDefault();
                      handleDeleteDraft(job);
                    }}
                    className="ml-2 text-red-600 hover:text-red-700 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Search and Filters */}
      <GlassCard className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'card' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('card')}
            >
              <Grid className="w-4 h-4 mr-2" />
              Card View
            </Button>
            <Button
              variant={viewMode === 'compact' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('compact')}
            >
              <List className="w-4 h-4 mr-2" />
              List View
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              placeholder="Search jobs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 glass border-[#4791FF]/30 text-black placeholder:text-gray-500"
            />
          </div>
          
          <Select value={filterDepartment} onValueChange={setFilterDepartment}>
            <SelectTrigger className="glass border-[#4791FF]/30 text-black">
              <SelectValue placeholder="All Services" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Services</SelectItem>
              {departments.map(dept => (
                <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </GlassCard>

      <Tabs defaultValue="active" className="space-y-6">
        <TabsList className="glass-dark border border-[#4791FF]/20">
          <TabsTrigger value="active" className="data-[state=active]:bg-[#4791FF] data-[state=active]:text-white text-black">
            Active Jobs ({activeJobs.length})
          </TabsTrigger>
          <TabsTrigger value="closed" className="data-[state=active]:bg-[#4791FF] data-[state=active]:text-white text-black">
            Closed Jobs ({closedJobs.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activeJobs.length === 0 ? (
            <GlassCard className="text-center py-12">
              <p className="text-gray-600 mb-4">No active jobs</p>
              <Link to={createPageUrl('JobIntake')}>
                <Button className="bg-[#4791FF] hover:bg-[#3680ee] text-white">
                  Create Design Studio Order
                </Button>
              </Link>
            </GlassCard>
          ) : viewMode === 'card' ? (
            activeJobs.map(job => (
              <JobCard key={job.id} job={job} />
            ))
          ) : (
            <div className="space-y-2">
              {activeJobs.map(job => (
                <JobRowCompact key={job.id} job={job} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="closed" className="space-y-4">
          {closedJobs.length === 0 ? (
            <GlassCard className="text-center py-12">
              <p className="text-gray-600">No closed jobs</p>
            </GlassCard>
          ) : viewMode === 'card' ? (
            closedJobs.map(job => (
              <JobCard key={job.id} job={job} />
            ))
          ) : (
            <div className="space-y-2">
              {closedJobs.map(job => (
                <JobRowCompact key={job.id} job={job} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Draft</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{jobToDelete?.job_name}"? This action cannot be undone.
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
    </div>
  );
}