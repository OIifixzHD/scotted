import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Heart, MessageCircle, Share2, TrendingUp, Activity, BarChart3 } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import type { Post } from '@shared/types';
import { NumberTicker } from "@/components/ui/number-ticker";
import { cn } from "@/lib/utils";
interface InsightsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: Post;
}
export function InsightsDialog({ open, onOpenChange, post }: InsightsDialogProps) {
  const views = post.views || 0;
  const likes = post.likes || 0;
  const comments = post.comments || 0;
  const shares = post.shares || 0;
  // Calculate Engagement Rate
  // Formula: ((Likes + Comments + Shares) / Views) * 100
  // Handle division by zero if views are 0
  const totalInteractions = likes + comments + shares;
  const engagementRate = views > 0 ? (totalInteractions / views) * 100 : 0;
  const data = [
    { name: 'Likes', value: likes, color: '#ef4444' }, // Red
    { name: 'Comments', value: comments, color: '#3b82f6' }, // Blue
    { name: 'Shares', value: shares, color: '#a855f7' }, // Purple
  ];
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-white/10 p-2 rounded-lg shadow-xl">
          <p className="text-sm font-bold text-white">{label}</p>
          <p className="text-xs text-muted-foreground">
            {payload[0].value.toLocaleString()} interactions
          </p>
        </div>
      );
    }
    return null;
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-card/95 backdrop-blur-xl border-white/10 text-foreground max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <BarChart3 className="w-6 h-6 text-primary" />
            Post Insights
          </DialogTitle>
          <DialogDescription>
            Real-time analytics for your content performance.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-secondary/20 border-white/5">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                  <Eye className="w-3 h-3" /> Views
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="text-2xl font-bold text-white">
                  <NumberTicker value={views} />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-secondary/20 border-white/5">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                  <Heart className="w-3 h-3" /> Likes
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="text-2xl font-bold text-white">
                  <NumberTicker value={likes} />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-secondary/20 border-white/5">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                  <MessageCircle className="w-3 h-3" /> Comments
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="text-2xl font-bold text-white">
                  <NumberTicker value={comments} />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-secondary/20 border-white/5">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                  <Share2 className="w-3 h-3" /> Shares
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="text-2xl font-bold text-white">
                  <NumberTicker value={shares} />
                </div>
              </CardContent>
            </Card>
          </div>
          {/* Engagement Score & Chart */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Engagement Score */}
            <Card className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border-white/10 md:col-span-1 flex flex-col justify-center">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-white/80">
                  <Activity className="w-4 h-4 text-teal-400" />
                  Engagement Rate
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center pb-8">
                <div className="relative flex items-center justify-center w-32 h-32">
                  {/* Simple SVG Circle Progress */}
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle
                      className="text-white/10 stroke-current"
                      strokeWidth="8"
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                    />
                    <circle
                      className="text-teal-400 progress-ring__circle stroke-current transition-all duration-1000 ease-out"
                      strokeWidth="8"
                      strokeLinecap="round"
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      strokeDasharray="251.2"
                      strokeDashoffset={251.2 - (251.2 * Math.min(engagementRate, 100)) / 100}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <span className="text-2xl font-bold text-white">
                      <NumberTicker value={engagementRate} decimalPlaces={1} />%
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-center px-2">
                  Based on interactions relative to views.
                </p>
              </CardContent>
            </Card>
            {/* Interaction Breakdown Chart */}
            <Card className="bg-secondary/10 border-white/5 md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-white/80">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  Interaction Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#9ca3af', fontSize: 12 }}
                      width={70}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={32}>
                      {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}