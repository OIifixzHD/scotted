import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Zap, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { User } from '@shared/types';
export function SignUpPage() {
  const navigate = useNavigate();
  const { login, user, isLoading: isAuthLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    bio: '',
    dateOfBirth: ''
  });
  // Redirect if already logged in
  useEffect(() => {
    if (!isAuthLoading && user) {
      navigate('/', { replace: true });
    }
  }, [user, isAuthLoading, navigate]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username || !formData.password || !formData.dateOfBirth) {
      toast.error('Please fill in all required fields');
      return;
    }
    // Client-side age check (UX only, server validates too)
    const dob = new Date(formData.dateOfBirth);
    const ageDiffMs = Date.now() - dob.getTime();
    const ageDate = new Date(ageDiffMs);
    const age = Math.abs(ageDate.getUTCFullYear() - 1970);
    if (age < 13) {
        toast.error("You must be at least 13 years old to join.");
        return;
    }
    setIsLoading(true);
    try {
      const user = await api<User>('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
            ...formData,
            dateOfBirth: dob.getTime()
        })
      });
      login(user);
      // Navigation happens automatically via useEffect
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : 'Failed to sign up';
      toast.error(message, {
        icon: <AlertCircle className="w-4 h-4 text-red-500" />,
      });
    } finally {
      setIsLoading(false);
    }
  };
  if (isAuthLoading) {
    return null;
  }
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-black relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-teal-900/20" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[128px]" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-600/20 rounded-full blur-[128px]" />
      <Card className="w-full max-w-md p-8 bg-black/40 backdrop-blur-xl border-white/10 relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-teal-400 flex items-center justify-center shadow-glow mb-4">
            <Zap className="w-6 h-6 text-white fill-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Join Scotted</h1>
          <p className="text-muted-foreground">Start your journey today</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              placeholder="NeonDrifter"
              className="bg-secondary/50 border-white/10"
              value={formData.username}
              onChange={e => setFormData(prev => ({ ...prev, username: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              className="bg-secondary/50 border-white/10"
              value={formData.password}
              onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dob">Date of Birth</Label>
            <Input
              id="dob"
              type="date"
              className="bg-secondary/50 border-white/10"
              value={formData.dateOfBirth}
              onChange={e => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">Bio (Optional)</Label>
            <Input
              id="bio"
              placeholder="Tell us about your vibe..."
              className="bg-secondary/50 border-white/10"
              value={formData.bio}
              onChange={e => setFormData(prev => ({ ...prev, bio: e.target.value }))}
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 shadow-glow"
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Account'}
          </Button>
        </form>
        <div className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link to="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </div>
      </Card>
    </div>
  );
}