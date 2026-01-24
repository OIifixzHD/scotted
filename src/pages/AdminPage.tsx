import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';
import type { User, Report } from '@shared/types';
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
import { Loader2, Shield, RefreshCw, MoreHorizontal, CheckCircle2, Ban, Trash2, MessageSquare, Edit, FileText, User as UserIcon, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { UserManagementDialog } from '@/components/admin/UserManagementDialog';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
export function AdminPage() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState<User[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [dialogMode, setDialogMode] = useState<'edit' | 'ban'>('edit');
  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, reportsRes] = await Promise.all([
        api<{ items: User[] }>('/api/users?limit=100'),
        api<Report[]>('/api/admin/reports')
      ]);
      setUsers(usersRes.items);
      setReports(reportsRes);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch admin data");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchData();
  }, []);
  const handleOpenDialog = (user: User, mode: 'edit' | 'ban') => {
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
      toast.error('Failed to delete user');
    }
  };
  const handleMessageUser = async (targetUser: User) => {
    if (!currentUser) return;
    try {
      // Create a chat or find existing (simplified for demo: create new with title)
      const chat = await api<{ id: string }>('/api/chats', {
        method: 'POST',
        body: JSON.stringify({ title: `Admin Chat: ${targetUser.name}` })
      });
      navigate('/inbox');
    } catch (error) {
      toast.error('Failed to start chat');
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
      toast.error('Failed to update report');
    }
  };
  // Mock Data for Analytics
  const userGrowthData = [
    { name: 'Mon', users: 12 },
    { name: 'Tue', users: 19 },
    { name: 'Wed', users: 15 },
    { name: 'Thu', users: 25 },
    { name: 'Fri', users: 32 },
    { name: 'Sat', users: 45 },
    { name: 'Sun', users: 58 },
  ];
  const activityData = [
    { name: 'Mon', likes: 120, comments: 45 },
    { name: 'Tue', likes: 150, comments: 55 },
    { name: 'Wed', likes: 180, comments: 40 },
    { name: 'Thu', likes: 220, comments: 70 },
    { name: 'Fri', likes: 300, comments: 90 },
    { name: 'Sat', likes: 450, comments: 120 },
    { name: 'Sun', likes: 380, comments: 100 },
  ];
  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 lg:py-12 space-y-8">
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
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
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
                      <TableHead>Status</TableHead>
                      <TableHead>Verified</TableHead>
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
                                <div className="font-bold">{user.name}</div>
                                <div className="text-xs text-muted-foreground">@{user.name.toLowerCase().replace(/\s/g, '')}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {isBanned ? (
                              <Badge variant="destructive" className="bg-red-500/20 text-red-400 hover:bg-red-500/30">Banned</Badge>
                            ) : (
                              <Badge variant="outline" className="border-green-500/50 text-green-400">Active</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {user.isVerified ? (
                              <CheckCircle2 className="w-5 h-5 text-blue-400" />
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
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
                                <DropdownMenuItem onClick={() => handleOpenDialog(user, 'ban')} className="text-red-400 focus:text-red-400">
                                  <Ban className="mr-2 h-4 w-4" /> Ban User
                                </DropdownMenuItem>
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
          <TabsContent value="analytics" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* User Growth Chart */}
              <div className="rounded-xl border border-white/10 bg-card/50 backdrop-blur-sm p-6">
                <div className="flex items-center gap-2 mb-6">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-bold">New Users (Last 7 Days)</h3>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={userGrowthData}>
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
                </div>
              </div>
              {/* Activity Chart */}
              <div className="rounded-xl border border-white/10 bg-card/50 backdrop-blur-sm p-6">
                <div className="flex items-center gap-2 mb-6">
                  <BarChart3 className="w-5 h-5 text-teal-400" />
                  <h3 className="text-lg font-bold">Platform Activity</h3>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={activityData}>
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
                </div>
              </div>
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
    </div>
  );
}