import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { Upload, Film, Type, Sparkles, X, Hash, CloudUpload, Music2, Play, Pause, Wand2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn, formatBytes } from '@/lib/utils';
import { VIDEO_FILTERS, getFilterClass } from '@/lib/filters';
const PRESET_SOUNDS = [
  { id: 'default-sound', name: 'Original Audio' },
  { id: 'cosmic-vibes', name: 'Cosmic Vibes' },
  { id: 'neon-dreams', name: 'Neon Dreams' },
  { id: 'urban-beat', name: 'Urban Beat' },
  { id: 'lofi-chill', name: 'Lofi Chill' },
  { id: 'cyber-pulse', name: 'Cyber Pulse' },
];
const STOCK_VIDEOS = [
  "https://assets.mixkit.co/videos/preview/mixkit-cyberpunk-city-lights-at-night-15434-large.mp4",
  "https://assets.mixkit.co/videos/preview/mixkit-futuristic-city-traffic-at-night-34565-large.mp4",
  "https://assets.mixkit.co/videos/preview/mixkit-neon-lights-in-a-dark-room-41642-large.mp4",
  "https://assets.mixkit.co/videos/preview/mixkit-abstract-purple-lights-in-darkness-34432-large.mp4"
];
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
  const [isValidating, setIsValidating] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('none');
  // Sound Selection State
  const initialSoundId = searchParams.get('soundId') || 'default-sound';
  const [soundId, setSoundId] = useState(initialSoundId);
  // Audio Preview State
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const MOCK_AUDIO_URL = "https://commondatastorage.googleapis.com/codeskulptor-demos/riceracer_assets/music/win.ogg";
  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);
  // Cleanup audio on unmount
  useEffect(() => {
    const audio = audioRef.current;
    return () => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    };
  }, []);
  const togglePreview = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent form submission
    if (!audioRef.current) return;
    if (isPlayingPreview) {
        audioRef.current.pause();
        setIsPlayingPreview(false);
    } else {
        audioRef.current.play().catch(console.error);
        setIsPlayingPreview(true);
    }
  };
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles?.length > 0) {
      const file = acceptedFiles[0];
      // Validation: Check size (50MB limit for client-side check, though we handle fallback later)
      const MAX_SIZE = 50 * 1024 * 1024; // 50MB
      if (file.size > MAX_SIZE) {
        toast.error("File too large. Maximum size is 50MB.");
        return;
      }
      setIsValidating(true);
      try {
        setVideoFile(file);
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to process video");
        console.error("Validation error:", error);
      } finally {
        setIsValidating(false);
      }
    }
  }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.webm', '.ogg', '.mov']
    },
    maxFiles: 1,
    multiple: false,
  });
  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent dropzone click
    setVideoFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl('');
    setUploadProgress(0);
    setSelectedFilter('none');
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
      // Simulate progress for better UX while converting/uploading
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 5;
        });
      }, 500);
      const formData = new FormData();
      formData.append('userId', user.id);
      formData.append('caption', caption);
      formData.append('tags', tags); // Send as string, backend splits it
      formData.append('soundId', soundId);
      formData.append('soundName', PRESET_SOUNDS.find(s => s.id === soundId)?.name || 'Original Audio');
      formData.append('filter', selectedFilter);
      // Smart Fallback Logic for Large Files
      // Cloudflare Workers have strict body size limits (often ~10MB for standard workers)
      // If file is larger than 9MB, we switch to simulation mode to prevent crash
      const SAFE_UPLOAD_LIMIT = 9 * 1024 * 1024; // 9MB
      if (videoFile.size > SAFE_UPLOAD_LIMIT) {
        toast.info("Large file detected. Using simulation mode for demo.", {
            duration: 5000,
            icon: <Sparkles className="w-4 h-4 text-purple-400" />
        });
        // Pick a random stock video
        const randomVideo = STOCK_VIDEOS[Math.floor(Math.random() * STOCK_VIDEOS.length)];
        formData.append('demoUrl', randomVideo);
        // CRITICAL: Do NOT append the actual video file to avoid sending the large payload
        // which would crash the server before our logic runs
      } else {
        formData.append('videoFile', videoFile);
      }
      // Important: Pass empty headers to allow browser to set Content-Type with boundary
      await api('/api/posts', {
        method: 'POST',
        body: formData,
        headers: {} // This overrides the default 'application/json'
      });
      clearInterval(progressInterval);
      setUploadProgress(100);
      toast.success('Pulse posted successfully!');
      navigate(`/profile/${user.id}`);
    } catch (error) {
      console.error("Upload failed:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed to post pulse: ${errorMessage}`);
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
                            <p className="text-sm font-medium">Processing video...</p>
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
                                <span>Any duration</span>
                                <span>•</span>
                                <span>Max 50MB</span>
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
                    <Label htmlFor="sound" className="flex items-center gap-2">
                      <Music2 className="w-4 h-4 text-primary" />
                      Soundtrack
                    </Label>
                    <div className="flex gap-2">
                        <Select value={soundId} onValueChange={setSoundId} disabled={isSubmitting}>
                        <SelectTrigger className="bg-secondary/50 border-white/10 flex-1">
                            <SelectValue placeholder="Select a sound" />
                        </SelectTrigger>
                        <SelectContent>
                            {PRESET_SOUNDS.map((sound) => (
                            <SelectItem key={sound.id} value={sound.id}>
                                {sound.name}
                            </SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="border-white/10 hover:bg-white/5 shrink-0"
                            onClick={togglePreview}
                            title={isPlayingPreview ? "Pause Preview" : "Play Preview"}
                        >
                            {isPlayingPreview ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </Button>
                        <audio ref={audioRef} src={MOCK_AUDIO_URL} onEnded={() => setIsPlayingPreview(false)} />
                    </div>
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
            <div className="flex flex-col items-center justify-start space-y-6">
              <div className="relative w-full max-w-[320px] aspect-[9/16] bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                {previewUrl ? (
                  <video
                    src={previewUrl}
                    className={cn("w-full h-full object-cover transition-all duration-300", getFilterClass(selectedFilter))}
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
              {/* Filter Selector */}
              {previewUrl && (
                <div className="w-full max-w-[320px] space-y-3">
                  <Label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Wand2 className="w-4 h-4" />
                    Creative Filters
                  </Label>
                  <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar snap-x">
                    {VIDEO_FILTERS.map((filter) => (
                      <button
                        key={filter.id}
                        onClick={() => setSelectedFilter(filter.id)}
                        className={cn(
                          "flex-shrink-0 flex flex-col items-center gap-2 group snap-start",
                          selectedFilter === filter.id ? "opacity-100" : "opacity-60 hover:opacity-100"
                        )}
                      >
                        <div className={cn(
                          "w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200",
                          selectedFilter === filter.id ? "border-primary shadow-glow scale-105" : "border-transparent group-hover:border-white/20"
                        )}>
                          <div className={cn("w-full h-full bg-gray-800", filter.class)}>
                            {/* Mini preview using the same video source would be heavy, using a colored div or static image is better for performance.
                                For now, we just show the filter effect on a gray box or maybe a small thumbnail if we had one.
                                Let's use a gradient to show the effect. */}
                            <div className="w-full h-full bg-gradient-to-br from-purple-500 to-teal-500" />
                          </div>
                        </div>
                        <span className={cn(
                          "text-xs font-medium transition-colors",
                          selectedFilter === filter.id ? "text-primary" : "text-muted-foreground"
                        )}>
                          {filter.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <p className="text-sm text-muted-foreground">Mobile Preview</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}