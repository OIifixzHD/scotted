import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Eye, Trash2, Heart, MessageCircle, Play } from "lucide-react";
import { format } from 'date-fns';
import type { Post } from '@shared/types';
interface AdminPostTableProps {
  posts: Post[];
  onView: (post: Post) => void;
  onDelete: (postId: string) => void;
}
export function AdminPostTable({ posts, onView, onDelete }: AdminPostTableProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-card/50 backdrop-blur-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-white/10 hover:bg-white/5">
            <TableHead>Content</TableHead>
            <TableHead>Author</TableHead>
            <TableHead>Engagement</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {posts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                No posts found.
              </TableCell>
            </TableRow>
          ) : (
            posts.map((post) => (
              <TableRow key={post.id} className="border-white/10 hover:bg-white/5">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-24 bg-black rounded-md overflow-hidden relative shrink-0 border border-white/10 group cursor-pointer" onClick={() => onView(post)}>
                      <video src={post.videoUrl} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" muted />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                        <Play className="w-6 h-6 text-white fill-white" />
                      </div>
                    </div>
                    <div className="max-w-[200px]">
                      <p className="font-medium text-sm truncate text-white" title={post.caption}>
                        {post.caption || "No caption"}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {post.tags?.slice(0, 2).map(tag => (
                          <span key={tag} className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="w-6 h-6 border border-white/10">
                      <AvatarImage src={post.user?.avatar} />
                      <AvatarFallback>{post.user?.name?.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-muted-foreground hover:text-white transition-colors">
                      {post.user?.name || 'Unknown'}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1" title="Likes">
                      <Heart className="w-3 h-3" /> {post.likes}
                    </div>
                    <div className="flex items-center gap-1" title="Comments">
                      <MessageCircle className="w-3 h-3" /> {post.comments}
                    </div>
                    <div className="flex items-center gap-1" title="Views">
                      <Eye className="w-3 h-3" /> {post.views || 0}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {format(new Date(post.createdAt), 'MMM d, yyyy')}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10" onClick={() => onView(post)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10" onClick={() => onDelete(post.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}