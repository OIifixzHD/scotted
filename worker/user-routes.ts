import { Hono } from "hono";
import type { Env } from './core-utils';
import { UserEntity, ChatBoardEntity, PostEntity, NotificationEntity, ReportEntity, SystemEntity, SystemSettings } from "./entities";
import { ok, bad, notFound, isStr } from './core-utils';
import type { User, Notification, Post, Report, Comment, ChartDataPoint, AdminStats, TextOverlay, Chat, UserSettings } from "@shared/types";
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  app.get('/api/test', (c) => c.json({ success: true, data: { name: 'Pulse API' }}));
  // --- SYSTEM SETTINGS ---
  app.get('/api/system', async (c) => {
    const system = new SystemEntity(c.env, 'global-settings');
    const settings = await system.getSettings();
    return ok(c, settings);
  });
  app.put('/api/admin/system', async (c) => {
    const updates = await c.req.json() as Partial<SystemSettings>;
    const system = new SystemEntity(c.env, 'global-settings');
    const updated = await system.updateSettings(updates);
    return ok(c, updated);
  });
  // --- AUTHENTICATION ---
  app.post('/api/auth/signup', async (c) => {
    const system = new SystemEntity(c.env, 'global-settings');
    const settings = await system.getSettings();
    if (settings.disableSignups) {
        return c.json({ success: false, error: 'New signups are currently disabled by the administrator.' }, 403);
    }
    const { username, password, bio } = await c.req.json() as { username?: string; password?: string; bio?: string };
    if (!username?.trim() || !password?.trim()) {
      return bad(c, 'Username and password are required');
    }
    const existing = await UserEntity.findByUsername(c.env, username.trim());
    if (existing) {
      return bad(c, 'Username already taken');
    }
    const newUser: User = {
      id: crypto.randomUUID(),
      name: username.trim(),
      displayName: username.trim(),
      password: password.trim(),
      bio: bio?.trim() || 'New to Pulse',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
      followers: 0,
      following: 0,
      followingIds: [],
      echoes: 0,
      avatarDecoration: 'none',
      unlockedDecorations: ['none'],
      badge: 'none',
      bannerStyle: 'default',
      isAdmin: false,
      isVerified: false,
      bannedUntil: 0,
      banReason: "",
      bannedBy: "",
      blockedUserIds: [],
      notInterestedPostIds: [],
      createdAt: Date.now(),
      directMessages: {},
      settings: {
        notifications: { paused: false, newFollowers: true, interactions: true },
        privacy: { privateAccount: false },
        content: { autoplay: true, reducedMotion: false }
      }
    };
    const created = await UserEntity.create(c.env, newUser);
    const { password: _, ...safeUser } = created;
    return ok(c, safeUser);
  });
  app.post('/api/auth/login', async (c) => {
    const { username, password } = await c.req.json() as { username?: string; password?: string };
    if (!username?.trim() || !password?.trim()) {
      return bad(c, 'Username and password are required');
    }
    const user = await UserEntity.findByUsername(c.env, username.trim());
    if (!user || (user.password && user.password !== password)) {
      if (user && user.password && user.password !== password) {
         return bad(c, 'Invalid credentials');
      }
      if (!user) {
        return bad(c, 'User not found');
      }
    }
    if (user.bannedUntil && user.bannedUntil > Date.now()) {
        return bad(c, `Account suspended until ${new Date(user.bannedUntil).toLocaleDateString()}. Reason: ${user.banReason || 'Violation of terms'}`);
    }
    const { password: _, ...safeUser } = user;
    return ok(c, safeUser);
  });
  // --- ADMIN ---
  app.get('/api/admin/stats', async (c) => {
    await UserEntity.ensureSeed(c.env);
    await PostEntity.ensureSeed(c.env);
    const [usersPage, postsPage, notificationsPage] = await Promise.all([
        UserEntity.list(c.env, null, 10000),
        PostEntity.list(c.env, null, 10000),
        NotificationEntity.list(c.env, null, 10000)
    ]);
    const users = usersPage.items;
    const posts = postsPage.items;
    const notifications = notificationsPage.items;
    const totalUsers = users.length;
    const totalPosts = posts.length;
    const totalViews = posts.reduce((acc, p) => acc + (p.views || 0), 0);
    const totalLikes = posts.reduce((acc, p) => acc + (p.likes || 0), 0);
    const totalComments = posts.reduce((acc, p) => acc + (p.comments || 0), 0);
    const totalEngagement = totalLikes + totalComments;
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d);
    }
    const userGrowth: ChartDataPoint[] = days.map(d => ({
        name: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dateStr: d.toDateString(),
        users: 0
    }));
    const activity: ChartDataPoint[] = days.map(d => ({
        name: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dateStr: d.toDateString(),
        likes: 0,
        comments: 0
    }));
    users.forEach(u => {
        if (u.createdAt) {
            const d = new Date(u.createdAt).toDateString();
            const point = userGrowth.find(p => p.dateStr === d);
            if (point) {
                (point.users as number)++;
            }
        }
    });
    notifications.forEach(n => {
        if (n.createdAt) {
            const d = new Date(n.createdAt).toDateString();
            const point = activity.find(p => p.dateStr === d);
            if (point) {
                if (n.type === 'like') (point.likes as number)++;
                if (n.type === 'comment') (point.comments as number)++;
            }
        }
    });
    userGrowth.forEach(p => delete p.dateStr);
    activity.forEach(p => delete p.dateStr);
    const stats: AdminStats = {
        totalUsers,
        totalPosts,
        totalViews,
        totalEngagement,
        totalLikes,
        totalComments,
        userGrowth,
        activity
    };
    return ok(c, stats);
  });
  app.get('/api/admin/posts', async (c) => {
    await PostEntity.ensureSeed(c.env);
    const page = await PostEntity.list(c.env, null, 100);
    const posts = page.items;
    const hydratedPosts = await Promise.all(posts.map(async (post) => {
        if (post.userId) {
            const userEntity = new UserEntity(c.env, post.userId);
            if (await userEntity.exists()) {
                const userData = await userEntity.getState();
                const { password, ...safeUser } = userData;
                return { ...post, user: safeUser };
            }
        }
        return post;
    }));
    hydratedPosts.sort((a, b) => b.createdAt - a.createdAt);
    return ok(c, { items: hydratedPosts });
  });
  app.put('/api/admin/users/:id', async (c) => {
    const id = c.req.param('id');
    const { followers, avatarDecoration, badge, isVerified, bannedUntil, banReason, name, isAdmin, bannedBy, bio, avatar, bannerStyle } = await c.req.json() as Partial<User>;
    const userEntity = new UserEntity(c.env, id);
    if (!await userEntity.exists()) {
      return notFound(c, 'User not found');
    }
    const updates: Partial<User> = {};
    if (followers !== undefined) updates.followers = followers;
    if (avatarDecoration !== undefined) updates.avatarDecoration = avatarDecoration;
    if (badge !== undefined) updates.badge = badge;
    if (bannerStyle !== undefined) updates.bannerStyle = bannerStyle;
    if (isVerified !== undefined) updates.isVerified = isVerified;
    if (bannedUntil !== undefined) updates.bannedUntil = bannedUntil;
    if (banReason !== undefined) updates.banReason = banReason;
    if (isAdmin !== undefined) updates.isAdmin = isAdmin;
    if (bannedBy !== undefined) updates.bannedBy = bannedBy;
    if (bio !== undefined) updates.bio = bio;
    if (avatar !== undefined) updates.avatar = avatar;
    if (name !== undefined) updates.name = name;
    const updated = await userEntity.updateAdminStats(updates);
    const { password: _, ...safeUser } = updated;
    return ok(c, safeUser);
  });
  app.delete('/api/admin/users/:id', async (c) => {
    const id = c.req.param('id');
    const userEntity = new UserEntity(c.env, id);
    if (!await userEntity.exists()) {
        return notFound(c, 'User not found');
    }
    await UserEntity.delete(c.env, id);
    return ok(c, { deleted: true });
  });
  app.get('/api/admin/reports', async (c) => {
    const reports = await ReportEntity.listAll(c.env);
    const hydrated = await Promise.all(reports.map(async (r) => {
        const reporterEntity = new UserEntity(c.env, r.reporterId);
        let reporter: User | undefined;
        if (await reporterEntity.exists()) {
            const d = await reporterEntity.getState();
            const { password, ...safe } = d;
            reporter = safe;
        }
        let target: User | undefined;
        let post: Post | undefined;
        if (r.targetType === 'user') {
            const targetEntity = new UserEntity(c.env, r.targetId);
            if (await targetEntity.exists()) {
                const d = await targetEntity.getState();
                const { password, ...safe } = d;
                target = safe;
            }
        } else if (r.targetType === 'post') {
            const postEntity = new PostEntity(c.env, r.targetId);
            if (await postEntity.exists()) {
                post = await postEntity.getState();
            }
        }
        return { ...r, reporter, target, post };
    }));
    return ok(c, hydrated);
  });
  app.post('/api/admin/reports/:id/resolve', async (c) => {
    const id = c.req.param('id');
    const { status } = await c.req.json() as { status: 'resolved' | 'dismissed' };
    const reportEntity = new ReportEntity(c.env, id);
    if (!await reportEntity.exists()) return notFound(c, 'Report not found');
    const updated = await reportEntity.mutate(s => ({ ...s, status }));
    return ok(c, updated);
  });
  // --- SEARCH & TRENDING ---
  app.get('/api/search', async (c) => {
    const q = c.req.query('q');
    const type = c.req.query('type'); // 'video', 'audio', 'user', 'all'
    if (!q || q.trim().length === 0) {
      return ok(c, { users: [], posts: [] });
    }
    const query = q.trim();
    let users: User[] = [];
    let posts: Post[] = [];
    // Fetch Users if type allows
    if (!type || type === 'all' || type === 'user') {
        users = await UserEntity.search(c.env, query);
    }
    // Fetch Posts if type allows
    if (!type || type === 'all' || type === 'video' || type === 'audio') {
        posts = await PostEntity.search(c.env, query);
        // Filter by specific post type if requested
        if (type === 'video' || type === 'audio') {
            posts = posts.filter(p => p.type === type);
        }
    }
    const hydratedPosts = await Promise.all(posts.map(async (post) => {
        if (post.userId) {
            const userEntity = new UserEntity(c.env, post.userId);
            if (await userEntity.exists()) {
                const userData = await userEntity.getState();
                const { password, ...safeUser } = userData;
                return { ...post, user: safeUser };
            }
        }
        return post;
    }));
    const safeUsers = users.map(u => {
        const { password, ...rest } = u;
        return rest;
    });
    return ok(c, { users: safeUsers, posts: hydratedPosts });
  });
  app.get('/api/feed/trending', async (c) => {
    const type = c.req.query('type'); // 'video', 'audio'
    await PostEntity.ensureSeed(c.env);
    await UserEntity.ensureSeed(c.env);
    const page = await PostEntity.list(c.env, null, 100);
    let sortedPosts = page.items.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    if (type === 'video' || type === 'audio') {
        sortedPosts = sortedPosts.filter(p => p.type === type);
    }
    const hydratedPosts = await Promise.all(sortedPosts.map(async (post) => {
        if (post.userId) {
            const userEntity = new UserEntity(c.env, post.userId);
            if (await userEntity.exists()) {
                const userData = await userEntity.getState();
                const { password, ...safeUser } = userData;
                return { ...post, user: safeUser };
            }
        }
        return post;
    }));
    return ok(c, { items: hydratedPosts });
  });
  app.get('/api/tags/:tagName', async (c) => {
    const tagName = decodeURIComponent(c.req.param('tagName')).toLowerCase();
    await PostEntity.ensureSeed(c.env);
    const page = await PostEntity.list(c.env, null, 1000);
    const taggedPosts = page.items.filter(p =>
      p.tags?.some(t => t.toLowerCase() === tagName)
    );
    const hydratedPosts = await Promise.all(taggedPosts.map(async (post) => {
        if (post.userId) {
            const userEntity = new UserEntity(c.env, post.userId);
            if (await userEntity.exists()) {
                const userData = await userEntity.getState();
                const { password, ...safeUser } = userData;
                return { ...post, user: safeUser };
            }
        }
        return post;
    }));
    hydratedPosts.sort((a, b) => b.createdAt - a.createdAt);
    return ok(c, {
      tagName,
      count: hydratedPosts.length,
      posts: hydratedPosts
    });
  });
  app.get('/api/sounds/trending', async (c) => {
    await PostEntity.ensureSeed(c.env);
    const page = await PostEntity.list(c.env, null, 500);
    const posts = page.items;
    const soundCounts = new Map<string, { id: string; name: string; count: number }>();
    for (const post of posts) {
        const soundId = post.soundId || 'default-sound';
        const soundName = post.soundName || 'Original Audio';
        if (soundCounts.has(soundId)) {
            const entry = soundCounts.get(soundId)!;
            entry.count++;
        } else {
            soundCounts.set(soundId, { id: soundId, name: soundName, count: 1 });
        }
    }
    const trendingSounds = Array.from(soundCounts.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    return ok(c, trendingSounds);
  });
  app.get('/api/sounds/:id', async (c) => {
    const id = c.req.param('id');
    const sound = {
        id,
        name: id === 'default-sound' ? 'Original Audio' : `Sound Track ${id.substring(0, 4)}`,
        playCount: 1200000,
        artist: 'Pulse Artist'
    };
    await PostEntity.ensureSeed(c.env);
    await UserEntity.ensureSeed(c.env);
    const page = await PostEntity.list(c.env, null, 50);
    const hydratedPosts = await Promise.all(page.items.map(async (post) => {
        if (post.userId) {
            const userEntity = new UserEntity(c.env, post.userId);
            if (await userEntity.exists()) {
                const userData = await userEntity.getState();
                const { password, ...safeUser } = userData;
                return { ...post, user: safeUser };
            }
        }
        return post;
    }));
    return ok(c, { sound, posts: hydratedPosts });
  });
  // --- USERS ---
  app.get('/api/users', async (c) => {
    await UserEntity.ensureSeed(c.env);
    const cq = c.req.query('cursor');
    const lq = c.req.query('limit');
    const page = await UserEntity.list(c.env, cq ?? null, lq ? Math.max(1, (Number(lq) | 0)) : undefined);
    const safeItems = page.items.map(u => {
      const { password, ...rest } = u;
      return rest;
    });
    return ok(c, { ...page, items: safeItems });
  });
  app.get('/api/users/suggested', async (c) => {
    const userId = c.req.query('userId');
    await UserEntity.ensureSeed(c.env);
    let followingIds: string[] = [];
    if (userId) {
        const currentUserEntity = new UserEntity(c.env, userId);
        if (await currentUserEntity.exists()) {
            const currentUser = await currentUserEntity.getState();
            followingIds = currentUser.followingIds || [];
        }
    }
    const page = await UserEntity.list(c.env, null, 100);
    const candidates = page.items.filter(u => {
        if (userId && u.id === userId) return false;
        if (followingIds.includes(u.id)) return false;
        return true;
    });
    candidates.sort((a, b) => (b.followers || 0) - (a.followers || 0));
    const suggestions = candidates.slice(0, 10);
    const safeSuggestions = suggestions.map(u => {
        const { password, ...rest } = u;
        return rest;
    });
    return ok(c, safeSuggestions);
  });
  app.get('/api/users/:id', async (c) => {
    const id = c.req.param('id');
    await UserEntity.ensureSeed(c.env);
    const user = new UserEntity(c.env, id);
    if (!await user.exists()) return notFound(c, 'User not found');
    const data = await user.getState();
    const { password, ...safeUser } = data;
    return ok(c, safeUser);
  });
  app.put('/api/users/:id', async (c) => {
    const id = c.req.param('id');
    const { displayName, bio, avatar, bannerStyle, settings } = await c.req.json() as {
        displayName?: string;
        bio?: string;
        avatar?: string;
        bannerStyle?: string;
        settings?: UserSettings;
    };
    if (displayName !== undefined && !displayName.trim()) {
      return bad(c, 'Display Name cannot be empty');
    }
    const userEntity = new UserEntity(c.env, id);
    if (!await userEntity.exists()) {
      return notFound(c, 'User not found');
    }
    const updated = await userEntity.mutate(s => {
        let newSettings = s.settings;
        if (settings) {
            // Shallow merge top-level setting groups to preserve other groups if not sent
            newSettings = {
                notifications: { ...s.settings?.notifications, ...settings.notifications },
                privacy: { ...s.settings?.privacy, ...settings.privacy },
                content: { ...s.settings?.content, ...settings.content },
            };
        }
        return {
            ...s,
            displayName: displayName?.trim() || s.displayName || s.name,
            bio: bio?.trim() ?? s.bio,
            avatar: avatar || s.avatar,
            bannerStyle: bannerStyle || s.bannerStyle,
            settings: newSettings
        };
    });
    const { password, ...safeUser } = updated;
    return ok(c, safeUser);
  });
  app.delete('/api/users/:id', async (c) => {
    const id = c.req.param('id');
    const { currentUserId } = await c.req.json() as { currentUserId?: string };
    if (!currentUserId) {
        return bad(c, 'currentUserId required');
    }
    const requester = new UserEntity(c.env, currentUserId);
    if (!await requester.exists()) return bad(c, 'Requester not found');
    const requesterData = await requester.getState();
    if (currentUserId !== id && !requesterData.isAdmin) {
        return bad(c, 'Unauthorized');
    }
    const userEntity = new UserEntity(c.env, id);
    if (!await userEntity.exists()) {
        return notFound(c, 'User not found');
    }
    await UserEntity.delete(c.env, id);
    return ok(c, { deleted: true });
  });
  app.post('/api/users/:id/follow', async (c) => {
    const targetId = c.req.param('id');
    const { currentUserId } = await c.req.json() as { currentUserId?: string };
    if (!currentUserId) return bad(c, 'currentUserId required');
    if (currentUserId === targetId) return bad(c, 'Cannot follow yourself');
    const currentUserEntity = new UserEntity(c.env, currentUserId);
    if (!await currentUserEntity.exists()) return notFound(c, 'Current user not found');
    const targetUserEntity = new UserEntity(c.env, targetId);
    if (!await targetUserEntity.exists()) return notFound(c, 'Target user not found');
    const updatedCurrentUser = await currentUserEntity.mutate(user => {
        const followingIds = user.followingIds || [];
        const isFollowing = followingIds.includes(targetId);
        let newFollowingIds;
        let followingCountChange = 0;
        if (isFollowing) {
            newFollowingIds = followingIds.filter(id => id !== targetId);
            followingCountChange = -1;
        } else {
            newFollowingIds = [...followingIds, targetId];
            followingCountChange = 1;
        }
        return {
            ...user,
            followingIds: newFollowingIds,
            following: Math.max(0, (user.following || 0) + followingCountChange)
        };
    });
    await targetUserEntity.mutate(user => {
        const isFollowingNow = updatedCurrentUser.followingIds?.includes(targetId);
        const change = isFollowingNow ? 1 : -1;
        const newFollowers = Math.max(0, (user.followers || 0) + change);
        let newBadge = user.badge;
        if (newFollowers > 5) {
            if (!user.badge || user.badge === 'none') {
                newBadge = 'verified-pro';
            }
        } else {
            if (user.badge === 'verified-pro') {
                newBadge = 'none';
            }
        }
        // Echoes Reward (100 for new follower)
        const echoesChange = (change > 0) ? 100 : 0;
        return {
            ...user,
            followers: newFollowers,
            badge: newBadge,
            echoes: (user.echoes || 0) + echoesChange
        };
    });
    // Check target user settings before notifying
    const targetUser = await targetUserEntity.getState();
    const notificationsPaused = targetUser.settings?.notifications?.paused;
    const newFollowersNotif = targetUser.settings?.notifications?.newFollowers !== false; // Default true
    if (updatedCurrentUser.followingIds?.includes(targetId) && !notificationsPaused && newFollowersNotif) {
        const notif: Notification = {
            id: crypto.randomUUID(),
            userId: targetId,
            actorId: currentUserId,
            type: 'follow',
            read: false,
            createdAt: Date.now()
        };
        await NotificationEntity.create(c.env, notif);
    }
    const { password, ...safeUser } = updatedCurrentUser;
    return ok(c, safeUser);
  });
  app.post('/api/users/:id/block', async (c) => {
    const targetId = c.req.param('id');
    const { currentUserId } = await c.req.json() as { currentUserId?: string };
    if (!currentUserId) return bad(c, 'currentUserId required');
    if (currentUserId === targetId) return bad(c, 'Cannot block yourself');
    const currentUserEntity = new UserEntity(c.env, currentUserId);
    if (!await currentUserEntity.exists()) return notFound(c, 'Current user not found');
    const result = await currentUserEntity.toggleBlock(targetId);
    return ok(c, result);
  });
  app.get('/api/users/blocked', async (c) => {
    const userId = c.req.query('userId');
    if (!userId) return bad(c, 'userId required');
    const userEntity = new UserEntity(c.env, userId);
    if (!await userEntity.exists()) return notFound(c, 'User not found');
    const user = await userEntity.getState();
    const blockedIds = user.blockedUserIds || [];
    if (blockedIds.length === 0) return ok(c, []);
    const blockedUsers = await Promise.all(blockedIds.map(async (id) => {
        const uEntity = new UserEntity(c.env, id);
        if (await uEntity.exists()) {
            const uData = await uEntity.getState();
            const { password, ...safe } = uData;
            return safe;
        }
        return null;
    }));
    return ok(c, blockedUsers.filter(Boolean));
  });
  app.post('/api/users/:id/report', async (c) => {
    const targetId = c.req.param('id');
    const { reporterId, reason, description } = await c.req.json() as { reporterId: string, reason: string, description?: string };
    if (!reporterId || !reason) return bad(c, 'reporterId and reason required');
    const report: Report = {
        id: crypto.randomUUID(),
        reporterId,
        targetId,
        targetType: 'user',
        reason,
        description,
        createdAt: Date.now(),
        status: 'pending'
    };
    const created = await ReportEntity.create(c.env, report);
    return ok(c, created);
  });
  app.post('/api/users/:id/not-interested', async (c) => {
    const id = c.req.param('id');
    const { postId } = await c.req.json() as { postId: string };
    if (!postId) return bad(c, 'postId required');
    const userEntity = new UserEntity(c.env, id);
    if (!await userEntity.exists()) return notFound(c, 'User not found');
    await userEntity.markNotInterested(postId);
    return ok(c, { success: true });
  });
  app.get('/api/users/:id/posts', async (c) => {
    const userId = c.req.param('id');
    await PostEntity.ensureSeed(c.env);
    const page = await PostEntity.list(c.env, null, 100);
    const userPosts = page.items.filter(p => p.userId === userId);
    const userEntity = new UserEntity(c.env, userId);
    const userData = await userEntity.getState();
    const { password, ...safeUser } = userData;
    const hydrated = userPosts.map(p => ({ ...p, user: safeUser }));
    return ok(c, { items: hydrated, next: null });
  });
  app.get('/api/users/:id/liked', async (c) => {
    const userId = c.req.param('id');
    await PostEntity.ensureSeed(c.env);
    const page = await PostEntity.list(c.env, null, 500);
    const likedPosts = page.items.filter(p => p.likedBy?.includes(userId));
    const hydrated = await Promise.all(likedPosts.map(async (post) => {
        if (post.userId) {
            const uEntity = new UserEntity(c.env, post.userId);
            if (await uEntity.exists()) {
                const uData = await uEntity.getState();
                const { password, ...safe } = uData;
                return { ...post, user: safe };
            }
        }
        return post;
    }));
    return ok(c, { items: hydrated });
  });
  app.get('/api/users/:id/saved', async (c) => {
    const userId = c.req.param('id');
    await PostEntity.ensureSeed(c.env);
    const page = await PostEntity.list(c.env, null, 1000);
    const savedPosts = page.items.filter(p => p.savedBy?.includes(userId));
    const hydrated = await Promise.all(savedPosts.map(async (post) => {
        if (post.userId) {
            const uEntity = new UserEntity(c.env, post.userId);
            if (await uEntity.exists()) {
                const uData = await uEntity.getState();
                const { password, ...safe } = uData;
                return { ...post, user: safe };
            }
        }
        return post;
    }));
    return ok(c, { items: hydrated });
  });
  // --- FEED / POSTS ---
  app.get('/api/posts/:id', async (c) => {
    const id = c.req.param('id');
    const postEntity = new PostEntity(c.env, id);
    if (!await postEntity.exists()) return notFound(c, 'Post not found');
    const post = await postEntity.getState();
    if (post.userId) {
        const userEntity = new UserEntity(c.env, post.userId);
        if (await userEntity.exists()) {
            const userData = await userEntity.getState();
            const { password, ...safeUser } = userData;
            post.user = safeUser;
        }
    }
    return ok(c, post);
  });
  app.get('/api/feed', async (c) => {
    await PostEntity.ensureSeed(c.env);
    await UserEntity.ensureSeed(c.env);
    const cq = c.req.query('cursor');
    const lq = c.req.query('limit');
    const userId = c.req.query('userId');
    const type = c.req.query('type'); // 'video', 'audio'
    let hiddenPostIds: string[] = [];
    if (userId) {
        const userEntity = new UserEntity(c.env, userId);
        if (await userEntity.exists()) {
            const u = await userEntity.getState();
            hiddenPostIds = u.notInterestedPostIds || [];
        }
    }
    const page = await PostEntity.list(c.env, cq ?? null, lq ? Math.max(1, (Number(lq) | 0)) : 20);
    let visibleItems = page.items.filter(p => !hiddenPostIds.includes(p.id));
    if (type === 'video' || type === 'audio') {
        visibleItems = visibleItems.filter(p => p.type === type);
    }
    const hydratedPosts = await Promise.all(visibleItems.map(async (post) => {
        if (post.userId) {
            const userEntity = new UserEntity(c.env, post.userId);
            if (await userEntity.exists()) {
                const userData = await userEntity.getState();
                const { password, ...safeUser } = userData;
                return { ...post, user: safeUser };
            }
        }
        return post;
    }));
    hydratedPosts.sort((a, b) => {
        const scoreA = (a.likes * 2) + (a.comments * 3) + ((a.views || 0) * 0.5);
        const scoreB = (b.likes * 2) + (b.comments * 3) + ((b.views || 0) * 0.5);
        if (scoreA === scoreB) {
            return b.createdAt - a.createdAt;
        }
        return scoreB - scoreA;
    });
    return ok(c, { ...page, items: hydratedPosts });
  });
  app.get('/api/feed/following', async (c) => {
    const userId = c.req.query('userId');
    if (!userId) return bad(c, 'userId required');
    const userEntity = new UserEntity(c.env, userId);
    if (!await userEntity.exists()) return notFound(c, 'User not found');
    const user = await userEntity.getState();
    const followingIds = user.followingIds || [];
    if (followingIds.length === 0) {
        return ok(c, { items: [] });
    }
    await PostEntity.ensureSeed(c.env);
    const page = await PostEntity.list(c.env, null, 500);
    const followingPosts = page.items.filter(p => followingIds.includes(p.userId));
    const hydratedPosts = await Promise.all(followingPosts.map(async (post) => {
        if (post.userId) {
            const uEntity = new UserEntity(c.env, post.userId);
            if (await uEntity.exists()) {
                const uData = await uEntity.getState();
                const { password, ...safe } = uData;
                return { ...post, user: safe };
            }
        }
        return post;
    }));
    hydratedPosts.sort((a, b) => b.createdAt - a.createdAt);
    return ok(c, { items: hydratedPosts });
  });
  app.post('/api/posts', async (c) => {
    const system = new SystemEntity(c.env, 'global-settings');
    const settings = await system.getSettings();
    if (settings.readOnlyMode) {
        return c.json({ success: false, error: 'System is currently in read-only mode. New posts are disabled.' }, 503);
    }
    try {
        const body = await c.req.parseBody();
        const type = (body['type'] as string) || 'video';
        const userId = body['userId'] as string;
        const caption = body['caption'] as string || '';
        const tagsStr = body['tags'] as string || '';
        const tags = tagsStr.split(',').map(t => t.trim()).filter(Boolean);
        if (!userId) return bad(c, 'userId required');
        const newPostId = crypto.randomUUID();
        const postEntity = new PostEntity(c.env, newPostId);
        let newPost: Post = {
            id: newPostId,
            userId,
            type: type as 'video' | 'audio',
            caption,
            tags,
            likes: 0,
            likedBy: [],
            saves: 0,
            savedBy: [],
            comments: 0,
            shares: 0,
            views: 0,
            createdAt: Date.now(),
            commentsList: [],
            overlays: []
        };
        if (type === 'audio') {
            const audioFile = body['audioFile'];
            const coverArtFile = body['coverArtFile'];
            const title = body['title'] as string || 'Untitled';
            const artist = body['artist'] as string || 'Unknown Artist';
            if (!audioFile || !(audioFile instanceof File)) {
                return bad(c, 'audioFile required for audio posts');
            }
            const audioUrl = await postEntity.saveAudioBinary(audioFile.stream(), audioFile.type || 'audio/mpeg');
            let coverArtUrl = '';
            if (coverArtFile && coverArtFile instanceof File) {
                // For demo simplicity, convert small cover art to base64.
                // In prod, save as binary similar to video/audio.
                const buffer = await coverArtFile.arrayBuffer();
                const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
                coverArtUrl = `data:${coverArtFile.type};base64,${base64}`;
            }
            newPost = {
                ...newPost,
                audioUrl,
                coverArtUrl,
                title,
                artist,
                videoUrl: '' // Empty for audio posts
            };
        } else {
            // Video Type (Default)
            const demoUrl = body['demoUrl'] as string | undefined;
            const videoFile = body['videoFile'];
            const soundId = body['soundId'] as string || 'default-sound';
            const soundName = body['soundName'] as string || 'Original Audio';
            const filter = body['filter'] as string || 'none';
            const overlaysStr = body['overlays'] as string | undefined;
            const overlays: TextOverlay[] = overlaysStr ? JSON.parse(overlaysStr) : [];
            let servedUrl = '';
            if (demoUrl && typeof demoUrl === 'string' && demoUrl.length > 0) {
                servedUrl = demoUrl;
            } else {
                if (!videoFile || !(videoFile instanceof File)) {
                    return bad(c, 'videoFile required and must be a file');
                }
                servedUrl = await postEntity.saveVideoBinary(videoFile.stream(), videoFile.type || 'video/mp4');
            }
            newPost = {
                ...newPost,
                videoUrl: servedUrl,
                soundId,
                soundName,
                filter,
                overlays
            };
        }
        const created = await PostEntity.create(c.env, newPost);
        return ok(c, created);
    } catch (e) {
        console.error("Upload error:", e);
        return bad(c, 'Failed to process upload: ' + (e instanceof Error ? e.message : String(e)));
    }
  });
  app.get('/api/content/video/:id', async (c) => {
    const id = c.req.param('id');
    const postEntity = new PostEntity(c.env, id);
    try {
      const meta = await postEntity.getVideoMetadata();
      if (!meta) {
        return notFound(c, 'Video content not found');
      }
      const { size: totalSize, mimeType, format } = meta;
      const rangeHeader = c.req.header('Range');
      let start = 0;
      let end = totalSize - 1;
      if (rangeHeader) {
        const bytesPrefix = "bytes=";
        if (rangeHeader.startsWith(bytesPrefix)) {
            const rangeValue = rangeHeader.substring(bytesPrefix.length);
            const parts = rangeValue.split("-");
            if (parts[0]) {
                start = parseInt(parts[0], 10);
            }
            if (parts[1]) {
                end = parseInt(parts[1], 10);
            }
        }
      }
      if (start >= totalSize || end >= totalSize) {
         return c.text('Requested Range Not Satisfiable', 416, {
             'Content-Range': `bytes */${totalSize}`
         });
      }
      const chunkSize = (format === 'binary') ? 128 * 1024 : 100 * 1024;
      const contentLength = end - start + 1;
      const stream = new ReadableStream({
        async start(controller) {
          const startChunk = Math.floor(start / chunkSize);
          const endChunk = Math.floor(end / chunkSize);
          let currentPos = startChunk * chunkSize;
          for (let i = startChunk; i <= endChunk; i++) {
            const chunkData = await postEntity.getVideoChunk(i);
            if (!chunkData) {
              controller.error(new Error(`Missing chunk ${i}`));
              return;
            }
            let sliceStart = 0;
            let sliceEnd = chunkData.length;
            if (i === startChunk) {
              sliceStart = start - currentPos;
            }
            if (i === endChunk) {
               sliceEnd = (end - currentPos) + 1;
            }
            sliceStart = Math.max(0, sliceStart);
            sliceEnd = Math.min(chunkData.length, sliceEnd);
            if (sliceStart < sliceEnd) {
                controller.enqueue(chunkData.slice(sliceStart, sliceEnd));
            }
            currentPos += chunkData.length;
          }
          controller.close();
        }
      });
      return new Response(stream, {
        status: 206,
        headers: {
          'Content-Range': `bytes ${start}-${end}/${totalSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': contentLength.toString(),
          'Content-Type': mimeType,
          'Cache-Control': 'public, max-age=31536000'
        }
      });
    } catch (e) {
      console.error("Failed to serve video", e);
      return c.json({ success: false, error: 'Failed to load video' }, 500);
    }
  });
  app.get('/api/content/audio/:id', async (c) => {
    const id = c.req.param('id');
    const postEntity = new PostEntity(c.env, id);
    try {
      const meta = await postEntity.getAudioMetadata();
      if (!meta) {
        return notFound(c, 'Audio content not found');
      }
      const { size: totalSize, mimeType } = meta;
      const rangeHeader = c.req.header('Range');
      let start = 0;
      let end = totalSize - 1;
      if (rangeHeader) {
        const bytesPrefix = "bytes=";
        if (rangeHeader.startsWith(bytesPrefix)) {
            const rangeValue = rangeHeader.substring(bytesPrefix.length);
            const parts = rangeValue.split("-");
            if (parts[0]) {
                start = parseInt(parts[0], 10);
            }
            if (parts[1]) {
                end = parseInt(parts[1], 10);
            }
        }
      }
      if (start >= totalSize || end >= totalSize) {
         return c.text('Requested Range Not Satisfiable', 416, {
             'Content-Range': `bytes */${totalSize}`
         });
      }
      const chunkSize = 128 * 1024;
      const contentLength = end - start + 1;
      const stream = new ReadableStream({
        async start(controller) {
          const startChunk = Math.floor(start / chunkSize);
          const endChunk = Math.floor(end / chunkSize);
          let currentPos = startChunk * chunkSize;
          for (let i = startChunk; i <= endChunk; i++) {
            const chunkData = await postEntity.getAudioChunk(i);
            if (!chunkData) {
              controller.error(new Error(`Missing chunk ${i}`));
              return;
            }
            let sliceStart = 0;
            let sliceEnd = chunkData.length;
            if (i === startChunk) {
              sliceStart = start - currentPos;
            }
            if (i === endChunk) {
               sliceEnd = (end - currentPos) + 1;
            }
            sliceStart = Math.max(0, sliceStart);
            sliceEnd = Math.min(chunkData.length, sliceEnd);
            if (sliceStart < sliceEnd) {
                controller.enqueue(chunkData.slice(sliceStart, sliceEnd));
            }
            currentPos += chunkData.length;
          }
          controller.close();
        }
      });
      return new Response(stream, {
        status: 206,
        headers: {
          'Content-Range': `bytes ${start}-${end}/${totalSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': contentLength.toString(),
          'Content-Type': mimeType,
          'Cache-Control': 'public, max-age=31536000'
        }
      });
    } catch (e) {
      console.error("Failed to serve audio", e);
      return c.json({ success: false, error: 'Failed to load audio' }, 500);
    }
  });
  app.put('/api/posts/:id', async (c) => {
    const id = c.req.param('id');
    const { userId, caption, tags } = await c.req.json() as { userId?: string; caption?: string; tags?: string[] };
    if (!userId) return bad(c, 'userId required');
    const postEntity = new PostEntity(c.env, id);
    if (!await postEntity.exists()) return notFound(c, 'Post not found');
    const post = await postEntity.getState();
    if (post.userId !== userId) {
        const userEntity = new UserEntity(c.env, userId);
        if (!await userEntity.exists()) return bad(c, 'User not found');
        const user = await userEntity.getState();
        if (!user.isAdmin) return bad(c, 'Unauthorized');
    }
    const updated = await postEntity.mutate(s => ({
        ...s,
        caption: caption !== undefined ? caption : s.caption,
        tags: tags !== undefined ? tags : s.tags
    }));
    const authorEntity = new UserEntity(c.env, updated.userId);
    const authorData = await authorEntity.getState();
    const { password, ...safeAuthor } = authorData;
    return ok(c, { ...updated, user: safeAuthor });
  });
  app.delete('/api/posts/:id', async (c) => {
    const id = c.req.param('id');
    const { userId } = await c.req.json() as { userId?: string };
    if (!userId) return bad(c, 'userId required');
    const postEntity = new PostEntity(c.env, id);
    if (!await postEntity.exists()) return notFound(c, 'Post not found');
    const post = await postEntity.getState();
    const userEntity = new UserEntity(c.env, userId);
    const user = await userEntity.getState();
    if (post.userId !== userId && !user.isAdmin) {
        return bad(c, 'Unauthorized');
    }
    await PostEntity.delete(c.env, id);
    return ok(c, { deleted: true });
  });
  app.post('/api/posts/:id/report', async (c) => {
    const targetId = c.req.param('id');
    const { reporterId, reason, description } = await c.req.json() as { reporterId: string, reason: string, description?: string };
    if (!reporterId || !reason) return bad(c, 'reporterId and reason required');
    const report: Report = {
        id: crypto.randomUUID(),
        reporterId,
        targetId,
        targetType: 'post',
        reason,
        description,
        createdAt: Date.now(),
        status: 'pending'
    };
    const created = await ReportEntity.create(c.env, report);
    return ok(c, created);
  });
  app.post('/api/posts/:id/like', async (c) => {
    const id = c.req.param('id');
    const { userId } = await c.req.json() as { userId?: string };
    if (!userId) return bad(c, 'userId required');
    const postEntity = new PostEntity(c.env, id);
    if (!await postEntity.exists()) return notFound(c, 'Post not found');
    const result = await postEntity.toggleLike(userId);
    if (result.isLiked) {
        const post = await postEntity.getState();
        if (post.userId !== userId) {
            const targetUserEntity = new UserEntity(c.env, post.userId);
            const targetUser = await targetUserEntity.getState();
            const notificationsPaused = targetUser.settings?.notifications?.paused;
            const interactionsNotif = targetUser.settings?.notifications?.interactions !== false;
            if (!notificationsPaused && interactionsNotif) {
                const notif: Notification = {
                    id: crypto.randomUUID(),
                    userId: post.userId,
                    actorId: userId,
                    type: 'like',
                    postId: id,
                    read: false,
                    createdAt: Date.now()
                };
                await NotificationEntity.create(c.env, notif);
            }
            // Echoes Reward (50 for like)
            await targetUserEntity.addEchoes(50);
        }
    }
    return ok(c, result);
  });
  app.post('/api/posts/:id/save', async (c) => {
    const id = c.req.param('id');
    const { userId } = await c.req.json() as { userId?: string };
    if (!userId) return bad(c, 'userId required');
    const postEntity = new PostEntity(c.env, id);
    if (!await postEntity.exists()) return notFound(c, 'Post not found');
    const result = await postEntity.toggleSave(userId);
    return ok(c, result);
  });
  app.post('/api/posts/:id/share', async (c) => {
    const id = c.req.param('id');
    const postEntity = new PostEntity(c.env, id);
    if (!await postEntity.exists()) return notFound(c, 'Post not found');
    const shares = await postEntity.incrementShares();
    return ok(c, { shares });
  });
  app.post('/api/posts/:id/view', async (c) => {
    const id = c.req.param('id');
    const postEntity = new PostEntity(c.env, id);
    if (!await postEntity.exists()) return notFound(c, 'Post not found');
    const views = await postEntity.incrementViews();
    // Echoes Reward (25 for view)
    const post = await postEntity.getState();
    if (post.userId) {
        const authorEntity = new UserEntity(c.env, post.userId);
        await authorEntity.addEchoes(25);
    }
    return ok(c, { views });
  });
  // --- COMMENTS ---
  app.get('/api/posts/:id/comments', async (c) => {
    const id = c.req.param('id');
    const post = new PostEntity(c.env, id);
    if (!await post.exists()) return notFound(c, 'Post not found');
    const comments = await post.getComments();
    return ok(c, comments);
  });
  app.post('/api/posts/:id/comments', async (c) => {
    const id = c.req.param('id');
    const { userId, text } = await c.req.json() as { userId?: string; text?: string };
    if (!userId || !text?.trim()) return bad(c, 'userId and text required');
    const postEntity = new PostEntity(c.env, id);
    if (!await postEntity.exists()) return notFound(c, 'Post not found');
    const userEntity = new UserEntity(c.env, userId);
    if (!await userEntity.exists()) return bad(c, 'User not found');
    const userData = await userEntity.getState();
    const { password, ...safeUser } = userData;
    const comment = await postEntity.addComment(userId, text.trim(), safeUser);
    const post = await postEntity.getState();
    if (post.userId !== userId) {
        const targetUserEntity = new UserEntity(c.env, post.userId);
        const targetUser = await targetUserEntity.getState();
        const notificationsPaused = targetUser.settings?.notifications?.paused;
        const interactionsNotif = targetUser.settings?.notifications?.interactions !== false;
        if (!notificationsPaused && interactionsNotif) {
            const notif: Notification = {
                id: crypto.randomUUID(),
                userId: post.userId,
                actorId: userId,
                type: 'comment',
                postId: id,
                read: false,
                createdAt: Date.now()
            };
            await NotificationEntity.create(c.env, notif);
        }
        // Echoes Reward (75 for comment)
        await targetUserEntity.addEchoes(75);
    }
    return ok(c, comment);
  });
  app.delete('/api/posts/:id/comments/:commentId', async (c) => {
    const postId = c.req.param('id');
    const commentId = c.req.param('commentId');
    const { userId } = await c.req.json() as { userId?: string };
    if (!userId) return bad(c, 'userId required');
    const postEntity = new PostEntity(c.env, postId);
    if (!await postEntity.exists()) return notFound(c, 'Post not found');
    const post = await postEntity.getState();
    const comment = post.commentsList?.find(c => c.id === commentId);
    if (!comment) return notFound(c, 'Comment not found');
    let isAuthorized = false;
    if (comment.userId === userId) isAuthorized = true;
    else if (post.userId === userId) isAuthorized = true;
    else {
        const userEntity = new UserEntity(c.env, userId);
        if (await userEntity.exists()) {
            const user = await userEntity.getState();
            if (user.isAdmin) isAuthorized = true;
        }
    }
    if (!isAuthorized) return bad(c, 'Unauthorized');
    const deleted = await postEntity.deleteComment(commentId);
    return ok(c, { deleted });
  });
  app.post('/api/posts/:id/comments/:commentId/like', async (c) => {
    const id = c.req.param('id');
    const commentId = c.req.param('commentId');
    const { userId } = await c.req.json() as { userId?: string };
    if (!userId) return bad(c, 'userId required');
    const postEntity = new PostEntity(c.env, id);
    if (!await postEntity.exists()) return notFound(c, 'Post not found');
    const result = await postEntity.toggleCommentLike(commentId, userId);
    if (!result) return notFound(c, 'Comment not found');
    return ok(c, result);
  });
  // --- NOTIFICATIONS ---
  app.get('/api/notifications', async (c) => {
    const userId = c.req.query('userId');
    if (!userId) return bad(c, 'userId required');
    const notifications = await NotificationEntity.listForUser(c.env, userId);
    const hydrated = await Promise.all(notifications.map(async (n) => {
        const actorEntity = new UserEntity(c.env, n.actorId);
        let actor: User | undefined;
        if (await actorEntity.exists()) {
            const aData = await actorEntity.getState();
            const { password, ...safe } = aData;
            actor = safe;
        }
        let post: Post | undefined;
        if (n.postId) {
            const postEntity = new PostEntity(c.env, n.postId);
            if (await postEntity.exists()) {
                post = await postEntity.getState();
            }
        }
        return { ...n, actor, post };
    }));
    return ok(c, hydrated);
  });
  app.get('/api/notifications/unread-count', async (c) => {
    const userId = c.req.query('userId');
    if (!userId) return bad(c, 'userId required');
    const notifications = await NotificationEntity.listForUser(c.env, userId, 100);
    const count = notifications.filter(n => !n.read).length;
    return ok(c, { count });
  });
  app.post('/api/notifications/mark-read', async (c) => {
    const { userId } = await c.req.json() as { userId: string };
    if (!userId) return bad(c, 'userId required');
    await NotificationEntity.markAllRead(c.env, userId);
    return ok(c, { success: true });
  });
  // --- CHATS ---
  app.get('/api/chats', async (c) => {
    await ChatBoardEntity.ensureSeed(c.env);
    await UserEntity.ensureSeed(c.env);
    const cq = c.req.query('cursor');
    const lq = c.req.query('limit');
    const userId = c.req.query('userId');
    const page = await ChatBoardEntity.list(c.env, cq ?? null, lq ? Math.max(1, (Number(lq) | 0)) : undefined);
    if (userId) {
        const filteredItems = page.items.filter(chat => {
            // Visibility Logic:
            // 1. If user is participant, always show.
            // 2. If visibility is 'public', show.
            // 3. If visibility is 'private', hide unless participant.
            const isParticipant = chat.participants?.includes(userId);
            if (isParticipant) return true;
            if (chat.visibility === 'public') return true;
            return false;
        });
        return ok(c, { ...page, items: filteredItems });
    }
    return ok(c, page);
  });
  app.post('/api/chats', async (c) => {
    const { title, visibility, canType, ownerId } = (await c.req.json()) as {
        title?: string;
        visibility?: 'public' | 'private';
        canType?: 'all' | 'participants' | 'admin';
        ownerId?: string; // Passed from frontend or inferred? Better to infer from context if we had auth middleware, but here we trust input or require it.
    };
    // In a real app, we'd get ownerId from the authenticated session.
    // Here we assume the frontend sends the creator's ID as ownerId if available, or we might need to pass it.
    // Let's assume the frontend sends `ownerId` (which is the creator).
    if (!title?.trim()) return bad(c, 'title required');
    const created = await ChatBoardEntity.create(c.env, {
        id: crypto.randomUUID(),
        title: title.trim(),
        messages: [],
        participants: ownerId ? [ownerId] : [],
        type: 'group',
        updatedAt: Date.now(),
        visibility: visibility || 'private',
        canType: canType || 'all',
        ownerId: ownerId || ''
    });
    return ok(c, { id: created.id, title: created.title });
  });
  app.put('/api/chats/:chatId', async (c) => {
    const chatId = c.req.param('chatId');
    const { title, visibility, canType, userId } = await c.req.json() as {
        title?: string;
        visibility?: 'public' | 'private';
        canType?: 'all' | 'participants' | 'admin';
        userId: string; // Requester ID
    };
    const chatEntity = new ChatBoardEntity(c.env, chatId);
    if (!await chatEntity.exists()) return notFound(c, 'Chat not found');
    const chat = await chatEntity.getState();
    // Only owner can update settings
    if (chat.ownerId && chat.ownerId !== userId) {
        return bad(c, 'Unauthorized: Only the owner can update chat settings');
    }
    const updates: Partial<Chat> = {};
    if (title !== undefined) updates.title = title;
    if (visibility !== undefined) updates.visibility = visibility;
    if (canType !== undefined) updates.canType = canType;
    const updated = await chatEntity.updateSettings(updates);
    return ok(c, updated);
  });
  app.post('/api/chats/direct', async (c) => {
    const { currentUserId, targetUserId } = await c.req.json() as { currentUserId: string, targetUserId: string };
    if (!currentUserId || !targetUserId) return bad(c, 'currentUserId and targetUserId required');
    const currentUserEntity = new UserEntity(c.env, currentUserId);
    if (!await currentUserEntity.exists()) return notFound(c, 'Current user not found');
    const currentUser = await currentUserEntity.getState();
    const existingChatId = currentUser.directMessages?.[targetUserId];
    if (existingChatId) {
        return ok(c, { id: existingChatId });
    }
    const newChatId = crypto.randomUUID();
    const chat = new ChatBoardEntity(c.env, newChatId);
    await chat.save({
        id: newChatId,
        title: 'Direct Message',
        participants: [currentUserId, targetUserId],
        type: 'dm',
        messages: [],
        updatedAt: Date.now(),
        visibility: 'private',
        canType: 'participants',
        ownerId: currentUserId
    });
    await currentUserEntity.addDirectMessage(targetUserId, newChatId);
    const targetUserEntity = new UserEntity(c.env, targetUserId);
    if (await targetUserEntity.exists()) {
        await targetUserEntity.addDirectMessage(currentUserId, newChatId);
    }
    return ok(c, { id: newChatId });
  });
  app.get('/api/chats/:chatId/messages', async (c) => {
    const chat = new ChatBoardEntity(c.env, c.req.param('chatId'));
    if (!await chat.exists()) return notFound(c, 'chat not found');
    return ok(c, await chat.listMessages());
  });
  app.post('/api/chats/:chatId/messages', async (c) => {
    const chatId = c.req.param('chatId');
    const { userId, text, mediaUrl, mediaType } = (await c.req.json()) as { userId?: string; text?: string; mediaUrl?: string; mediaType?: 'image' | 'video' };
    if (!isStr(userId) || (!text?.trim() && !mediaUrl)) return bad(c, 'userId and content required');
    const chatEntity = new ChatBoardEntity(c.env, chatId);
    if (!await chatEntity.exists()) return notFound(c, 'chat not found');
    const chat = await chatEntity.getState();
    // Permission Check
    if (chat.canType === 'participants') {
        if (!chat.participants?.includes(userId)) {
            return c.json({ success: false, error: 'Only participants can send messages in this chat' }, 403);
        }
    } else if (chat.canType === 'admin') {
        if (chat.ownerId !== userId) {
            return c.json({ success: false, error: 'Only the admin can send messages in this chat' }, 403);
        }
    }
    return ok(c, await chatEntity.sendMessage(userId, text?.trim() || '', mediaUrl, mediaType));
  });

  // --- ECONOMY ---
  app.post('/api/posts/:id/gift', async (c) => {
    const postId = c.req.param('id');
    const { senderId, amount } = await c.req.json() as { senderId: string, amount: number };
    if (!senderId || !amount || amount <= 0) return bad(c, 'Invalid sender or amount');

    const postEntity = new PostEntity(c.env, postId);
    if (!await postEntity.exists()) return notFound(c, 'Post not found');
    const post = await postEntity.getState();

    const senderEntity = new UserEntity(c.env, senderId);
    if (!await senderEntity.exists()) return notFound(c, 'Sender not found');

    const authorEntity = new UserEntity(c.env, post.userId);
    if (!await authorEntity.exists()) return notFound(c, 'Author not found');

    try {
        const newBalance = await senderEntity.deductEchoes(amount);
        await authorEntity.addEchoes(amount);
        
        // Notify author
        const notif: Notification = {
            id: crypto.randomUUID(),
            userId: post.userId,
            actorId: senderId,
            type: 'gift',
            postId: postId,
            read: false,
            createdAt: Date.now(),
            data: { amount }
        };
        await NotificationEntity.create(c.env, notif);

        return ok(c, { success: true, newBalance });
    } catch (e) {
        return bad(c, e instanceof Error ? e.message : 'Transaction failed');
    }
  });

  app.post('/api/users/:id/purchase-decoration', async (c) => {
    const userId = c.req.param('id');
    const { decorationId, cost } = await c.req.json() as { decorationId: string, cost: number };
    
    if (!decorationId || cost === undefined) return bad(c, 'Invalid decoration or cost');

    const userEntity = new UserEntity(c.env, userId);
    if (!await userEntity.exists()) return notFound(c, 'User not found');

    try {
        const updatedUser = await userEntity.purchaseDecoration(decorationId, cost);
        const { password, ...safeUser } = updatedUser;
        return ok(c, safeUser);
    } catch (e) {
        return bad(c, e instanceof Error ? e.message : 'Purchase failed');
    }
  });
}