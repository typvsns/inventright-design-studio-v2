import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Loader2, Search, List, Grid } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import GlassCard from '../components/ui/GlassCard';
import JobCard from '../components/jobs/JobCard';
import JobRowCompact from '../components/jobs/JobRowCompact';
import { getWordPressUser, isAuthenticated } from '../components/utils/wordpressAuth';

export default function DesignerDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [viewMode, setViewMode] = useState('card');

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate(createPageUrl('WordPressLogin'));
      return;
    }
    const userData = getWordPressUser();
    // Designer dashboard requires designer, manager, or admin role - redirect clients
    if (userData.role !== 'designer' && userData.role !== 'admin' && userData.role !== 'manager') {
      navigate(createPageUrl('ClientDashboard'));
      return;
    }
    setUser(userData);
  }, [navigate]);

  const { data: jobs, isLoading } = useQuery({
    queryKey: ['designer-jobs', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const allJobs = await base44.entities.Job.filter({ designer_id: user.id }, '-created_date');
      return allJobs.filter(job => !job.archived);
    },
    enabled: !!user,
    initialData: []
  });

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: () => base44.entities.Department.list(),
    initialData: []
  });

  // Check for stale jobs (no activity for 7 days)
  const checkStaleJobs = (jobsList) => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    return jobsList.map(job => {
      if (job.status !== 'Job Complete') {
        const lastActivity = job.last_activity_date || job.created_date;
        const isStale = new Date(lastActivity) < sevenDaysAgo;
        return { ...job, isStale };
      }
      return job;
    });
  };

  // Filter jobs
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = !searchTerm || 
      job.job_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.job_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.client_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDepartment = filterDepartment === 'all' || job.department_id === filterDepartment;
    const matchesStatus = filterStatus === 'all' || job.status === filterStatus;
    
    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const jobsWithStaleCheck = checkStaleJobs(filteredJobs);
  const activeJobs = jobsWithStaleCheck.filter(job => job.status !== 'Job Complete');
  const closedJobs = jobsWithStaleCheck.filter(job => job.status === 'Job Complete');

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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-black mb-2">My Assigned Jobs</h1>
        <p className="text-gray-700">Manage your design projects</p>
      </div>

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="glass border-[#4791FF]/30 text-black">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="New Job">New Job</SelectItem>
              <SelectItem value="Job in Progress">Job in Progress</SelectItem>
              <SelectItem value="Proof Sent">Proof Sent</SelectItem>
              <SelectItem value="Revisions Requested">Revisions Requested</SelectItem>
              <SelectItem value="On Hold">On Hold</SelectItem>
              <SelectItem value="Stuck or Client Response Needed">Stuck</SelectItem>
              <SelectItem value="Small Change">Small Change</SelectItem>
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
              <p className="text-gray-600">No active jobs assigned</p>
            </GlassCard>
          ) : viewMode === 'card' ? (
            activeJobs.map(job => (
              <JobCard key={job.id} job={job} isStale={job.isStale} />
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
    </div>
  );
}