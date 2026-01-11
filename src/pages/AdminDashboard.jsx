import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Loader2, Search, Download, Users, Briefcase, Building2, Plus, List, Grid } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import GlassCard from '../components/ui/GlassCard';
import JobCard from '../components/jobs/JobCard';
import JobRowCompact from '../components/jobs/JobRowCompact';
import { getWordPressUser, isAuthenticated } from '../components/utils/wordpressAuth';

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [globalSearch, setGlobalSearch] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterDesigner, setFilterDesigner] = useState('all');
  const [viewMode, setViewMode] = useState('card');
  const [showDeptForm, setShowDeptForm] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [deptFormData, setDeptFormData] = useState({
    name: '',
    description: '',
    active: true
  });

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate(createPageUrl('WordPressLogin'));
      return;
    }
    const userData = getWordPressUser();
    // Admin dashboard requires admin or manager role
    if (userData.role !== 'admin' && userData.role !== 'manager') {
      navigate(createPageUrl('ClientDashboard'));
      return;
    }
    setUser(userData);
    setIsAuthorized(true);
  }, [navigate]);

  const { data: jobs, isLoading: jobsLoading } = useQuery({
    queryKey: ['all-jobs'],
    queryFn: async () => {
      const allJobs = await base44.entities.Job.list('-created_date');
      return allJobs.filter(job => !job.archived && job.status !== 'Draft');
    },
    initialData: []
  });

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: () => base44.entities.Department.list(),
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

  const saveDepartmentMutation = useMutation({
    mutationFn: async (deptData) => {
      if (editingDept) {
        return await base44.entities.Department.update(editingDept.id, deptData);
      } else {
        return await base44.entities.Department.create(deptData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast.success(`Department ${editingDept ? 'updated' : 'created'} successfully`);
      setShowDeptForm(false);
      setEditingDept(null);
      setDeptFormData({ name: '', description: '', active: true });
    },
    onError: () => {
      toast.error('Failed to save department');
    }
  });

  // Filter jobs
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = !searchTerm || 
      job.job_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.job_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.client_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDepartment = filterDepartment === 'all' || job.department_id === filterDepartment;
    const matchesDesigner = filterDesigner === 'all' || job.designer_id === filterDesigner;
    
    return matchesSearch && matchesDepartment && matchesDesigner;
  });

  const activeJobs = filteredJobs.filter(job => job.status !== 'Job Complete');
  const closedJobs = filteredJobs.filter(job => job.status === 'Job Complete');

  // Global search across jobs
  const globalSearchResults = globalSearch ? {
    jobs: jobs.filter(job => 
      job.job_name?.toLowerCase().includes(globalSearch.toLowerCase()) ||
      job.job_number?.toLowerCase().includes(globalSearch.toLowerCase()) ||
      job.client_name?.toLowerCase().includes(globalSearch.toLowerCase()) ||
      job.department_name?.toLowerCase().includes(globalSearch.toLowerCase())
    )
  } : null;

  const handleEditDept = (dept) => {
    setEditingDept(dept);
    setDeptFormData({
      name: dept.name,
      description: dept.description || '',
      active: dept.active !== false
    });
    setShowDeptForm(true);
  };

  const handleSaveDept = (e) => {
    e.preventDefault();
    saveDepartmentMutation.mutate(deptFormData);
  };

  const handleExport = () => {
    const csvContent = [
      ['Job Number', 'Job Name', 'Client', 'Department', 'Designer', 'Status', 'Created Date', 'Last Activity'],
      ...filteredJobs.map(job => [
        job.job_number,
        job.job_name,
        job.client_name,
        job.department_name,
        job.designer_name || 'Unassigned',
        job.status,
        job.created_date,
        job.last_activity_date || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jobs-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (jobsLoading || !user || !isAuthorized) {
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
        <h1 className="text-3xl font-bold text-black mb-2">{user.role === 'manager' ? 'Manager Dashboard' : 'Admin Dashboard'}</h1>
        <p className="text-gray-700">Manage all jobs{user.role === 'admin' ? ', users, and departments' : ''}</p>
      </div>

      {/* Global Search Bar */}
      <GlassCard className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
          <Input
            placeholder="Global search: jobs, clients, designers..."
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            className="pl-10 glass border-[#4791FF]/30 text-black placeholder:text-gray-500 text-lg py-6"
          />
        </div>
        
        {globalSearchResults && (
          <div className="mt-4 space-y-4">
            {globalSearchResults.jobs.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Jobs ({globalSearchResults.jobs.length})</h3>
                <div className="space-y-2">
                  {globalSearchResults.jobs.slice(0, 5).map(job => (
                    <JobCard key={job.id} job={job} />
                  ))}
                  {globalSearchResults.jobs.length > 5 && (
                    <p className="text-sm text-gray-600 text-center">
                      +{globalSearchResults.jobs.length - 5} more jobs
                    </p>
                  )}
                </div>
              </div>
            )}
            
            {globalSearchResults.jobs.length === 0 && (
              <p className="text-center text-gray-600 py-4">No results found</p>
            )}
          </div>
        )}
      </GlassCard>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <GlassCard className="text-center">
          <div className="text-3xl font-bold text-black mb-1">{jobs.length}</div>
          <div className="text-gray-700 text-sm">Total Jobs</div>
        </GlassCard>
        <GlassCard className="text-center">
          <div className="text-3xl font-bold text-black mb-1">{activeJobs.length}</div>
          <div className="text-gray-700 text-sm">Active Jobs</div>
        </GlassCard>
        <GlassCard className="text-center">
          <div className="text-3xl font-bold text-black mb-1">{closedJobs.length}</div>
          <div className="text-gray-700 text-sm">Completed Jobs</div>
        </GlassCard>
        <GlassCard className="text-center">
          <div className="text-3xl font-bold text-black mb-1">{designers.length}</div>
          <div className="text-gray-700 text-sm">Active Designers</div>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
          
          <Button
            onClick={handleExport}
            className="bg-[#4791FF] hover:bg-[#3680ee] text-white"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </GlassCard>

      {/* Main Content Tabs */}
      <Tabs defaultValue="jobs" className="space-y-6">
        <TabsList className="glass-dark border border-[#4791FF]/20">
          <TabsTrigger value="jobs" className="data-[state=active]:bg-[#4791FF] data-[state=active]:text-white text-black">
            <Briefcase className="w-4 h-4 mr-2" />
            Jobs
          </TabsTrigger>
          <TabsTrigger value="users" className="data-[state=active]:bg-[#4791FF] data-[state=active]:text-white text-black">
            <Users className="w-4 h-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="departments" className="data-[state=active]:bg-[#4791FF] data-[state=active]:text-white text-black">
            <Building2 className="w-4 h-4 mr-2" />
            Departments
          </TabsTrigger>
        </TabsList>

        {/* Jobs Tab */}
        <TabsContent value="jobs" className="space-y-6">
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
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <GlassCard>
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-black mb-2">User Management</h3>
              <p className="text-gray-600 mb-4">
                Users are managed through your WordPress admin panel.
              </p>
              <p className="text-sm text-gray-500">
                User roles (admin, manager, designer, client) are assigned via WordPress user roles.
              </p>
              <a 
                href="https://inventtraining.com/wp-admin/users.php" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block mt-4"
              >
                <Button className="bg-[#4791FF] hover:bg-[#3680ee] text-white">
                  Open WordPress Users
                </Button>
              </a>
            </div>
          </GlassCard>
        </TabsContent>

        {/* Departments Tab */}
        <TabsContent value="departments" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-black">Department Management</h2>
            <Button
              onClick={() => {
                setShowDeptForm(true);
                setEditingDept(null);
                setDeptFormData({ name: '', description: '', active: true });
              }}
              className="bg-[#4791FF] hover:bg-[#3680ee] text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Department
            </Button>
          </div>

          {showDeptForm && (
            <GlassCard variant="strong">
              <h3 className="text-lg font-semibold text-black mb-4">
                {editingDept ? 'Edit Department' : 'New Department'}
              </h3>
              <form onSubmit={handleSaveDept} className="space-y-4">
                <div>
                  <Label htmlFor="deptName" className="text-black">Department Name *</Label>
                  <Input
                    id="deptName"
                    value={deptFormData.name}
                    onChange={(e) => setDeptFormData({ ...deptFormData, name: e.target.value })}
                    className="glass border-[#4791FF]/30 text-black"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="deptDesc" className="text-black">Description</Label>
                  <Textarea
                    id="deptDesc"
                    value={deptFormData.description}
                    onChange={(e) => setDeptFormData({ ...deptFormData, description: e.target.value })}
                    className="glass border-[#4791FF]/30 text-black"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="deptActive"
                    checked={deptFormData.active}
                    onChange={(e) => setDeptFormData({ ...deptFormData, active: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="deptActive" className="text-black">Active</Label>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="bg-[#4791FF] hover:bg-[#3680ee] text-white">
                    Save Department
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowDeptForm(false);
                      setEditingDept(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </GlassCard>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {departments.map(dept => (
              <GlassCard key={dept.id}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-lg font-semibold text-black">{dept.name}</h3>
                    {dept.description && (
                      <p className="text-sm text-gray-600 mt-1">{dept.description}</p>
                    )}
                  </div>
                  <Badge variant={dept.active !== false ? "default" : "secondary"}>
                    {dept.active !== false ? "Active" : "Archived"}
                  </Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditDept(dept)}
                  className="mt-3"
                >
                  Edit
                </Button>
              </GlassCard>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}