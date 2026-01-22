import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { Upload, Film, Type, Sparkles } from 'lucide-react';
export function UploadPage() {
  const navigate = useNavigate();
  const [videoUrl, setVideoUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoUrl.trim()) {
      toast.error('Please enter a video URL');
      return;
    }
    try {
      setIsSubmitting(true);
      await api('/api/posts', {
        method: 'POST',
        body: JSON.stringify({
          videoUrl,
          caption,
          userId: 'u1', // Hardcoded for demo
        }),
      });
      toast.success('Pulse posted successfully!');
      navigate('/profile/u1');
    } catch (error) {
      toast.error('Failed to post pulse');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };
  const fillDemoUrl = () => {
    setVideoUrl('https://assets.mixkit.co/videos/preview/mixkit-waves-in-the-water-1164-large.mp4');
  };
  return (
    <AppLayout container>
      <div className="max-w-4xl mx-auto py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold font-display mb-2">Upload Pulse</h1>
              <p className="text-muted-foreground">Share your vibe with the world.</p>
            </div>
            <Card className="p-6 bg-card/50 backdrop-blur-sm border-white/5">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="videoUrl" className="flex items-center gap-2">
                    <Film className="w-4 h-4 text-primary" />
                    Video URL
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="videoUrl"
                      placeholder="https://..."
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      className="bg-secondary/50 border-white/10"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    For this demo, please paste a direct MP4 link. 
                    <button 
                      type="button" 
                      onClick={fillDemoUrl} 
                      className="text-primary hover:underline ml-1"
                    >
                      Use Demo URL
                    </button>
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="caption" className="flex items-center gap-2">
                    <Type className="w-4 h-4 text-primary" />
                    Caption
                  </Label>
                  <Textarea
                    id="caption"
                    placeholder="What's on your mind? #pulse"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    className="bg-secondary/50 border-white/10 min-h-[120px]"
                  />
                </div>
                <div className="pt-4">
                  <Button 
                    type="submit" 
                    className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-purple-600 to-teal-500 hover:from-purple-700 hover:to-teal-600 shadow-glow transition-all duration-300"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 animate-spin" />
                        Pulsing...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Upload className="w-5 h-5" />
                        Pulse It
                      </span>
                    )}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
          {/* Preview Section */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative w-full max-w-[320px] aspect-[9/16] bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
              {videoUrl ? (
                <video
                  src={videoUrl}
                  className="w-full h-full object-cover"
                  controls
                  autoPlay
                  muted
                  loop
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground bg-secondary/20">
                  <Film className="w-12 h-12 mb-4 opacity-20" />
                  <p className="text-sm">Preview will appear here</p>
                </div>
              )}
              {/* Mock Overlay for Preview */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent pointer-events-none">
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-white/20 rounded animate-pulse" />
                  <div className="h-3 w-48 bg-white/20 rounded animate-pulse" />
                </div>
              </div>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">Mobile Preview</p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}