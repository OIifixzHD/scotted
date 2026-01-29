import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { Upload, Film, Type, Sparkles, X, Hash, CloudUpload, Music2, Wand2, Palette, Plus, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn, formatBytes } from '@/lib/utils';
import { VIDEO_FILTERS, getFilterClass } from '@/lib/filters';
import { OverlayCanvas } from '@/components/upload/OverlayCanvas';
import type { TextOverlay } from '@shared/types';
import { v4 as uuidv4 } from 'uuid';
const STOCK_VIDEOS = [
  "https://assets.mixkit.co/videos/preview/mixkit-cyberpunk-city-lights-at-night-15434-large.mp4",
  "https://assets.mixkit.co/videos/preview/mixkit-futuristic-city-traffic-at-night-34565-large.mp4",
  "https://assets.mixkit.co/videos/preview/mixkit-neon-lights-in-a-dark-room-41642-large.mp4",
  "https://assets.mixkit.co/videos/preview/mixkit-abstract-purple-lights-in-darkness-34432-large.mp4"
];
const TEXT_COLORS = [
  '#ffffff', '#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7', '#ec4899', '#000000'
];
export function UploadPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [postType, setPostType] = useState<'video' | 'audio'>('video');
  // Sound State (from URL or default)
  const [soundId, setSoundId] = useState(searchParams.get('soundId') || 'default-sound');
  const [soundName, setSoundName] = useState(searchParams.get('soundName') || 'Original Audio');
  // Common State
  const [caption, setCaption] = useState('');
  const [tags, setTags] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  // Video Mode State
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isValidating, setIsValidating] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('none');
  const [overlays, setOverlays] = useState<TextOverlay[]>([]);
  const [activeOverlayId, setActiveOverlayId] = useState<string | null>(null);
  const [newText, setNewText] = useState('');
  const [newTextColor, setNewTextColor] = useState('#ffffff');
  const [activeTab, setActiveTab] = useState('filters');
  // Audio Mode State
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverArtFile, setCoverArtFile] = useState<File | null>(null);
  const [coverArtPreview, setCoverArtPreview] = useState<string>('');
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  // Sync with URL params if they change
  useEffect(() => {
    const sid = searchParams.get('soundId');
    const sname = searchParams.get('soundName');
    if (sid) {
        setSoundId(sid);
        setSoundName(sname || 'Original Audio');
        setPostType('video'); // Force video mode when using a sound
    }
  }, [searchParams]);
  // Cleanup preview URLs
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (coverArtPreview) URL.revokeObjectURL(coverArtPreview);
    };
  }, [previewUrl, coverArtPreview]);
  // Video Dropzone
  const onVideoDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles?.length > 0) {
      const file = acceptedFiles[0];
      setIsValidating(true);
      try {
        setVideoFile(file);
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to process video");
      } finally {
        setIsValidating(false);
      }
    }
  }, []);
  const { getRootProps: getVideoRootProps, getInputProps: getVideoInputProps, isDragActive: isVideoDragActive } = useDropzone({
    onDrop: onVideoDrop,
    accept: { 'video/*': ['.mp4', '.webm', '.ogg', '.mov'] },
    maxFiles: 1,
    multiple: false,
  });
  // Audio Dropzone
  const onAudioDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles?.length > 0) {
      setAudioFile(acceptedFiles[0]);
    }
  }, []);
  const { getRootProps: getAudioRootProps, getInputProps: getAudioInputProps, isDragActive: isAudioDragActive } = useDropzone({
    onDrop: onAudioDrop,
    accept: { 'audio/*': ['.mp3', '.wav', '.ogg', '.m4a'] },
    maxFiles: 1,
    multiple: false,
  });
  // Cover Art Dropzone
  const onCoverArtDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles?.length > 0) {
      const file = acceptedFiles[0];
      setCoverArtFile(file);
      const url = URL.createObjectURL(file);
      setCoverArtPreview(url);
    }
  }, []);
  const { getRootProps: getCoverRootProps, getInputProps: getCoverInputProps, isDragActive: isCoverDragActive } = useDropzone({
    onDrop: onCoverArtDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    maxFiles: 1,
    multiple: false,
  });
  const clearVideo = (e: React.MouseEvent) => {
    e.stopPropagation();
    setVideoFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl('');
    setUploadProgress(0);
    setSelectedFilter('none');
    setOverlays([]);
  };
  const clearAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAudioFile(null);
  };
  const clearCoverArt = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCoverArtFile(null);
    if (coverArtPreview) URL.revokeObjectURL(coverArtPreview);
    setCoverArtPreview('');
  };
  const handleAddText = () => {
    if (!newText.trim()) return;
    const newOverlay: TextOverlay = {
      id: uuidv4(),
      text: newText,
      x: 50,
      y: 50,
      color: newTextColor,
      style: 'bold'
    };
    setOverlays([...overlays, newOverlay]);
    setNewText('');
    setActiveOverlayId(newOverlay.id);
  };
  const handleClearSound = () => {
    setSoundId('default-sound');
    setSoundName('Original Audio');
    navigate('/upload', { replace: true }); // Clear URL params
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('You must be logged in to post');
      navigate('/login');
      return;
    }
    if (postType === 'video' && !videoFile) {
      toast.error('Please select a video file');
      return;
    }
    if (postType === 'audio' && !audioFile) {
      toast.error('Please select an audio file');
      return;
    }
    try {
      setIsSubmitting(true);
      setUploadProgress(0);
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 5;
        });
      }, 500);
      const formData = new FormData();
      formData.append('userId', user.id);
      formData.append('type', postType);
      formData.append('caption', caption);
      formData.append('tags', tags);
      if (postType === 'video') {
        formData.append('filter', selectedFilter);
        formData.append('overlays', JSON.stringify(overlays));
        formData.append('soundId', soundId);
        formData.append('soundName', soundName);
        // Large file fallback logic
        const SAFE_UPLOAD_LIMIT = 100 * 1024 * 1024; // 100MB
        if (videoFile!.size > SAFE_UPLOAD_LIMIT) {
            toast.info("Large file detected. Using simulation mode.", { icon: <Sparkles className="w-4 h-4 text-purple-400" /> });
            const randomVideo = STOCK_VIDEOS[Math.floor(Math.random() * STOCK_VIDEOS.length)];
            formData.append('demoUrl', randomVideo);
        } else {
            formData.append('videoFile', videoFile!);
        }
      } else {
        // Audio Mode
        formData.append('audioFile', audioFile!);
        if (coverArtFile) {
            formData.append('coverArtFile', coverArtFile);
        }
        formData.append('title', title || 'Untitled Track');
        formData.append('artist', artist || user.displayName || user.name);
      }
      await api('/api/posts', {
        method: 'POST',
        body: formData,
        headers: {}
      });
      clearInterval(progressInterval);
      setUploadProgress(100);
      toast.success('Posted to Scotted successfully!');
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
          <div className="mb-8">
            <h1 className="text-3xl font-bold font-display mb-2">Upload to Scotted</h1>
            <p className="text-muted-foreground">Share your vibe with the world.</p>
          </div>
          <Tabs value={postType} onValueChange={(v: any) => setPostType(v)} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 bg-secondary/50 border border-white/10">
              <TabsTrigger value="video" className="flex items-center gap-2">
                <Film className="w-4 h-4" /> Video
              </TabsTrigger>
              <TabsTrigger value="audio" className="flex items-center gap-2">
                <Music2 className="w-4 h-4" /> Music
              </TabsTrigger>
            </TabsList>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Form Section */}
              <div className="space-y-6 order-2 lg:order-1">
                <Card className="p-6 bg-card/50 backdrop-blur-sm border-white/5">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <TabsContent value="video" className="mt-0 space-y-6">
                      {/* Sound Badge */}
                      {soundId !== 'default-sound' && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20 text-primary animate-fade-in">
                            <Music2 className="w-4 h-4" />
                            <span className="text-sm font-medium">Using Sound: {soundName}</span>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 ml-auto hover:bg-primary/20"
                                onClick={handleClearSound}
                            >
                                <X className="w-3 h-3" />
                            </Button>
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Film className="w-4 h-4 text-primary" />
                          Select Video
                        </Label>
                        {!videoFile ? (
                          <div
                            {...getVideoRootProps()}
                            className={cn(
                              "border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 relative overflow-hidden",
                              isVideoDragActive
                                ? "border-primary bg-primary/10 scale-[1.02]"
                                : "border-white/10 hover:bg-white/5 hover:border-white/20",
                              isValidating && "opacity-50 pointer-events-none"
                            )}
                          >
                            <input {...getVideoInputProps()} />
                            {isValidating ? (
                              <div className="flex flex-col items-center animate-pulse">
                                <Sparkles className="w-8 h-8 text-primary mb-4 animate-spin" />
                                <p className="text-sm font-medium">Processing video...</p>
                              </div>
                            ) : (
                              <>
                                <div className={cn(
                                  "w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors",
                                  isVideoDragActive ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"
                                )}>
                                  <Upload className="w-8 h-8" />
                                </div>
                                <p className="text-sm font-medium text-center">
                                  {isVideoDragActive ? "Drop video here" : "Drag & drop or click to upload"}
                                </p>
                                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                    <span>Any duration</span>
                                    <span>���</span>
                                    <span>Max 100MB</span>
                                </div>
                              </>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-xl border border-white/10">
                            <div className="flex items-center gap-3 overflow-hidden">
                              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                                <Film className="w-5 h-5 text-primary" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">{videoFile.name}</p>
                                <p className="text-xs text-muted-foreground">{formatBytes(videoFile.size)}</p>
                              </div>
                            </div>
                            <Button type="button" variant="ghost" size="icon" onClick={clearVideo} disabled={isSubmitting} className="hover:text-red-500">
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                    <TabsContent value="audio" className="mt-0 space-y-6">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Music2 className="w-4 h-4 text-primary" />
                          Audio File
                        </Label>
                        {!audioFile ? (
                          <div
                            {...getAudioRootProps()}
                            className={cn(
                              "border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all duration-200",
                              isAudioDragActive ? "border-primary bg-primary/10" : "border-white/10 hover:bg-white/5"
                            )}
                          >
                            <input {...getAudioInputProps()} />
                            <CloudUpload className="w-8 h-8 text-muted-foreground mb-2" />
                            <p className="text-sm font-medium">Upload MP3, WAV, OGG</p>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-xl border border-white/10">
                            <div className="flex items-center gap-3 overflow-hidden">
                              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0">
                                <Music2 className="w-5 h-5 text-purple-400" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">{audioFile.name}</p>
                                <p className="text-xs text-muted-foreground">{formatBytes(audioFile.size)}</p>
                              </div>
                            </div>
                            <Button type="button" variant="ghost" size="icon" onClick={clearAudio} disabled={isSubmitting} className="hover:text-red-500">
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <ImageIcon className="w-4 h-4 text-primary" />
                          Cover Art
                        </Label>
                        {!coverArtFile ? (
                          <div
                            {...getCoverRootProps()}
                            className={cn(
                              "border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all duration-200",
                              isCoverDragActive ? "border-primary bg-primary/10" : "border-white/10 hover:bg-white/5"
                            )}
                          >
                            <input {...getCoverInputProps()} />
                            <ImageIcon className="w-8 h-8 text-muted-foreground mb-2" />
                            <p className="text-sm font-medium">Upload Image</p>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-xl border border-white/10">
                            <div className="flex items-center gap-3 overflow-hidden">
                              <img src={coverArtPreview} alt="Cover" className="w-10 h-10 rounded object-cover" />
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">{coverArtFile.name}</p>
                                <p className="text-xs text-muted-foreground">{formatBytes(coverArtFile.size)}</p>
                              </div>
                            </div>
                            <Button type="button" variant="ghost" size="icon" onClick={clearCoverArt} disabled={isSubmitting} className="hover:text-red-500">
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Title</Label>
                          <Input placeholder="Song Title" value={title} onChange={(e) => setTitle(e.target.value)} className="bg-secondary/50 border-white/10" />
                        </div>
                        <div className="space-y-2">
                          <Label>Artist</Label>
                          <Input placeholder="Artist Name" value={artist} onChange={(e) => setArtist(e.target.value)} className="bg-secondary/50 border-white/10" />
                        </div>
                      </div>
                    </TabsContent>
                    {/* Common Fields */}
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
                        disabled={isSubmitting || (postType === 'video' ? !videoFile : !audioFile)}
                      >
                        {isSubmitting ? (
                          <span className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 animate-spin" />
                            Pulsing...
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <Upload className="w-5 h-5" />
                            Post It
                          </span>
                        )}
                      </Button>
                    </div>
                  </form>
                </Card>
              </div>
              {/* Preview Section */}
              <div className="flex flex-col items-center justify-start space-y-6 order-1 lg:order-2">
                {postType === 'video' ? (
                  <>
                    <div className="relative w-full max-w-[320px] aspect-[9/16] bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                      {previewUrl ? (
                        <>
                          <video
                            src={previewUrl}
                            className={cn("w-full h-full object-cover transition-all duration-300", getFilterClass(selectedFilter))}
                            controls
                            autoPlay
                            muted
                            loop
                          />
                          <OverlayCanvas
                            overlays={overlays}
                            onChange={setOverlays}
                            activeId={activeOverlayId}
                            onSelect={setActiveOverlayId}
                          />
                        </>
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground bg-secondary/20">
                          <Film className="w-12 h-12 mb-4 opacity-20" />
                          <p className="text-sm">Video preview</p>
                        </div>
                      )}
                    </div>
                    {previewUrl && (
                      <div className="w-full max-w-[320px] space-y-4">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                          <TabsList className="w-full bg-secondary/50 border border-white/10">
                            <TabsTrigger value="filters" className="flex-1">
                              <Wand2 className="w-4 h-4 mr-2" /> Filters
                            </TabsTrigger>
                            <TabsTrigger value="text" className="flex-1">
                              <Type className="w-4 h-4 mr-2" /> Text
                            </TabsTrigger>
                          </TabsList>
                          <TabsContent value="filters" className="mt-4">
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
                          </TabsContent>
                          <TabsContent value="text" className="mt-4 space-y-4">
                            <div className="flex gap-2">
                              <Input
                                placeholder="Add text..."
                                value={newText}
                                onChange={(e) => setNewText(e.target.value)}
                                className="bg-secondary/50 border-white/10"
                                onKeyDown={(e) => e.key === 'Enter' && handleAddText()}
                              />
                              <Button size="icon" onClick={handleAddText} className="bg-primary hover:bg-primary/90 shrink-0">
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs text-muted-foreground flex items-center gap-2">
                                <Palette className="w-3 h-3" /> Color
                              </Label>
                              <div className="flex gap-2 flex-wrap">
                                {TEXT_COLORS.map(color => (
                                  <button
                                    key={color}
                                    onClick={() => setNewTextColor(color)}
                                    className={cn(
                                      "w-6 h-6 rounded-full border-2 transition-all",
                                      newTextColor === color ? "border-white scale-110 shadow-glow" : "border-transparent hover:scale-105"
                                    )}
                                    style={{ backgroundColor: color }}
                                  />
                                ))}
                              </div>
                            </div>
                            {overlays.length > 0 && (
                              <div className="space-y-2 pt-2 border-t border-white/10">
                                <Label className="text-xs text-muted-foreground">Layers</Label>
                                <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                                  {overlays.map(overlay => (
                                    <div
                                      key={overlay.id}
                                      className={cn(
                                        "flex items-center justify-between p-2 rounded bg-secondary/30 border border-white/5 cursor-pointer hover:bg-secondary/50",
                                        activeOverlayId === overlay.id && "border-primary/50 bg-primary/10"
                                      )}
                                      onClick={() => setActiveOverlayId(overlay.id)}
                                    >
                                      <div className="flex items-center gap-2 truncate">
                                        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: overlay.color }} />
                                        <span className="text-sm truncate max-w-[150px]">{overlay.text}</span>
                                      </div>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setOverlays(prev => prev.filter(o => o.id !== overlay.id));
                                        }}
                                        className="text-muted-foreground hover:text-red-500"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </TabsContent>
                        </Tabs>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="relative w-full max-w-[320px] aspect-square bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl flex flex-col items-center justify-center p-6 text-center">
                    {coverArtPreview ? (
                      <img src={coverArtPreview} alt="Cover Art" className="w-full h-full object-cover absolute inset-0 opacity-50 blur-xl" />
                    ) : null}
                    <div className="relative z-10 w-40 h-40 bg-card rounded-xl shadow-2xl overflow-hidden mb-4 flex items-center justify-center border border-white/10">
                      {coverArtPreview ? (
                        <img src={coverArtPreview} alt="Cover Art" className="w-full h-full object-cover" />
                      ) : (
                        <Music2 className="w-16 h-16 text-muted-foreground/50" />
                      )}
                    </div>
                    <div className="relative z-10 space-y-1">
                      <h3 className="font-bold text-white text-lg">{title || 'Song Title'}</h3>
                      <p className="text-sm text-muted-foreground">{artist || 'Artist Name'}</p>
                    </div>
                  </div>
                )}
                <p className="text-sm text-muted-foreground">
                  {postType === 'video' ? 'Video Preview' : 'Music Preview'}
                </p>
              </div>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}