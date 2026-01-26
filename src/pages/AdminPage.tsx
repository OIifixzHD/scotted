import React, { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api-client';
import type { User, Report, AdminStats, Post } from '@shared/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Shield, RefreshCw, MoreHorizontal, CheckCircle2, Ban, Trash2, MessageSquare, Edit, FileText, User as UserIcon, BarChart3, Users, Film, Eye, Activity, ShieldCheck, Settings, Video, AlertTriangle, Megaphone } from "lucide-react";
import { toast } from "sonner";
import { UserManagementDialog } from '@/components/admin/UserManagementDialog';
import { AdminPostTable } from '@/components/admin/AdminPostTable';
import { VideoModal } from '@/components/feed/VideoModal';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { format } from 'date-fns';
interface SystemSettings {
  maintenanceMode: boolean;
  disableSignups: boolean;
  readOnlyMode: boolean;
  announcement: string;
  announcementLevel: 'info' | 'warning' | 'destructive';
}
export function AdminPage() {
  const navigate = useNavigate();
  const { user: currentUser, isLoading: isAuthLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState<User[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartsReady, setChartsReady] = useState(false);
  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [dialogMode, setDialogMode] = useState<'edit' | 'ban' | 'unban'>('edit');
  // Video Modal State
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  // System Settings
  const [platformSettings, setPlatformSettings] = useState<SystemSettings>({
    maintenanceMode: false,
    disableSignups: false,
    readOnlyMode: false,
    announcement: '',
    announcementLevel: 'info'
  });
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);
  // Security Check
  useEffect(() => {
    if (!isAuthLoading) {
      if (!currentUser || (!currentUser.isAdmin && currentUser.name !== 'AdminUser001')) {
        toast.error('Access Denied: Unauthorized.');
        navigate('/', { replace: true });
      }
    }
  }, [currentUser, isAuthLoading, navigate]);
  // Chart rendering delay effect
  useEffect(() => {
    if (activeTab === 'analytics') {
      // Reset first to ensure clean mount
      setChartsReady(false);
      const timer = setTimeout(() => {
        setChartsReady(true);
      }, 300); // 300ms delay to allow tab animation/layout to settle
      return () => clearTimeout(timer);
    } else {
      setChartsReady(false);
    }
  }, [activeTab]);
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [usersRes, reportsRes, statsRes, postsRes, systemRes] = await Promise.all([
        api<{ items: User[] }>('/api/users?limit=100'),
        api<Report[]>('/api/admin/reports'),
        api<AdminStats>('/api/admin/stats'),
        api<{ items: Post[] }>('/api/admin/posts'),
        api<SystemSettings>('/api/system')
      ]);
      setUsers(usersRes.items);
      setReports(reportsRes);
      setStats(statsRes);
      setPosts(postsRes.items);
      setPlatformSettings(systemRes);
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(`Failed to fetch admin data: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    if (currentUser?.isAdmin || currentUser?.name === 'AdminUser001') {
      fetchData();
    }
  }, [currentUser, fetchData]);
  const handleOpenDialog = (user: User, mode: 'edit' | 'ban' | 'unban') => {
    setSelectedUser(user);
    setDialogMode(mode);
    setDialogOpen(true);
  };
  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    try {
      await api(`/api/admin/users/${userId}`, { method: 'DELETE' });
      toast.success('User deleted');
      fetchData();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(`Failed to delete user: ${errorMessage}`);
    }
  };
  const handleMessageUser = async (targetUser: User) => {
    if (!currentUser) return;
    try {
      await api<{ id: string }>('/api/chats', {
        method: 'POST',
        body: JSON.stringify({ title: `Admin Chat: ${targetUser.name}` })
      });
      navigate('/inbox');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(`Failed to start chat: ${errorMessage}`);
    }
  };
  const handleResolveReport = async (reportId: string, status: 'resolved' | 'dismissed') => {
    try {
      await api(`/api/admin/reports/${reportId}/resolve`, {
        method: 'POST',
        body: JSON.stringify({ status })
      });
      toast.success(`Report ${status}`);
      fetchData();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(`Failed to update report: ${errorMessage}`);
    }
  };
  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
        await api(`/api/posts/${postId}`, {
            method: 'DELETE',
            body: JSON.stringify({ userId: currentUser?.id })
        });
        toast.success('Post deleted');
        fetchData();
    } catch (error) {
        console.error(error);
        toast.error('Failed to delete post');
    }
  };
  const handleViewPost = (post: Post) => {
    setSelectedPost(post);
  };
  const handleSettingChange = async (key: keyof SystemSettings, value: any) => {
    const newSettings = { ...platformSettings, [key]: value };
    setPlatformSettings(newSettings);
    // For toggles, update immediately
    if (typeof value === 'boolean') {
        try {
            await api('/api/admin/system', {
                method: 'PUT',
                body: JSON.stringify({ [key]: value })
            });
            toast.success(`Setting updated: ${key}`);
        } catch (error) {
            console.error(error);
            toast.error('Failed to update setting');
            // Revert
            setPlatformSettings(prev => ({ ...prev, [key]: !value }));
        }
    }
  };
  const handleUpdateAnnouncement = async () => {
    setIsUpdatingSettings(true);
    try {
        await api('/api/admin/system', {
            method: 'PUT',
            body: JSON.stringify({
                announcement: platformSettings.announcement,
                announcementLevel: platformSettings.announcementLevel
            })
        });
        toast.success('Announcement updated');
    } catch (error) {
        console.error(error);
        toast.error('Failed to update announcement');
    } finally {
        setIsUpdatingSettings(false);
    }
  };
  // Calculate Top Performing Content
  const topContent = [...posts].sort((a, b) => {
    const scoreA = (a.likes * 2) + (a.comments * 3) + ((a.views || 0) * 0.5);
    const scoreB = (b.likes * 2) + (b.comments * 3) + ((b.views || 0) * 0.5);
    return scoreB - scoreA;
  }).slice(0, 5);
  if (isAuthLoading || (!currentUser?.isAdmin && currentUser?.name !== 'AdminUser001')) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 lg:py-12 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-display flex items-center gap-2">
              <Shield className="w-8 h-8 text-primary" />
              Admin Governance
            </h1>
            <p className="text-muted-foreground">Manage users, security, and reports.</p>
          </div>
          <Button onClick={fetchData} variant="outline" size="icon">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-secondary/50 border border-white/10">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          {/* Users Tab */}
          <TabsContent value="users" className="mt-6">
            <div className="rounded-xl border border-white/10 bg-card/50 backdrop-blur-sm overflow-hidden">
              {loading ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10 hover:bg-white/5">
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Followers</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => {
                      const isBanned = user.bannedUntil && user.bannedUntil > Date.now();
                      return (
                        <TableRow key={user.id} className="border-white/10 hover:bg-white/5">
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                              <Avatar className="w-8 h-8 border border-white/10">
                                <AvatarImage src={user.avatar} />
                                <AvatarFallback>{user.name.substring(0, 2)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-bold flex items-center gap-1">
                                    {user.name}
                                    {user.isVerified && <CheckCircle2 className="w-3 h-3 text-blue-400" />}
                                </div>
                                <div className="text-xs text-muted-foreground">@{user.name.toLowerCase().replace(/\s/g, '')}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.isAdmin ? "default" : "secondary"} className={user.isAdmin ? "bg-purple-500/20 text-purple-300 hover:bg-purple-500/30" : ""}>
                                {user.isAdmin ? "Admin" : "User"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {isBanned ? (
                              <Badge variant="destructive" className="bg-red-500/20 text-red-400 hover:bg-red-500/30">Banned</Badge>
                            ) : (
                              <Badge variant="outline" className="border-green-500/50 text-green-400">Active</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {format(user.createdAt || Date.now(), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell>{user.followers || 0}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-card border-white/10">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleOpenDialog(user, 'edit')}>
                                  <Edit className="mr-2 h-4 w-4" /> Edit Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleMessageUser(user)}>
                                  <MessageSquare className="mr-2 h-4 w-4" /> Message
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-white/10" />
                                {isBanned ? (
                                  <DropdownMenuItem onClick={() => handleOpenDialog(user, 'unban')} className="text-green-400 focus:text-green-400">
                                    <ShieldCheck className="mr-2 h-4 w-4" /> Unban User
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem onClick={() => handleOpenDialog(user, 'ban')} className="text-red-400 focus:text-red-400">
                                    <Ban className="mr-2 h-4 w-4" /> Ban User
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => handleDeleteUser(user.id)} className="text-red-400 focus:text-red-400">
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete Account
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabsContent>
          {/* Content Tab */}
          <TabsContent value="content" className="mt-6">
            {loading ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : (
                <AdminPostTable
                    posts={posts}
                    onView={handleViewPost}
                    onDelete={handleDeletePost}
                />
            )}
          </TabsContent>
          {/* Reports Tab */}
          <TabsContent value="reports" className="mt-6">
             <div className="rounded-xl border border-white/10 bg-card/50 backdrop-blur-sm overflow-hidden">
              {loading ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10 hover:bg-white/5">
                      <TableHead>Type</TableHead>
                      <TableHead>Reporter</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">No reports found.</TableCell>
                      </TableRow>
                    ) : (
                      reports.map((report) => (
                        <TableRow key={report.id} className="border-white/10 hover:bg-white/5">
                          <TableCell>
                            <div className="flex items-center gap-2">
                                {report.targetType === 'user' ? <UserIcon className="w-4 h-4 text-blue-400" /> : <FileText className="w-4 h-4 text-purple-400" />}
                                <span className="capitalize text-sm">{report.targetType}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{report.reporter?.name || 'Unknown'}</TableCell>
                          <TableCell className="text-red-400">
                            {report.targetType === 'user' ? (
                                <span>@{report.target?.name || 'Unknown'}</span>
                            ) : (
                                <span className="italic text-xs">{report.post?.caption?.substring(0, 20) || 'Post Content'}...</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium capitalize">{report.reason}</span>
                              <span className="text-xs text-muted-foreground truncate max-w-[200px]">{report.description}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={report.status === 'pending' ? 'default' : 'secondary'} className="capitalize">
                              {report.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {report.status === 'pending' && (
                              <div className="flex justify-end gap-2">
                                <Button size="sm" variant="ghost" className="h-8 text-green-400 hover:text-green-300 hover:bg-green-500/10" onClick={() => handleResolveReport(report.id, 'resolved')}>
                                  Resolve
                                </Button>
                                <Button size="sm" variant="ghost" className="h-8 text-muted-foreground hover:text-white" onClick={() => handleResolveReport(report.id, 'dismissed')}>
                                  Dismiss
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabsContent>
          {/* Analytics Tab */}
          <TabsContent value="analytics" className="mt-6 space-y-6">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-card/50 backdrop-blur-sm border-white/10">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalUsers.toLocaleString() ?? '-'}</div>
                  <p className="text-xs text-muted-foreground">
                    Registered accounts
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-card/50 backdrop-blur-sm border-white/10">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
                  <Film className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalPosts.toLocaleString() ?? '-'}</div>
                  <p className="text-xs text-muted-foreground">
                    Uploaded videos
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-card/50 backdrop-blur-sm border-white/10">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalViews.toLocaleString() ?? '-'}</div>
                  <p className="text-xs text-muted-foreground">
                    Across all content
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-card/50 backdrop-blur-sm border-white/10">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Engagement</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalEngagement.toLocaleString() ?? '-'}</div>
                  <p className="text-xs text-muted-foreground">
                    Likes & Comments
                  </p>
                </CardContent>
              </Card>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* User Growth Chart */}
              <div className="rounded-xl border border-white/10 bg-card/50 backdrop-blur-sm p-6 min-h-[350px] flex flex-col">
                <div className="flex items-center gap-2 mb-6">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-bold">New Users (Last 7 Days)</h3>
                </div>
                <div className="flex-1 w-full min-h-[250px]">
                  {chartsReady && stats?.userGrowth ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.userGrowth}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                        <XAxis dataKey="name" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                          itemStyle={{ color: '#fff' }}
                        />
                        <Bar dataKey="users" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                  )}
                </div>
              </div>
              {/* Activity Chart */}
              <div className="rounded-xl border border-white/10 bg-card/50 backdrop-blur-sm p-6 min-h-[350px] flex flex-col">
                <div className="flex items-center gap-2 mb-6">
                  <BarChart3 className="w-5 h-5 text-teal-400" />
                  <h3 className="text-lg font-bold">Platform Activity</h3>
                </div>
                <div className="flex-1 w-full min-h-[250px]">
                  {chartsReady && stats?.activity ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={stats.activity}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                        <XAxis dataKey="name" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                          itemStyle={{ color: '#fff' }}
                        />
                        <Line type="monotone" dataKey="likes" stroke="#7c3aed" strokeWidth={2} dot={{ fill: '#7c3aed' }} />
                        <Line type="monotone" dataKey="comments" stroke="#2dd4bf" strokeWidth={2} dot={{ fill: '#2dd4bf' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* Top Performing Content */}
            <div className="space-y-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                    <Video className="w-5 h-5 text-primary" />
                    Top Performing Content
                </h3>
                <AdminPostTable
                    posts={topContent}
                    onView={handleViewPost}
                    onDelete={handleDeletePost}
                />
            </div>
          </TabsContent>
          {/* Settings Tab */}
          <TabsContent value="settings" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-card/50 backdrop-blur-sm border-white/10">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Settings className="w-5 h-5 text-primary" />
                            Platform Controls
                        </CardTitle>
                        <CardDescription>Global settings for the application.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-base">Maintenance Mode</Label>
                                <p className="text-sm text-muted-foreground">Disable access for non-admin users.</p>
                            </div>
                            <Switch
                                checked={platformSettings.maintenanceMode}
                                onCheckedChange={(val) => handleSettingChange('maintenanceMode', val)}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-base">Disable Signups</Label>
                                <p className="text-sm text-muted-foreground">Prevent new user registrations.</p>
                            </div>
                            <Switch
                                checked={platformSettings.disableSignups}
                                onCheckedChange={(val) => handleSettingChange('disableSignups', val)}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-base">Read-Only Mode</Label>
                                <p className="text-sm text-muted-foreground">Disable all write operations (posts, likes, comments).</p>
                            </div>
                            <Switch
                                checked={platformSettings.readOnlyMode}
                                onCheckedChange={(val) => handleSettingChange('readOnlyMode', val)}
                            />
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-card/50 backdrop-blur-sm border-white/10">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Megaphone className="w-5 h-5 text-yellow-400" />
                            Global Announcement
                        </CardTitle>
                        <CardDescription>Broadcast a message to all users.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Message</Label>
                            <Input
                                placeholder="e.g. Scheduled maintenance at 2 AM"
                                value={platformSettings.announcement}
                                onChange={(e) => handleSettingChange('announcement', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Level</Label>
                            <Select
                                value={platformSettings.announcementLevel}
                                onValueChange={(val) => handleSettingChange('announcementLevel', val)}
                            >
                                <SelectTrigger className="bg-secondary/50 border-white/10">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="info">Info (Blue)</SelectItem>
                                    <SelectItem value="warning">Warning (Yellow)</SelectItem>
                                    <SelectItem value="destructive">Critical (Red)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button
                            onClick={handleUpdateAnnouncement}
                            disabled={isUpdatingSettings}
                            className="w-full bg-primary hover:bg-primary/90"
                        >
                            {isUpdatingSettings && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Update Announcement
                        </Button>
                    </CardContent>
                </Card>
                <Card className="bg-red-950/10 backdrop-blur-sm border-red-500/20 md:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-red-500">
                            <AlertTriangle className="w-5 h-5" />
                            Emergency Actions
                        </CardTitle>
                        <CardDescription>Irreversible system actions.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-lg border border-red-500/10 bg-red-500/5">
                            <div className="space-y-1">
                                <p className="font-medium text-red-400">Flush Cache</p>
                                <p className="text-xs text-muted-foreground">Clear all server-side caches.</p>
                            </div>
                            <Button variant="destructive" size="sm" onClick={() => toast.success("Cache flushed (Simulation)")}>
                                Execute
                            </Button>
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-lg border border-red-500/10 bg-red-500/5">
                            <div className="space-y-1">
                                <p className="font-medium text-red-400">Reset Search Index</p>
                                <p className="text-xs text-muted-foreground">Rebuild search indexes from scratch.</p>
                            </div>
                            <Button variant="destructive" size="sm" onClick={() => toast.success("Index rebuild started (Simulation)")}>
                                Execute
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      <UserManagementDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        user={selectedUser}
        mode={dialogMode}
        onSuccess={fetchData}
      />
      <VideoModal
        post={selectedPost}
        isOpen={!!selectedPost}
        onClose={() => setSelectedPost(null)}
        onDelete={() => {
            if (selectedPost) handleDeletePost(selectedPost.id);
            setSelectedPost(null);
        }}
      />
    </div>
  );
}