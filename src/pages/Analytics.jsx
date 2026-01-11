import React, { useState, useMemo, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Download, TrendingUp, Users, Briefcase, Award, Loader2, DollarSign, Clock, Target, TrendingDown } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Area } from 'recharts';
import GlassCard from '../components/ui/GlassCard';
import { toast } from 'sonner';
import { getWordPressUser, isAuthenticated } from '../components/utils/wordpressAuth';

const COLORS = ['#4791FF', '#FF9147', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];

export default function Analytics() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [timeRange, setTimeRange] = useState('30');

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate(createPageUrl('WordPressLogin'));
      return;
    }
    const userData = getWordPressUser();
    if (userData.role !== 'admin') {
      navigate(createPageUrl('ClientDashboard'));
      return;
    }
    setUser(userData);
  }, [navigate]);

  const { data: jobs, isLoading: jobsLoading } = useQuery({
    queryKey: ['all-jobs-analytics'],
    queryFn: () => base44.entities.Job.list('-created_date', 1000),
    enabled: !!user,
    initialData: []
  });

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: () => base44.entities.Department.list(),
    enabled: !!user,
    initialData: []
  });

  const { data: surveys } = useQuery({
    queryKey: ['surveys'],
    queryFn: () => base44.entities.Survey.list('-submitted_date'),
    enabled: !!user,
    initialData: []
  });

  const filteredJobs = useMemo(() => {
    if (!jobs.length) return [];
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(timeRange));
    return jobs.filter(job => new Date(job.created_date) >= daysAgo && job.status !== 'Draft');
  }, [jobs, timeRange]);

  const analytics = useMemo(() => {
    if (!filteredJobs.length) return null;

    const totalJobs = filteredJobs.length;
    const completedJobs = filteredJobs.filter(j => j.status === 'Job Complete').length;
    const activeJobs = filteredJobs.filter(j => j.status !== 'Job Complete').length;
    const completionRate = totalJobs > 0 ? ((completedJobs / totalJobs) * 100).toFixed(1) : 0;

    // Average completion time and turnaround metrics
    const completedJobsWithDate = filteredJobs.filter(j => j.status === 'Job Complete' && j.completed_date);
    const avgCompletionTime = completedJobsWithDate.length > 0
      ? completedJobsWithDate.reduce((sum, job) => {
          const days = Math.ceil((new Date(job.completed_date) - new Date(job.created_date)) / (1000 * 60 * 60 * 24));
          return sum + days;
        }, 0) / completedJobsWithDate.length
      : 0;

    // Turnaround time distribution
    const turnaroundBuckets = { '0-3 days': 0, '4-7 days': 0, '8-14 days': 0, '15-30 days': 0, '30+ days': 0 };
    completedJobsWithDate.forEach(job => {
      const days = Math.ceil((new Date(job.completed_date) - new Date(job.created_date)) / (1000 * 60 * 60 * 24));
      if (days <= 3) turnaroundBuckets['0-3 days']++;
      else if (days <= 7) turnaroundBuckets['4-7 days']++;
      else if (days <= 14) turnaroundBuckets['8-14 days']++;
      else if (days <= 30) turnaroundBuckets['15-30 days']++;
      else turnaroundBuckets['30+ days']++;
    });
    const turnaroundDistribution = Object.entries(turnaroundBuckets).map(([range, count]) => ({ range, count }));

    // Jobs by status
    const statusCounts = {};
    filteredJobs.forEach(job => {
      statusCounts[job.status] = (statusCounts[job.status] || 0) + 1;
    });
    const jobsByStatus = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

    // Jobs by department
    const deptCounts = {};
    filteredJobs.forEach(job => {
      if (job.department_name) {
        deptCounts[job.department_name] = (deptCounts[job.department_name] || 0) + 1;
      }
    });
    const jobsByDepartment = Object.entries(deptCounts).map(([name, value]) => ({ name, value }));

    // Designer performance with enhanced metrics (based on jobs data)
    const designerMap = {};
    filteredJobs.forEach(job => {
      if (job.designer_id && job.designer_name) {
        if (!designerMap[job.designer_id]) {
          designerMap[job.designer_id] = {
            id: job.designer_id,
            name: job.designer_name,
            jobs: []
          };
        }
        designerMap[job.designer_id].jobs.push(job);
      }
    });
    
    const designerStats = Object.values(designerMap).map(designer => {
      const designerJobs = designer.jobs;
      const completed = designerJobs.filter(j => j.status === 'Job Complete').length;
      const completedWithDate = designerJobs.filter(j => j.status === 'Job Complete' && j.completed_date);
      const avgTurnaround = completedWithDate.length > 0
        ? completedWithDate.reduce((sum, job) => {
            const days = Math.ceil((new Date(job.completed_date) - new Date(job.created_date)) / (1000 * 60 * 60 * 24));
            return sum + days;
          }, 0) / completedWithDate.length
        : 0;
      
      return {
        name: designer.name,
        total: designerJobs.length,
        active: designerJobs.filter(j => j.status !== 'Job Complete').length,
        completed,
        completionRate: designerJobs.length > 0 ? ((completed / designerJobs.length) * 100).toFixed(1) : 0,
        avgTurnaround: avgTurnaround.toFixed(1)
      };
    }).filter(d => d.total > 0).sort((a, b) => b.completed - a.completed);

    // Jobs over time with completion tracking
    const jobsOverTime = [];
    if (parseInt(timeRange) >= 30) {
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const created = filteredJobs.filter(j => j.created_date.split('T')[0] === dateStr).length;
        const completed = filteredJobs.filter(j => j.completed_date && j.completed_date.split('T')[0] === dateStr).length;
        jobsOverTime.push({
          date: `${date.getMonth() + 1}/${date.getDate()}`,
          created,
          completed
        });
      }
    }

    // Financial metrics (based on department pricing)
    const sellSheetPrice = 249;
    const lineDrawingPricePerDrawing = 30;
    const virtualPrototypeBasePrice = 499;
    const designPackagePrice = 1500;

    let totalRevenue = 0;
    let potentialRevenue = 0;

    filteredJobs.forEach(job => {
      let jobPrice = 0;
      if (job.department_name === 'Sell Sheets') {
        jobPrice = sellSheetPrice;
      } else if (job.department_name === 'Line Drawings') {
        jobPrice = (job.form_data?.numberOfDrawings || 1) * lineDrawingPricePerDrawing;
      } else if (job.department_name === 'Virtual Prototypes') {
        jobPrice = virtualPrototypeBasePrice;
        if (job.form_data?.arUpgrade) jobPrice += 99;
        if (job.form_data?.arVirtualPrototype) jobPrice += 99;
        if (job.form_data?.animatedVideo === 'rotation') jobPrice += 300;
        else if (job.form_data?.animatedVideo === 'exploded') jobPrice += 350;
        else if (job.form_data?.animatedVideo === 'both') jobPrice += 400;
      } else if (job.department_name === 'Design Package') {
        jobPrice = designPackagePrice;
      }

      if (job.status === 'Job Complete') {
        totalRevenue += jobPrice;
      }
      potentialRevenue += jobPrice;
    });

    // Revenue by department
    const revenueByDept = {};
    filteredJobs.filter(j => j.status === 'Job Complete').forEach(job => {
      const dept = job.department_name || 'Other';
      let jobPrice = 0;
      
      if (dept === 'Sell Sheets') jobPrice = sellSheetPrice;
      else if (dept === 'Line Drawings') jobPrice = (job.form_data?.numberOfDrawings || 1) * lineDrawingPricePerDrawing;
      else if (dept === 'Virtual Prototypes') {
        jobPrice = virtualPrototypeBasePrice;
        if (job.form_data?.arUpgrade) jobPrice += 99;
        if (job.form_data?.arVirtualPrototype) jobPrice += 99;
        if (job.form_data?.animatedVideo === 'rotation') jobPrice += 300;
        else if (job.form_data?.animatedVideo === 'exploded') jobPrice += 350;
        else if (job.form_data?.animatedVideo === 'both') jobPrice += 400;
      } else if (dept === 'Design Package') jobPrice = designPackagePrice;

      revenueByDept[dept] = (revenueByDept[dept] || 0) + jobPrice;
    });
    const revenueByDepartment = Object.entries(revenueByDept).map(([name, revenue]) => ({ name, revenue }));

    // Client satisfaction metrics
    const filteredSurveys = surveys.filter(s => {
      const surveyDate = new Date(s.submitted_date);
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(timeRange));
      return surveyDate >= daysAgo;
    });

    const avgDeliverablesSatisfaction = filteredSurveys.length > 0
      ? (filteredSurveys.reduce((sum, s) => sum + s.deliverables_satisfaction, 0) / filteredSurveys.length).toFixed(1)
      : 0;
    
    const avgCommunicationRating = filteredSurveys.length > 0
      ? (filteredSurveys.reduce((sum, s) => sum + s.communication_rating, 0) / filteredSurveys.length).toFixed(1)
      : 0;
    
    const avgSpeedSatisfaction = filteredSurveys.length > 0
      ? (filteredSurveys.reduce((sum, s) => sum + s.speed_satisfaction, 0) / filteredSurveys.length).toFixed(1)
      : 0;
    
    const avgReturnLikelihood = filteredSurveys.length > 0
      ? (filteredSurveys.reduce((sum, s) => sum + s.likelihood_to_return, 0) / filteredSurveys.length).toFixed(1)
      : 0;

    const overallSatisfaction = filteredSurveys.length > 0
      ? ((parseFloat(avgDeliverablesSatisfaction) + parseFloat(avgCommunicationRating) + 
          parseFloat(avgSpeedSatisfaction) + parseFloat(avgReturnLikelihood)) / 4).toFixed(1)
      : 0;

    return {
      totalJobs,
      completedJobs,
      activeJobs,
      completionRate,
      avgCompletionTime: avgCompletionTime.toFixed(1),
      turnaroundDistribution,
      jobsByStatus,
      jobsByDepartment,
      designerStats,
      jobsOverTime,
      totalRevenue,
      potentialRevenue,
      revenueByDepartment,
      surveyCount: filteredSurveys.length,
      avgDeliverablesSatisfaction,
      avgCommunicationRating,
      avgSpeedSatisfaction,
      avgReturnLikelihood,
      overallSatisfaction
    };
  }, [filteredJobs, timeRange]);

  const handleExportCSV = () => {
    if (!filteredJobs.length) {
      toast.error('No data to export');
      return;
    }

    const headers = ['Job Number', 'Job Name', 'Department', 'Client', 'Designer', 'Status', 'Created Date', 'Completed Date', 'Days to Complete'];
    const rows = filteredJobs.map(job => {
      const daysToComplete = job.completed_date
        ? Math.ceil((new Date(job.completed_date) - new Date(job.created_date)) / (1000 * 60 * 60 * 24))
        : '';
      return [
        job.job_number,
        job.job_name,
        job.department_name || '',
        job.client_name,
        job.designer_name || 'Unassigned',
        job.status,
        new Date(job.created_date).toLocaleDateString(),
        job.completed_date ? new Date(job.completed_date).toLocaleDateString() : '',
        daysToComplete
      ];
    });

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
    toast.success('Report exported successfully');
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

  if (!analytics) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <GlassCard className="p-8 text-center">
          <p className="text-gray-600">No data available for the selected time range</p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Button
        variant="ghost"
        onClick={() => navigate(createPageUrl('AdminDashboard'))}
        className="mb-6 text-gray-700 hover:text-black"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Dashboard
      </Button>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#0D1238] mb-2">Analytics Dashboard</h1>
          <p className="text-gray-700">Track performance metrics and insights</p>
        </div>
        <div className="flex gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40 glass border-[#4791FF]/30 text-black">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleExportCSV} className="bg-[#4791FF] hover:bg-[#3680ee] text-white">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <GlassCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Jobs</p>
              <p className="text-3xl font-bold text-black">{analytics.totalJobs}</p>
              <p className="text-xs text-gray-500">{analytics.activeJobs} active</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-[#4791FF]" />
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Completed Jobs</p>
              <p className="text-3xl font-bold text-black">{analytics.completedJobs}</p>
              <p className="text-xs text-green-600">{analytics.completionRate}% rate</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Avg. Turnaround</p>
              <p className="text-3xl font-bold text-black">{analytics.avgCompletionTime}</p>
              <p className="text-xs text-gray-500">days</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Revenue (Completed)</p>
              <p className="text-3xl font-bold text-black">${(analytics.totalRevenue / 1000).toFixed(1)}k</p>
              <p className="text-xs text-gray-500">${(analytics.potentialRevenue / 1000).toFixed(1)}k potential</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Jobs by Status */}
        <GlassCard>
          <h3 className="text-lg font-bold text-black mb-4">Jobs by Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analytics.jobsByStatus}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {analytics.jobsByStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* Jobs by Department */}
        <GlassCard>
          <h3 className="text-lg font-bold text-black mb-4">Popular Services</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.jobsByDepartment}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#4791FF" />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>

      {/* Charts Row 2 - Turnaround & Financial */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Turnaround Time Distribution */}
        <GlassCard>
          <h3 className="text-lg font-bold text-black mb-4">Turnaround Time Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.turnaroundDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* Revenue by Department */}
        <GlassCard>
          <h3 className="text-lg font-bold text-black mb-4">Revenue by Service (Completed)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.revenueByDepartment}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip formatter={(value) => `$${value}`} />
              <Bar dataKey="revenue" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>

      {/* Jobs Over Time */}
      {analytics.jobsOverTime.length > 0 && (
        <GlassCard className="mb-6">
          <h3 className="text-lg font-bold text-black mb-4">Job Activity Over Time (Last 30 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={analytics.jobsOverTime}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="created" fill="#4791FF" stroke="#4791FF" fillOpacity={0.3} name="Jobs Created" />
              <Line type="monotone" dataKey="completed" stroke="#10B981" strokeWidth={2} name="Jobs Completed" />
            </ComposedChart>
          </ResponsiveContainer>
        </GlassCard>
      )}

      {/* Client Satisfaction Metrics */}
      {analytics.surveyCount > 0 && (
        <GlassCard className="mb-6">
          <h3 className="text-lg font-bold text-black mb-4">Client Satisfaction Survey Results</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-[#4791FF] mb-1">{analytics.surveyCount}</div>
              <div className="text-sm text-gray-600">Surveys</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-black mb-1">{analytics.avgDeliverablesSatisfaction}</div>
              <div className="text-sm text-gray-600">Deliverables</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-black mb-1">{analytics.avgCommunicationRating}</div>
              <div className="text-sm text-gray-600">Communication</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-black mb-1">{analytics.avgSpeedSatisfaction}</div>
              <div className="text-sm text-gray-600">Speed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-1">{analytics.overallSatisfaction}</div>
              <div className="text-sm text-gray-600">Overall</div>
            </div>
          </div>
          <Button
            onClick={() => navigate(createPageUrl('SurveyResults'))}
            variant="outline"
            className="w-full"
          >
            View All Survey Results
          </Button>
        </GlassCard>
      )}

      {/* Designer Performance */}
      <GlassCard>
        <h3 className="text-lg font-bold text-black mb-4">Designer Performance Metrics</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-gray-700 font-semibold">Designer</th>
                <th className="text-right py-3 px-4 text-gray-700 font-semibold">Total Jobs</th>
                <th className="text-right py-3 px-4 text-gray-700 font-semibold">Active</th>
                <th className="text-right py-3 px-4 text-gray-700 font-semibold">Completed</th>
                <th className="text-right py-3 px-4 text-gray-700 font-semibold">Rate</th>
                <th className="text-right py-3 px-4 text-gray-700 font-semibold">Avg. Turnaround</th>
              </tr>
            </thead>
            <tbody>
              {analytics.designerStats.map((designer, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-black font-medium">{designer.name}</td>
                  <td className="text-right py-3 px-4 text-gray-700">{designer.total}</td>
                  <td className="text-right py-3 px-4 text-blue-600 font-medium">{designer.active}</td>
                  <td className="text-right py-3 px-4 text-green-600 font-medium">{designer.completed}</td>
                  <td className="text-right py-3 px-4">
                    <span className={`px-2 py-1 rounded text-sm font-medium ${
                      parseFloat(designer.completionRate) >= 80 ? 'bg-green-100 text-green-700' :
                      parseFloat(designer.completionRate) >= 60 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {designer.completionRate}%
                    </span>
                  </td>
                  <td className="text-right py-3 px-4">
                    <span className={`text-sm font-medium ${
                      parseFloat(designer.avgTurnaround) <= 7 ? 'text-green-600' :
                      parseFloat(designer.avgTurnaround) <= 14 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {designer.avgTurnaround} days
                    </span>
                  </td>
                </tr>
              ))}
              {analytics.designerStats.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-gray-500">
                    No designer activity in this time range
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}