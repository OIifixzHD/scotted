import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { Upload, Film, Type, Sparkles, X, Hash, CloudUpload } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
export function UploadPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [caption, setCaption] = useState('');
  const [tags, setTags] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles?.length > 0) {
      const file = acceptedFiles[0];
      // 5MB Limit for this demo
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.webm', '.ogg']
    },
    maxFiles: 1,
    multiple: false
  });
  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent dropzone click
    setVideoFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl('');
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
      // Parse tags
      const tagList = tags.split(',').map(t => t.trim()).filter(Boolean);
      await api('/api/posts', {
        method: 'POST',
        body: JSON.stringify({
          videoUrl: base64Video,
          caption,
          tags: tagList,
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
    <div className="h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 lg:py-12">
        <div className="max-w-4xl mx-auto">
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
                    <Label className="flex items-center gap-2">
                      <Film className="w-4 h-4 text-primary" />
                      Select Video
                    </Label>
                    {!videoFile ? (
                      <div
                        {...getRootProps()}
                        className={cn(
                          "border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-200",
                          isDragActive 
                            ? "border-primary bg-primary/10 scale-[1.02]" 
                            : "border-white/10 hover:bg-white/5 hover:border-white/20"
                        )}
                      >
                        <input {...getInputProps()} />
                        <div className={cn(
                          "w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors",
                          isDragActive ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"
                        )}>
                          {isDragActive ? (
                            <CloudUpload className="w-8 h-8 animate-bounce" />
                          ) : (
                            <Upload className="w-8 h-8" />
                          )}
                        </div>
                        <p className="text-sm font-medium text-center">
                          {isDragActive ? "Drop video here" : "Drag & drop or click to upload"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          MP4, WebM up to 5MB
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-xl border border-white/10">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                            <Film className="w-5 h-5 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{videoFile.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                          </div>
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
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="caption" className="flex items-center gap-2">
                      <Type className="w-4 h-4 text-primary" />
                      Caption
                    </Label>
                    <Textarea
                      id="caption"
                      placeholder="What's on your mind?"
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      className="bg-secondary/50 border-white/10 min-h-[100px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tags" className="flex items-center gap-2">
                      <Hash className="w-4 h-4 text-primary" />
                      Tags
                    </Label>
                    <Input
                      id="tags"
                      placeholder="cyberpunk, neon, vibes (comma separated)"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      className="bg-secondary/50 border-white/10"
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
      </div>
    </div>
  );
}