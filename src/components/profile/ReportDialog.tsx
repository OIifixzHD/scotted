import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { useAuth } from "@/context/AuthContext";
interface ReportDialogProps {
  open: boolean;
  onClose: () => void;
  targetId: string;
  targetType: 'user' | 'post';
  targetName?: string; // For display purposes (e.g. user name or "this post")
}
export function ReportDialog({ open, onClose, targetId, targetType, targetName }: ReportDialogProps) {
  const { user } = useAuth();
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleSubmit = async () => {
    if (!user || !reason) return;
    setIsSubmitting(true);
    try {
      const endpoint = targetType === 'user'
        ? `/api/users/${targetId}/report`
        : `/api/posts/${targetId}/report`;
      await api(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          reporterId: user.id,
          reason,
          description
        })
      });
      toast.success('Report submitted. Thank you for keeping Pulse safe.');
      onClose();
      setReason('');
      setDescription('');
    } catch (error) {
      console.error(error);
      toast.error('Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };
  const displayTarget = targetName || (targetType === 'user' ? 'this user' : 'this post');
  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-[425px] bg-card border-white/10 text-foreground">
        <DialogHeader>
          <DialogTitle>Report {targetType === 'user' ? 'User' : 'Content'}</DialogTitle>
          <DialogDescription>
            Report {displayTarget} for violating community guidelines.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label>Reason</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger className="bg-secondary/50 border-white/10">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="spam">Spam or Bot</SelectItem>
                <SelectItem value="harassment">Harassment or Bullying</SelectItem>
                <SelectItem value="inappropriate">Inappropriate Content</SelectItem>
                <SelectItem value="impersonation">Impersonation</SelectItem>
                <SelectItem value="misinformation">Misinformation</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Description (Optional)</Label>
            <Textarea
              placeholder="Provide more details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-secondary/50 border-white/10 min-h-[100px]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !reason}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Submit Report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}