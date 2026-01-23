import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';
import type { User } from '@shared/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Save, Shield, RefreshCw } from "lucide-react";
import { toast } from "sonner";
export function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingState, setEditingState] = useState<Record<string, { followers: number; avatarDecoration: string }>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api<{ items: User[] }>('/api/users?limit=100');
      setUsers(res.items);
      // Initialize editing state
      const initialEditState: Record<string, { followers: number; avatarDecoration: string }> = {};
      res.items.forEach(u => {
        initialEditState[u.id] = {
          followers: u.followers || 0,
          avatarDecoration: u.avatarDecoration || 'none'
        };
      });
      setEditingState(initialEditState);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchUsers();
  }, []);
  const handleUpdate = async (userId: string) => {
    const updates = editingState[userId];
    if (!updates) return;
    try {
      setSaving(userId);
      await api(`/api/admin/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
      toast.success("User updated successfully");
      // Refresh list to confirm sync
      await fetchUsers();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update user");
    } finally {
      setSaving(null);
    }
  };
  const handleEditChange = (userId: string, field: 'followers' | 'avatarDecoration', value: any) => {
    setEditingState(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        [field]: value
      }
    }));
  };
  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 lg:py-12 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-display flex items-center gap-2">
              <Shield className="w-8 h-8 text-primary" />
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground">Manage users, verification, and decorations.</p>
          </div>
          <Button onClick={fetchUsers} variant="outline" size="icon">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
        <div className="rounded-xl border border-white/10 bg-card/50 backdrop-blur-sm overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-white/5">
                  <TableHead className="w-[250px]">User</TableHead>
                  <TableHead>Followers</TableHead>
                  <TableHead>Decoration</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                      No users found.
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id} className="border-white/10 hover:bg-white/5">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10 border border-white/10">
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
                        <Input
                          type="number"
                          value={editingState[user.id]?.followers ?? 0}
                          onChange={(e) => handleEditChange(user.id, 'followers', parseInt(e.target.value) || 0)}
                          className="w-32 bg-secondary/50 border-white/10"
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={editingState[user.id]?.avatarDecoration}
                          onValueChange={(val) => handleEditChange(user.id, 'avatarDecoration', val)}
                        >
                          <SelectTrigger className="w-[180px] bg-secondary/50 border-white/10">
                            <SelectValue placeholder="Select decoration" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="gold-border">Gold Border</SelectItem>
                            <SelectItem value="neon-glow">Neon Glow</SelectItem>
                            <SelectItem value="blue-fire">Blue Fire</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          onClick={() => handleUpdate(user.id)}
                          disabled={saving === user.id}
                          className="bg-primary hover:bg-primary/90"
                        >
                          {saving === user.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Save className="w-4 h-4" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
}