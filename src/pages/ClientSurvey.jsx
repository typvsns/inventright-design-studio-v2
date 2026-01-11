import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Star, CheckCircle, Loader2 } from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';
import { toast } from 'sonner';
import { getWordPressUser, isAuthenticated } from '../components/utils/wordpressAuth';

export default function ClientSurvey() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const jobId = searchParams.get('jobId');
  
  const [user, setUser] = useState(null);
  const [job, setJob] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  
  const [deliverablesRating, setDeliverablesRating] = useState(0);
  const [communicationRating, setCommunicationRating] = useState(0);
  const [speedRating, setSpeedRating] = useState(0);
  const [returnLikelihood, setReturnLikelihood] = useState(0);
  const [comments, setComments] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!isAuthenticated()) {
      navigate(createPageUrl('WordPressLogin'));
      return;
    }
    const userData = getWordPressUser();
    setUser(userData);
    
    if (jobId) {
      const jobs = await base44.entities.Job.filter({ id: jobId });
      if (jobs.length > 0) {
        setJob(jobs[0]);
      }
    }
  };

  const submitSurveyMutation = useMutation({
    mutationFn: async (surveyData) => {
      return await base44.entities.Survey.create(surveyData);
    },
    onSuccess: () => {
      setSubmitted(true);
      toast.success('Survey submitted successfully!');
    },
    onError: () => {
      toast.error('Failed to submit survey');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!deliverablesRating || !communicationRating || !speedRating || !returnLikelihood) {
      toast.error('Please rate all questions');
      return;
    }

    const clientName = user.first_name && user.last_name 
      ? `${user.first_name} ${user.last_name}` 
      : user.full_name || user.email;
    
    submitSurveyMutation.mutate({
      job_id: job?.id || '',
      job_number: job?.job_number || '',
      client_id: user.id,
      client_name: clientName,
      deliverables_satisfaction: deliverablesRating,
      communication_rating: communicationRating,
      speed_satisfaction: speedRating,
      likelihood_to_return: returnLikelihood,
      comments: comments,
      submitted_date: new Date().toISOString()
    });
  };

  const RatingSelector = ({ value, onChange, label }) => {
    return (
      <div className="space-y-3">
        <Label className="text-black font-semibold">{label}</Label>
        <div className="flex gap-2 flex-wrap">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => onChange(num)}
              className={`w-12 h-12 rounded-lg border-2 font-semibold transition-all ${
                value === num
                  ? 'bg-[#4791FF] border-[#4791FF] text-white scale-110'
                  : 'bg-white border-gray-300 text-gray-700 hover:border-[#4791FF] hover:text-[#4791FF]'
              }`}
            >
              {num}
            </button>
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>Not satisfied</span>
          <span>Very satisfied</span>
        </div>
      </div>
    );
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <GlassCard className="p-8">
          <Loader2 className="w-8 h-8 animate-spin text-[#4791FF]" />
        </GlassCard>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <GlassCard className="text-center py-12">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-black mb-2">Thank you for your feedback!</h2>
          <p className="text-gray-700 mb-6">Your survey has been submitted.</p>
          <Button
            onClick={() => navigate(createPageUrl('ClientDashboard'))}
            className="bg-[#4791FF] hover:bg-[#3680ee] text-white"
          >
            Return to Dashboard
          </Button>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="mb-6 text-gray-700 hover:text-black"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <GlassCard>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#0D1238] mb-2">Client Satisfaction Survey</h1>
          <p className="text-gray-700">Help us improve by sharing your experience</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Job Number */}
          <div className="space-y-2">
            <Label htmlFor="jobNumber" className="text-black">Job Number</Label>
            <Input
              id="jobNumber"
              value={job?.job_number || ''}
              readOnly
              className="glass border-[#4791FF]/30 text-black bg-gray-50"
            />
          </div>

          {/* Client Name */}
          <div className="space-y-2">
            <Label htmlFor="clientName" className="text-black">Client Name</Label>
            <Input
              id="clientName"
              value={user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.full_name || user.email}
              readOnly
              className="glass border-[#4791FF]/30 text-black bg-gray-50"
            />
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-black mb-6">Please rate your experience</h3>

            {/* Question 1 */}
            <div className="mb-8">
              <RatingSelector
                label="How satisfied were you with the final deliverables for your project?"
                value={deliverablesRating}
                onChange={setDeliverablesRating}
              />
            </div>

            {/* Question 2 */}
            <div className="mb-8">
              <RatingSelector
                label="How well did the designer communicate with you during the project?"
                value={communicationRating}
                onChange={setCommunicationRating}
              />
            </div>

            {/* Question 3 */}
            <div className="mb-8">
              <RatingSelector
                label="How satisfied were you with the speed of the process?"
                value={speedRating}
                onChange={setSpeedRating}
              />
            </div>

            {/* Question 4 */}
            <div className="mb-8">
              <RatingSelector
                label="How likely are you to use the Design Studio again?"
                value={returnLikelihood}
                onChange={setReturnLikelihood}
              />
            </div>
          </div>

          {/* Comments */}
          <div className="space-y-2">
            <Label htmlFor="comments" className="text-black">
              Add any comments you want to share or give us a testimonial
            </Label>
            <Textarea
              id="comments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Share your thoughts..."
              className="glass border-[#4791FF]/30 text-black placeholder:text-gray-500 min-h-32"
            />
          </div>

          {/* Submit */}
          <Button
            type="submit"
            className="w-full bg-[#4791FF] hover:bg-[#3680ee] text-white"
            disabled={submitSurveyMutation.isPending}
          >
            {submitSurveyMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Submit Survey
              </>
            )}
          </Button>
        </form>
      </GlassCard>
    </div>
  );
}