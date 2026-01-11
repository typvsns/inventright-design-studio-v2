import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Loader2, Search, Archive, ArchiveRestore, List, Grid } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import GlassCard from '../components/ui/GlassCard';
import JobCard from '../components/jobs/JobCard';
import JobRowCompact from '../components/jobs/JobRowCompact';
import { hasPermission } from '../components/utils/permissions';
import { toast } from 'sonner';
import { getWordPressUser, isAuthenticated } from '../components/utils/wordpressAuth';

export default function ArchivedJobs() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [viewMode, setViewMode] = useState('card');

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate(createPageUrl('WordPressLogin'));
      return;
    }
    const userData = getWordPressUser();
    if (!hasPermission(userData, 'VIEW_ARCHIVED_JOBS')) {
      navigate(createPageUrl('ClientDashboard'));
      return;
    }
    setUser(userData);
  }, [navigate]);

  const { data: jobs, isLoading: jobsLoading } = useQuery({
    queryKey: ['archived-jobs'],
    queryFn: () => base44.entities.Job.filter({ archived: true }, '-updated_date'),
    enabled: !!user,
    initialData: []
  });

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: () => base44.entities.Department.list(),
    enabled: !!user,
    initialData: []
  });

  const unarchiveMutation = useMutation({
    mutationFn: async (jobId) => {
      await base44.entities.Job.update(jobId, {
        archived: false,
        last_activity_date: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['archived-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['all-jobs'] });
      toast.success('Job unarchived successfully');
    }
  });

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = !searchTerm || 
      job.job_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.job_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.client_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDepartment = filterDepartment === 'all' || job.department_id === filterDepartment;
    
    return matchesSearch && matchesDepartment;
  });

  if (jobsLoading || !user) {
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
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-black mb-2">
          <Archive className="inline w-8 h-8 mr-2" />
          Archived Jobs
        </h1>
        <p className="text-gray-700">View and manage archived jobs</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <GlassCard className="text-center">
          <div className="text-3xl font-bold text-black mb-1">{jobs.length}</div>
          <div className="text-gray-700 text-sm">Total Archived Jobs</div>
        </GlassCard>
        <GlassCard className="text-center">
          <div className="text-3xl font-bold text-black mb-1">
            {jobs.filter(j => j.status === 'Job Complete').length}
          </div>
          <div className="text-gray-700 text-sm">Completed Jobs</div>
        </GlassCard>
      </div>

      {/* Filters */}
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
              placeholder="Search archived jobs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 glass border-[#4791FF]/30 text-black placeholder:text-gray-500"
            />
          </div>
          
          <Select value={filterDepartment} onValueChange={setFilterDepartment}>
            <SelectTrigger className="glass border-[#4791FF]/30 text-black">
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map(dept => (
                <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </GlassCard>

      {/* Jobs List */}
      <div className="space-y-4">
        {filteredJobs.length === 0 ? (
          <GlassCard className="text-center py-12">
            <Archive className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">No archived jobs found</p>
          </GlassCard>
        ) : viewMode === 'card' ? (
          filteredJobs.map(job => (
            <div key={job.id} className="relative">
              <JobCard job={job} />
              <div className="absolute top-4 right-4">
                <Button
                  onClick={() => unarchiveMutation.mutate(job.id)}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <ArchiveRestore className="w-4 h-4 mr-2" />
                  Unarchive
                </Button>
              </div>
            </div>
          ))
        ) : (
          filteredJobs.map(job => (
            <div key={job.id} className="flex items-center gap-2">
              <div className="flex-1">
                <JobRowCompact job={job} />
              </div>
              <Button
                onClick={() => unarchiveMutation.mutate(job.id)}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <ArchiveRestore className="w-4 h-4 mr-2" />
                Unarchive
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}