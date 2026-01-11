import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Package, CheckCircle2 } from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';
import UserContactInfo from '../components/intake/UserContactInfo';
import { toast } from 'sonner';
import { getWordPressUser, isAuthenticated } from '../components/utils/wordpressAuth';

export default function DesignPackageOrder() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    productName: '',
    contactInfo: ''
  });

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
    setFormData(prev => ({
      ...prev,
      contactInfo: userData.email
    }));
    setLoading(false);
  };

  const handleUserInfoUpdate = (updatedInfo) => {
    const updatedUser = { ...user, ...updatedInfo };
    setUser(updatedUser);
    localStorage.setItem('user_data', JSON.stringify(updatedUser));
    setFormData(prev => ({ ...prev, contactInfo: updatedInfo.email }));
    toast.success('Contact information updated');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Create the Design Package job
      const jobNumber = `DP-${Date.now()}`;
      const clientName = user.first_name && user.last_name 
        ? `${user.first_name} ${user.last_name}` 
        : user.full_name || user.email;
      
      const packageJob = await base44.entities.Job.create({
        job_number: jobNumber,
        job_name: `Design Package - ${formData.productName}`,
        client_id: user.id,
        client_name: clientName,
        client_first_name: user.first_name || '',
        client_last_name: user.last_name || '',
        client_email: user.email || '',
        client_phone: user.phone || '',
        status: 'New Job',
        package_type: 'design_package',
        form_data: {
          productName: formData.productName,
          contactInfo: formData.contactInfo
        },
        last_activity_date: new Date().toISOString()
      });

      // Create checkout session
      const response = await base44.functions.invoke('createDesignPackageCheckout', {
        jobId: packageJob.id,
        userEmail: user.email
      });

      if (response.data.url) {
        window.location.href = response.data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Failed to create order. Please try again.');
      setSubmitting(false);
    }
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
    <div className="max-w-4xl mx-auto px-4 py-8">
      <UserContactInfo user={user} onUpdate={handleUserInfoUpdate} />

      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Package className="w-10 h-10 text-[#4791FF]" />
          <h1 className="text-4xl font-bold text-black">Design Package</h1>
        </div>
        <p className="text-xl text-gray-700 mb-6">Complete Product Design Solution</p>
        <div className="text-3xl font-bold text-[#4791FF] mb-8">$669</div>
      </div>

      <GlassCard variant="strong" className="mb-6">
        <h2 className="text-xl font-bold text-black mb-4">What's Included:</h2>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-semibold text-black">1 Free Virtual Prototype</div>
              <div className="text-sm text-gray-700">Professional 3D rendering of your product ($375 value)</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-semibold text-black">1 Free Sell Sheet</div>
              <div className="text-sm text-gray-700">Professional one-page product marketing sheet ($375 value)</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-semibold text-black">Guided Process</div>
              <div className="text-sm text-gray-700">Step-by-step guidance through creating your virtual prototype and sell sheet</div>
            </div>
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="productName" className="text-black">Product Name *</Label>
            <Input
              id="productName"
              value={formData.productName}
              onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
              className="glass border-[#4791FF]/30 text-black"
              placeholder="Enter your product name"
              required
            />
          </div>

          <div>
            <Label htmlFor="contactInfo" className="text-black">Contact Email *</Label>
            <Input
              id="contactInfo"
              type="email"
              value={formData.contactInfo}
              onChange={(e) => setFormData({ ...formData, contactInfo: e.target.value })}
              className="glass border-[#4791FF]/30 text-black"
              placeholder="your@email.com"
              required
            />
          </div>

          <div className="pt-4">
            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#4791FF] hover:bg-[#3680ee] text-white text-lg py-6"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Purchase Design Package - $669
                </>
              )}
            </Button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}