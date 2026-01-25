import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { Upload, Film, Type, Sparkles, X, Hash, CloudUpload, AlertTriangle, Clock, Zap, Info, Music2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn, formatBytes } from '@/lib/utils';
const PLACEHOLDER_VIDEOS = [
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4'
];
// Threshold for switching to "Demo Mode" upload (avoiding browser crash on huge Base64)
// Lowered to 1MB to ensure reliability in demo environment with Worker limits
const DEMO_MODE_THRESHOLD = 1 * 1024 * 1024;
const MAX_DURATION_SECONDS = 300; // 5 minutes
export function UploadPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [caption, setCaption] = useState('');
  const [tags, setTags] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDemoUpload, setIsDemoUpload] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const soundId = searchParams.get('soundId');
  const soundName = searchParams.get('soundName');
  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);
  const validateVideo = (file: File): Promise<void> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = function() {
        window.URL.revokeObjectURL(video.src);
        const duration = video.duration;
        if (duration > MAX_DURATION_SECONDS) {
          reject(new Error(`Video exceeds 5 minutes limit (Current: ${Math.floor(duration / 60)}m ${Math.floor(duration % 60)}s)`));
        } else {
          resolve();
        }
      };
      video.onerror = function() {
        window.URL.revokeObjectURL(video.src);
        reject(new Error("Invalid video file or format not supported"));
      };
      video.src = URL.createObjectURL(file);
    });
  };
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles?.length > 0) {
      const file = acceptedFiles[0];
      setIsValidating(true);
      try {
        // 1. Validate Duration
        await validateVideo(file);
        // 2. Check for Demo Mode trigger
        if (file.size > DEMO_MODE_THRESHOLD) {
          setIsDemoUpload(true);
          toast.info('Large file detected. Switching to High-Speed Demo Mode.', {
            duration: 5000,
            icon: <Zap className="w-4 h-4 text-yellow-500" />
          });
        } else {
          setIsDemoUpload(false);
        }
        setVideoFile(file);
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to validate video");
        console.error("Validation error:", error);
      } finally {
        setIsValidating(false);
      }
    }
  }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.webm', '.ogg']
    },
    maxFiles: 1,
    multiple: false,
  });
  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent dropzone click
    setVideoFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl('');
    setIsDemoUpload(false);
    setUploadProgress(0);
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
      setUploadProgress(0);
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 10;
        });
      }, 200);
      let finalVideoUrl = '';
      if (isDemoUpload) {
        // Demo Mode: Use a random placeholder video
        finalVideoUrl = PLACEHOLDER_VIDEOS[Math.floor(Math.random() * PLACEHOLDER_VIDEOS.length)];
        // Simulate upload delay for realism based on file size (capped at 2s for speed)
        await new Promise(resolve => setTimeout(resolve, 1500));
      } else {
        // Real Upload: Convert to Base64
        // This can be slow, so we do it while progress bar is running
        finalVideoUrl = await convertToBase64(videoFile);
      }
      clearInterval(progressInterval);
      setUploadProgress(100);
      // Parse tags
      const tagList = tags.split(',').map(t => t.trim()).filter(Boolean);
      await api('/api/posts', {
        method: 'POST',
        body: JSON.stringify({
          videoUrl: finalVideoUrl,
          caption,
          tags: tagList,
          userId: user.id,
          soundName: soundName || undefined,
        }),
      });
      toast.success(isDemoUpload ? 'Pulse posted (High-Speed Mode)!' : 'Pulse posted successfully!');
      navigate(`/profile/${user.id}`);
    } catch (error) {
      console.error("Upload failed:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      // Check for common payload size errors if not in demo mode
      if (!isDemoUpload && videoFile.size > 1024 * 1024) {
         toast.error(`Upload failed: File might be too large. Try a smaller file or use Demo Mode. (${errorMessage})`);
      } else {
         toast.error(`Failed to post pulse: ${errorMessage}`);
      }
      setUploadProgress(0);
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
                  {soundName && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20 text-primary">
                      <Music2 className="w-4 h-4" />
                      <span className="text-sm font-medium">Using Sound: {soundName}</span>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Film className="w-4 h-4 text-primary" />
                      Select Video
                    </Label>
                    {!videoFile ? (
                      <div
                        {...getRootProps()}
                        className={cn(
                          "border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 relative overflow-hidden",
                          isDragActive
                            ? "border-primary bg-primary/10 scale-[1.02]"
                            : "border-white/10 hover:bg-white/5 hover:border-white/20",
                          isValidating && "opacity-50 pointer-events-none"
                        )}
                      >
                        <input {...getInputProps()} />
                        {isValidating ? (
                          <div className="flex flex-col items-center animate-pulse">
                            <Sparkles className="w-8 h-8 text-primary mb-4 animate-spin" />
                            <p className="text-sm font-medium">Validating video...</p>
                          </div>
                        ) : (
                          <>
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
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> Max 5 mins
                                </span>
                                <span>•</span>
                                <span>Any size</span>
                            </div>
                            <div className="mt-2 text-[10px] text-yellow-500/80 text-center max-w-[200px]">
                                Demo Environment: Files larger than 1MB will use high-quality sample videos to ensure smooth playback.
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-xl border border-white/10">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                              <Film className="w-5 h-5 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{videoFile.name}</p>
                              <p className="text-xs text-muted-foreground flex items-center gap-2">
                                {formatBytes(videoFile.size)}
                              </p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={clearFile}
                            className="hover:bg-red-500/20 hover:text-red-500"
                            disabled={isSubmitting}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        {isDemoUpload && (
                          <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-sm">
                            <Zap className="w-5 h-5 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-bold">High-Speed Demo Mode Active</p>
                              <p className="text-yellow-500/80 text-xs mt-1">
                                This file ({formatBytes(videoFile.size)}) exceeds the 1MB limit for direct storage in this demo.
                                A high-quality placeholder video will be used instead to ensure instant upload performance and reliable playback.
                              </p>
                            </div>
                          </div>
                        )}
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
                      disabled={isSubmitting}
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
                      disabled={isSubmitting}
                    />
                  </div>
                  {isSubmitting && (
                    <div className="space-y-2 animate-fade-in">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Uploading...</span>
                        <span>{Math.round(uploadProgress)}%</span>
                      </div>
                      <Progress value={uploadProgress} className="h-2" />
                    </div>
                  )}
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