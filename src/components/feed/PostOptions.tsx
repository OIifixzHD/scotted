import React, { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Trash2, Flag, Link as LinkIcon, Loader2, Edit, Ban, Rocket } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import type { Post } from "@shared/types";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { ReportDialog } from "@/components/profile/ReportDialog";
import { EditPostDialog } from "@/components/feed/EditPostDialog";
import { PromoteDialog } from "@/components/feed/PromoteDialog";
interface PostOptionsProps {
  post: Post;
  onDelete?: () => void;
  onUpdate?: (post: Post) => void;
  onHide?: () => void;
}
export function PostOptions({ post, onDelete, onUpdate, onHide }: PostOptionsProps) {
  const { user } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPromoteDialogOpen, setIsPromoteDialogOpen] = useState(false);
  const isOwner = user?.id === post.userId;
  const isAdmin = user?.isAdmin;
  const canDelete = isOwner || isAdmin;
  const canEdit = isOwner || isAdmin;
  const handleDelete = async () => {
    if (!user) return;
    if (!confirm("Are you sure you want to delete this post?")) return;
    setIsDeleting(true);
    try {
      await api(`/api/posts/${post.id}`, {
        method: 'DELETE',
        body: JSON.stringify({ userId: user.id })
      });
      toast.success("Post deleted");
      onDelete?.();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete post");
    } finally {
      setIsDeleting(false);
    }
  };
  const handleCopyLink = async () => {
    const url = `${window.location.origin}/post/${post.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard");
    } catch (err) {
      toast.error("Failed to copy link");
    }
  };
  const handleNotInterested = async () => {
    if (!user) return;
    try {
      await api(`/api/users/${user.id}/not-interested`, {
        method: 'POST',
        body: JSON.stringify({ postId: post.id })
      });
      toast.success("Post hidden");
      onHide?.();
    } catch (error) {
      console.error(error);
      toast.error("Failed to hide post");
    }
  };
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full bg-black/20 backdrop-blur-sm text-white hover:bg-black/40 transition-all duration-200 active:scale-90"
          >
            <MoreHorizontal className="w-6 h-6" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-card border-white/10 w-48">
          <DropdownMenuItem onClick={handleCopyLink} className="cursor-pointer">
            <LinkIcon className="w-4 h-4 mr-2" />
            Copy Link
          </DropdownMenuItem>
          {isOwner && (
            <DropdownMenuItem onClick={() => setIsPromoteDialogOpen(true)} className="cursor-pointer text-yellow-400 focus:text-yellow-400">
              <Rocket className="w-4 h-4 mr-2" />
              Promote
            </DropdownMenuItem>
          )}
          {canEdit && (
            <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)} className="cursor-pointer">
              <Edit className="w-4 h-4 mr-2" />
              Edit Post
            </DropdownMenuItem>
          )}
          {user && !isOwner && (
            <>
              <DropdownMenuItem onClick={handleNotInterested} className="cursor-pointer">
                <Ban className="w-4 h-4 mr-2" />
                Not Interested
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsReportDialogOpen(true)} className="cursor-pointer text-yellow-500 focus:text-yellow-500">
                <Flag className="w-4 h-4 mr-2" />
                Report
              </DropdownMenuItem>
            </>
          )}
          {canDelete && (
            <>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem
                onClick={handleDelete}
                disabled={isDeleting}
                className="cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-500/10"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                Delete
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <ReportDialog
        open={isReportDialogOpen}
        onClose={() => setIsReportDialogOpen(false)}
        targetId={post.id}
        targetType="post"
        targetName="this post"
      />
      <EditPostDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        post={post}
        onSuccess={(updatedPost) => {
          onUpdate?.(updatedPost);
        }}
      />
      <PromoteDialog
        open={isPromoteDialogOpen}
        onOpenChange={setIsPromoteDialogOpen}
        post={post}
        onSuccess={(updatedPost) => {
          onUpdate?.(updatedPost);
        }}
      />
    </>
  );
}