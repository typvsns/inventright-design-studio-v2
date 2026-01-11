import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Loader2, Search, Download, Briefcase, List, Grid } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import GlassCard from '../components/ui/GlassCard';
import JobCard from '../components/jobs/JobCard';
import JobRowCompact from '../components/jobs/JobRowCompact';
import { getWordPressUser, isAuthenticated } from '../components/utils/wordpressAuth';

export default function ManagerDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterDesigner, setFilterDesigner] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewMode, setViewMode] = useState('card');

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate(createPageUrl('WordPressLogin'));
      return;
    }
    const userData = getWordPressUser();
    // Manager dashboard requires manager or admin role
    if (userData.role !== 'manager' && userData.role !== 'admin') {
      navigate(createPageUrl('ClientDashboard'));
      return;
    }
    setUser(userData);
  }, [navigate]);

  const { data: jobs, isLoading: jobsLoading } = useQuery({
    queryKey: ['all-jobs'],
    queryFn: async () => {
      const allJobs = await base44.entities.Job.list('-created_date');
      return allJobs.filter(job => !job.archived && job.status !== 'Draft');
    },
    enabled: !!user,
    initialData: []
  });

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: () => base44.entities.Department.list(),
    enabled: !!user,
    initialData: []
  });

  // Extract unique designers from jobs for filter dropdown
  const designerMap = {};
  jobs.forEach(job => {
    if (job.designer_id && job.designer_name) {
      designerMap[job.designer_id] = { id: job.designer_id, full_name: job.designer_name };
    }
  });
  const designers = Object.values(designerMap);

  const filteredJobs = jobs.filter(job => {
    if (job.status === 'Draft') return false;
    
    const matchesSearch = !searchTerm || 
      job.job_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.job_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.client_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDepartment = filterDepartment === 'all' || job.department_id === filterDepartment;
    const matchesDesigner = filterDesigner === 'all' || job.designer_id === filterDesigner;
    const matchesStatus = filterStatus === 'all' || job.status === filterStatus;
    
    return matchesSearch && matchesDepartment && matchesDesigner && matchesStatus;
  });

  const activeJobs = filteredJobs.filter(job => job.status !== 'Job Complete');
  const closedJobs = filteredJobs.filter(job => job.status === 'Job Complete');

  const handleExport = () => {
    const csvContent = [
      ['Job Number', 'Job Name', 'Client', 'Department', 'Designer', 'Status', 'Created Date'],
      ...filteredJobs.map(job => [
        job.job_number,
        job.job_name,
        job.client_name,
        job.department_name,
        job.designer_name || 'Unassigned',
        job.status,
        new Date(job.created_date).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jobs-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

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
        <h1 className="text-3xl font-bold text-black mb-2">Manager Dashboard</h1>
        <p className="text-gray-700">View and manage all jobs</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <GlassCard className="text-center">
          <div className="text-3xl font-bold text-black mb-1">{jobs.filter(j => j.status !== 'Draft').length}</div>
          <div className="text-gray-700 text-sm">Total Jobs</div>
        </GlassCard>
        <GlassCard className="text-center">
          <div className="text-3xl font-bold text-black mb-1">{activeJobs.length}</div>
          <div className="text-gray-700 text-sm">Active Jobs</div>
        </GlassCard>
        <GlassCard className="text-center">
          <div className="text-3xl font-bold text-black mb-1">{closedJobs.length}</div>
          <div className="text-gray-700 text-sm">Closed Jobs</div>
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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map(dept => (
                <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={filterDesigner} onValueChange={setFilterDesigner}>
            <SelectTrigger className="glass border-[#4791FF]/30 text-black">
              <SelectValue placeholder="All Designers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Designers</SelectItem>
              {designers.map(designer => (
                <SelectItem key={designer.id} value={designer.id}>{designer.full_name}</SelectItem>
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
              <SelectItem value="Stuck or Client Response Needed">Stuck/Response Needed</SelectItem>
              <SelectItem value="Small Change">Small Change</SelectItem>
              <SelectItem value="Job Complete">Job Complete</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            onClick={handleExport}
            className="bg-[#4791FF] hover:bg-[#3680ee] text-white"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </GlassCard>

      {/* Jobs Tabs */}
      <Tabs defaultValue="active" className="space-y-6">
        <TabsList className="glass-dark border border-[#4791FF]/20">
          <TabsTrigger value="active" className="data-[state=active]:bg-[#4791FF] data-[state=active]:text-white text-black">
            <Briefcase className="w-4 h-4 mr-2" />
            Active Jobs ({activeJobs.length})
          </TabsTrigger>
          <TabsTrigger value="closed" className="data-[state=active]:bg-[#4791FF] data-[state=active]:text-white text-black">
            <Briefcase className="w-4 h-4 mr-2" />
            Closed Jobs ({closedJobs.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activeJobs.length === 0 ? (
            <GlassCard className="text-center py-12">
              <p className="text-gray-600">No active jobs found</p>
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
              <p className="text-gray-600">No closed jobs found</p>
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