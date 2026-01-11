import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, LogIn } from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';
import { toast } from 'sonner';
import { isAuthenticated } from '../components/utils/wordpressAuth';

export default function WordPressLogin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });

  useEffect(() => {
    // Redirect to dashboard if already logged in
    if (isAuthenticated()) {
      window.location.href = createPageUrl('ClientDashboard');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await base44.functions.invoke('wordpressLogin', {
        userInput: credentials.username,
        password: credentials.password
      });

      const { token, user } = response.data;
      
      // Save token to session
      localStorage.setItem('wordpress_token', token);
      
      // Save user data to session
      localStorage.setItem('user_data', JSON.stringify(user));
      
      toast.success('Login successful! Redirecting...');
      
      // Redirect to dashboard
      setTimeout(() => {
        window.location.href = createPageUrl('ClientDashboard');
      }, 500);
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Invalid username or password');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <GlassCard className="w-full max-w-md">
        <div className="text-center mb-8">
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/691b56b689c37c23de922f3d/42c539754_irdssitelogo.png" 
            alt="inventRight Design Studio" 
            className="h-16 mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-black mb-2">Sign In</h1>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-blue-800 font-medium">
              Use Your inventtraining.com Login To Access Design Studio.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="username" className="text-black">Username or Email</Label>
            <Input
              id="username"
              type="text"
              value={credentials.username}
              onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
              className="glass border-[#4791FF]/30 text-black"
              required
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="password" className="text-black">Password</Label>
            <Input
              id="password"
              type="password"
              value={credentials.password}
              onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
              className="glass border-[#4791FF]/30 text-black"
              required
              disabled={loading}
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-[#4791FF] hover:bg-[#3680ee] text-white"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4 mr-2" />
                Sign In
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 space-y-3">
          <div className="text-center text-sm text-gray-600">
            <a 
              href="https://inventtraining.com/wp-login.php?action=lostpassword" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[#4791FF] hover:underline"
            >
              Forgot your password?
            </a>
          </div>
          
          <div className="pt-3 border-t border-gray-200">
            <a 
              href="https://design.inventright.com/" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <Button 
                type="button"
                variant="outline" 
                className="w-full"
              >
                Access The Old Design Studio Site
              </Button>
            </a>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}