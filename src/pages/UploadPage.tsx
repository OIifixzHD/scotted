import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { Upload, Film, Type, Sparkles, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
export function UploadPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [caption, setCaption] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // 5MB Limit for this demo due to DO storage constraints (SQLite backend handles more but let's be safe on network)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }
    setVideoFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };
  const clearFile = () => {
    setVideoFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoFile) {
      toast.error('Please select a video file');
      return;
    }
    if (!user) {
      toast.error('You must be logged in to post');
      navigate('/login');
      return;
    }
    try {
      setIsSubmitting(true);
      // Convert to Base64
      const base64Video = await convertToBase64(videoFile);
      await api('/api/posts', {
        method: 'POST',
        body: JSON.stringify({
          videoUrl: base64Video,
          caption,
          userId: user.id,
        }),
      });
      toast.success('Pulse posted successfully!');
      navigate(`/profile/${user.id}`);
    } catch (error) {
      toast.error('Failed to post pulse. File might be too large for the demo server.');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
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
                  <Label htmlFor="video-upload" className="flex items-center gap-2">
                    <Film className="w-4 h-4 text-primary" />
                    Select Video
                  </Label>
                  {!videoFile ? (
                    <div 
                      className="border-2 border-dashed border-white/10 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="w-10 h-10 text-muted-foreground mb-4" />
                      <p className="text-sm font-medium">Click to upload video</p>
                      <p className="text-xs text-muted-foreground mt-1">MP4, WebM up to 5MB</p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-xl border border-white/10">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <Film className="w-5 h-5 text-primary shrink-0" />
                        <span className="text-sm truncate">{videoFile.name}</span>
                      </div>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        onClick={clearFile}
                        className="hover:bg-red-500/20 hover:text-red-500"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    id="video-upload"
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
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
                    disabled={isSubmitting || !videoFile}
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
              {previewUrl ? (
                <video
                  src={previewUrl}
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