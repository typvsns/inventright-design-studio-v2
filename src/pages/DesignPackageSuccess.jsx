import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, Sparkles } from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';

export default function DesignPackageSuccess() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [packageJob, setPackageJob] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);

      // Get the most recent design package job for this user
      const jobs = await base44.entities.Job.filter({
        client_id: userData.id,
        package_type: 'design_package'
      }, '-created_date');

      if (jobs.length > 0) {
        setPackageJob(jobs[0]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartVirtualPrototype = () => {
    if (packageJob) {
      navigate(createPageUrl('JobIntake') + `?packageId=${packageJob.id}&type=vp`);
    }
  };

  const handleViewDashboard = () => {
    navigate(createPageUrl('ClientDashboard'));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <GlassCard className="p-8">
          <Loader2 className="w-8 h-8 animate-spin text-[#4791FF]" />
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <GlassCard variant="strong" className="text-center">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-black mb-2">Thank You for Your Purchase!</h1>
          <p className="text-lg text-gray-700">Your Design Package is ready</p>
        </div>

        <GlassCard className="my-8 text-left">
          <h2 className="text-xl font-bold text-black mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#4791FF]" />
            What's Next?
          </h2>
          <p className="text-gray-700 mb-4">
            Your Design Package includes 1 Free Virtual Prototype and 1 Free Sell Sheet. 
            Let's get started with your Virtual Prototype!
          </p>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-start gap-2">
              <div className="font-semibold min-w-[30px]">Step 1:</div>
              <div>Complete your Virtual Prototype request (you'll be guided through the form)</div>
            </div>
            <div className="flex items-start gap-2">
              <div className="font-semibold min-w-[30px]">Step 2:</div>
              <div>Our designers will create your virtual prototype</div>
            </div>
            <div className="flex items-start gap-2">
              <div className="font-semibold min-w-[30px]">Step 3:</div>
              <div>Once complete, you'll be prompted to start your Sell Sheet</div>
            </div>
          </div>
        </GlassCard>

        <div className="space-y-3">
          <Button
            onClick={handleStartVirtualPrototype}
            className="w-full bg-[#4791FF] hover:bg-[#3680ee] text-white text-lg py-6"
          >
            Start Virtual Prototype Now →
          </Button>
          <Button
            onClick={handleViewDashboard}
            variant="outline"
            className="w-full"
          >
            Go to Dashboard
          </Button>
        </div>

        <p className="text-sm text-gray-600 mt-6">
          You can also start your jobs anytime from your dashboard or the Design Package order page.
        </p>
      </GlassCard>
    </div>
  );
}