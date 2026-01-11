import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Download, Search, Star, Loader2 } from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';
import { toast } from 'sonner';
import { getWordPressUser, isAuthenticated } from '../components/utils/wordpressAuth';

export default function SurveyResults() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate(createPageUrl('WordPressLogin'));
      return;
    }
    const userData = getWordPressUser();
    if (userData.role !== 'admin' && userData.role !== 'manager') {
      navigate(createPageUrl('ClientDashboard'));
      return;
    }
    setUser(userData);
  }, [navigate]);

  const { data: surveys, isLoading } = useQuery({
    queryKey: ['surveys'],
    queryFn: () => base44.entities.Survey.list('-submitted_date'),
    enabled: !!user,
    initialData: []
  });

  const filteredSurveys = surveys.filter(survey => {
    if (!searchTerm) return true;
    return (
      survey.job_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      survey.client_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleExport = () => {
    if (filteredSurveys.length === 0) {
      toast.error('No data to export');
      return;
    }

    const headers = [
      'Job Number',
      'Client Name',
      'Deliverables (1-10)',
      'Communication (1-10)',
      'Speed (1-10)',
      'Return Likelihood (1-10)',
      'Average Rating',
      'Comments',
      'Submitted Date'
    ];

    const rows = filteredSurveys.map(survey => {
      const avg = (
        (survey.deliverables_satisfaction +
        survey.communication_rating +
        survey.speed_satisfaction +
        survey.likelihood_to_return) / 4
      ).toFixed(1);

      return [
        survey.job_number,
        survey.client_name,
        survey.deliverables_satisfaction,
        survey.communication_rating,
        survey.speed_satisfaction,
        survey.likelihood_to_return,
        avg,
        `"${(survey.comments || '').replace(/"/g, '""')}"`,
        new Date(survey.submitted_date).toLocaleDateString()
      ];
    });

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `survey-results-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
    toast.success('Survey results exported');
  };

  const calculateAverage = (survey) => {
    return (
      (survey.deliverables_satisfaction +
      survey.communication_rating +
      survey.speed_satisfaction +
      survey.likelihood_to_return) / 4
    ).toFixed(1);
  };

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
          <h1 className="text-3xl font-bold text-[#0D1238] mb-2">Survey Results</h1>
          <p className="text-gray-700">Client feedback and satisfaction ratings</p>
        </div>
        <Button
          onClick={handleExport}
          className="bg-[#4791FF] hover:bg-[#3680ee] text-white"
        >
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Search */}
      <GlassCard className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            placeholder="Search by job number or client name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 glass border-[#4791FF]/30 text-black placeholder:text-gray-500"
          />
        </div>
      </GlassCard>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <GlassCard className="text-center">
          <div className="text-3xl font-bold text-black mb-1">{surveys.length}</div>
          <div className="text-gray-700 text-sm">Total Surveys</div>
        </GlassCard>
        <GlassCard className="text-center">
          <div className="text-3xl font-bold text-black mb-1">
            {surveys.length > 0
              ? (surveys.reduce((sum, s) => sum + s.deliverables_satisfaction, 0) / surveys.length).toFixed(1)
              : '0'}
          </div>
          <div className="text-gray-700 text-sm">Avg. Deliverables</div>
        </GlassCard>
        <GlassCard className="text-center">
          <div className="text-3xl font-bold text-black mb-1">
            {surveys.length > 0
              ? (surveys.reduce((sum, s) => sum + s.communication_rating, 0) / surveys.length).toFixed(1)
              : '0'}
          </div>
          <div className="text-gray-700 text-sm">Avg. Communication</div>
        </GlassCard>
        <GlassCard className="text-center">
          <div className="text-3xl font-bold text-black mb-1">
            {surveys.length > 0
              ? (surveys.reduce((sum, s) => sum + s.likelihood_to_return, 0) / surveys.length).toFixed(1)
              : '0'}
          </div>
          <div className="text-gray-700 text-sm">Avg. Return Likelihood</div>
        </GlassCard>
      </div>

      {/* Survey List */}
      <div className="space-y-4">
        {filteredSurveys.length === 0 ? (
          <GlassCard className="text-center py-12">
            <p className="text-gray-600">No survey results found</p>
          </GlassCard>
        ) : (
          filteredSurveys.map((survey) => (
            <GlassCard key={survey.id}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-black">{survey.job_number}</h3>
                  <p className="text-sm text-gray-600">{survey.client_name}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(survey.submitted_date + 'Z').toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-[#4791FF]">
                    <Star className="w-5 h-5 fill-current" />
                    <span className="text-2xl font-bold">{calculateAverage(survey)}</span>
                  </div>
                  <p className="text-xs text-gray-500">Average</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Deliverables</p>
                  <p className="text-xl font-semibold text-black">{survey.deliverables_satisfaction}/10</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Communication</p>
                  <p className="text-xl font-semibold text-black">{survey.communication_rating}/10</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Speed</p>
                  <p className="text-xl font-semibold text-black">{survey.speed_satisfaction}/10</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Return Likelihood</p>
                  <p className="text-xl font-semibold text-black">{survey.likelihood_to_return}/10</p>
                </div>
              </div>

              {survey.comments && (
                <div className="border-t border-gray-200 pt-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Comments:</p>
                  <p className="text-gray-600 italic">"{survey.comments}"</p>
                </div>
              )}
            </GlassCard>
          ))
        )}
      </div>
    </div>
  );
}