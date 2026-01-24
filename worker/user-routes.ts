import { Hono } from "hono";
import type { Env } from './core-utils';
import { UserEntity, ChatBoardEntity, PostEntity, NotificationEntity, ReportEntity } from "./entities";
import { ok, bad, notFound, isStr } from './core-utils';
import type { User, Notification, Post, Report } from "@shared/types";
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  app.get('/api/test', (c) => c.json({ success: true, data: { name: 'Pulse API' }}));
  // --- AUTHENTICATION ---
  app.post('/api/auth/signup', async (c) => {
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
      displayName: username.trim(), // Initialize displayName with username
      password: password.trim(), // In a real app, hash this!
      bio: bio?.trim() || 'New to Pulse',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
      followers: 0,
      following: 0,
      followingIds: [],
      avatarDecoration: 'none',
      bannerStyle: 'default',
      isAdmin: false,
      isVerified: false,
      bannedUntil: 0,
      banReason: "",
      bannedBy: "",
      blockedUserIds: []
    };
    const created = await UserEntity.create(c.env, newUser);
    // Don't return password
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
    // Check if banned
    if (user.bannedUntil && user.bannedUntil > Date.now()) {
        return bad(c, `Account suspended until ${new Date(user.bannedUntil).toLocaleDateString()}. Reason: ${user.banReason || 'Violation of terms'}`);
    }
    const { password: _, ...safeUser } = user;
    return ok(c, safeUser);
  });
  // --- ADMIN ---
  app.put('/api/admin/users/:id', async (c) => {
    const id = c.req.param('id');
    const { followers, avatarDecoration, isVerified, bannedUntil, banReason, name, isAdmin, bannedBy, bio, avatar, bannerStyle } = await c.req.json() as Partial<User>;
    const userEntity = new UserEntity(c.env, id);
    if (!await userEntity.exists()) {
      return notFound(c, 'User not found');
    }
    const updates: Partial<User> = {};
    if (followers !== undefined) updates.followers = followers;
    if (avatarDecoration !== undefined) updates.avatarDecoration = avatarDecoration;
    if (bannerStyle !== undefined) updates.bannerStyle = bannerStyle;
    if (isVerified !== undefined) updates.isVerified = isVerified;
    if (bannedUntil !== undefined) updates.bannedUntil = bannedUntil;
    if (banReason !== undefined) updates.banReason = banReason;
    if (isAdmin !== undefined) updates.isAdmin = isAdmin;
    if (bannedBy !== undefined) updates.bannedBy = bannedBy;
    if (bio !== undefined) updates.bio = bio;
    if (avatar !== undefined) updates.avatar = avatar;
    // Admin can still force update name if absolutely necessary, but generally discouraged
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
    // Hydrate reports
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
    if (!q || q.trim().length === 0) {
      return ok(c, { users: [], posts: [] });
    }
    const query = q.trim();
    const [users, posts] = await Promise.all([
      UserEntity.search(c.env, query),
      PostEntity.search(c.env, query)
    ]);
    // Hydrate posts with user data
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
    // Strip passwords from users
    const safeUsers = users.map(u => {
        const { password, ...rest } = u;
        return rest;
    });
    return ok(c, { users: safeUsers, posts: hydratedPosts });
  });
  app.get('/api/feed/trending', async (c) => {
    await PostEntity.ensureSeed(c.env);
    await UserEntity.ensureSeed(c.env);
    // Get all posts (limit 100 for demo)
    const page = await PostEntity.list(c.env, null, 100);
    // Sort by likes descending
    const sortedPosts = page.items.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    // Hydrate
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
  // --- USERS ---
  app.get('/api/users', async (c) => {
    await UserEntity.ensureSeed(c.env);
    const cq = c.req.query('cursor');
    const lq = c.req.query('limit');
    const page = await UserEntity.list(c.env, cq ?? null, lq ? Math.max(1, (Number(lq) | 0)) : undefined);
    // Strip passwords
    const safeItems = page.items.map(u => {
      const { password, ...rest } = u;
      return rest;
    });
    return ok(c, { ...page, items: safeItems });
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
    // We do NOT extract 'name' here to prevent username changes
    const { displayName, bio, avatar, avatarDecoration, bannerStyle } = await c.req.json() as { displayName?: string; bio?: string; avatar?: string; avatarDecoration?: string; bannerStyle?: string };
    if (displayName !== undefined && !displayName.trim()) {
      return bad(c, 'Display Name cannot be empty');
    }
    const userEntity = new UserEntity(c.env, id);
    if (!await userEntity.exists()) {
      return notFound(c, 'User not found');
    }
    const updated = await userEntity.mutate(s => ({
      ...s,
      displayName: displayName?.trim() || s.displayName || s.name, // Update display name
      bio: bio?.trim() ?? s.bio,
      avatar: avatar || s.avatar, // Keep existing if not provided
      avatarDecoration: avatarDecoration || s.avatarDecoration,
      bannerStyle: bannerStyle || s.bannerStyle
    }));
    const { password, ...safeUser } = updated;
    return ok(c, safeUser);
  });
  // Delete User (Self)
  app.delete('/api/users/:id', async (c) => {
    const id = c.req.param('id');
    const { currentUserId } = await c.req.json() as { currentUserId?: string };
    if (!currentUserId) {
        return bad(c, 'currentUserId required');
    }
    // Check authorization: User can delete themselves, or Admin can delete anyone
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
  // Toggle Follow
  app.post('/api/users/:id/follow', async (c) => {
    const targetId = c.req.param('id');
    const { currentUserId } = await c.req.json() as { currentUserId?: string };
    if (!currentUserId) return bad(c, 'currentUserId required');
    if (currentUserId === targetId) return bad(c, 'Cannot follow yourself');
    const currentUserEntity = new UserEntity(c.env, currentUserId);
    if (!await currentUserEntity.exists()) return notFound(c, 'Current user not found');
    const targetUserEntity = new UserEntity(c.env, targetId);
    if (!await targetUserEntity.exists()) return notFound(c, 'Target user not found');
    // Mutate current user (update following list and count)
    const updatedCurrentUser = await currentUserEntity.mutate(user => {
        const followingIds = user.followingIds || [];
        const isFollowing = followingIds.includes(targetId);
        let newFollowingIds;
        let followingCountChange = 0;
        if (isFollowing) {
            // Unfollow
            newFollowingIds = followingIds.filter(id => id !== targetId);
            followingCountChange = -1;
        } else {
            // Follow
            newFollowingIds = [...followingIds, targetId];
            followingCountChange = 1;
        }
        return {
            ...user,
            followingIds: newFollowingIds,
            following: Math.max(0, (user.following || 0) + followingCountChange)
        };
    });
    // Mutate target user (update followers count)
    await targetUserEntity.mutate(user => {
        const isFollowingNow = updatedCurrentUser.followingIds?.includes(targetId);
        const change = isFollowingNow ? 1 : -1;
        return {
            ...user,
            followers: Math.max(0, (user.followers || 0) + change)
        };
    });
    // Create Notification if followed
    if (updatedCurrentUser.followingIds?.includes(targetId)) {
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
  // Block User
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
  // Get Blocked Users
  app.get('/api/users/blocked', async (c) => {
    const userId = c.req.query('userId');
    if (!userId) return bad(c, 'userId required');
    const userEntity = new UserEntity(c.env, userId);
    if (!await userEntity.exists()) return notFound(c, 'User not found');
    const user = await userEntity.getState();
    const blockedIds = user.blockedUserIds || [];
    if (blockedIds.length === 0) return ok(c, []);
    // Fetch details for blocked users
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
  // Report User
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
    // Hydrate posts with their authors
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
  // --- FEED / POSTS ---
  app.get('/api/feed', async (c) => {
    await PostEntity.ensureSeed(c.env);
    await UserEntity.ensureSeed(c.env);
    const cq = c.req.query('cursor');
    const lq = c.req.query('limit');
    // Fetch more posts to ensure we have enough valid ones
    const page = await PostEntity.list(c.env, cq ?? null, lq ? Math.max(1, (Number(lq) | 0)) : 20);
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
    // Sort by newest first
    hydratedPosts.sort((a, b) => b.createdAt - a.createdAt);
    return ok(c, { ...page, items: hydratedPosts });
  });
  // Following Feed
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
    // Fetch posts and filter by followingIds
    await PostEntity.ensureSeed(c.env);
    const page = await PostEntity.list(c.env, null, 500); // Fetch larger batch to filter
    const followingPosts = page.items.filter(p => followingIds.includes(p.userId));
    // Hydrate
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
    // Sort by newest
    hydratedPosts.sort((a, b) => b.createdAt - a.createdAt);
    return ok(c, { items: hydratedPosts });
  });
  app.post('/api/posts', async (c) => {
    const body = await c.req.json() as { videoUrl?: string; caption?: string; userId?: string; tags?: string[] };
    if (!body.videoUrl || !body.userId) {
        return bad(c, 'videoUrl and userId are required');
    }
    const newPost = {
        id: crypto.randomUUID(),
        userId: body.userId,
        videoUrl: body.videoUrl,
        caption: body.caption || '',
        likes: 0,
        likedBy: [],
        comments: 0,
        shares: 0,
        views: 0,
        createdAt: Date.now(),
        tags: body.tags || [],
        commentsList: []
    };
    const created = await PostEntity.create(c.env, newPost);
    return ok(c, created);
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
    // Allow deletion if user is owner OR user is admin
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
    // Create Notification if liked (and not self-like)
    if (result.isLiked) {
        const post = await postEntity.getState();
        if (post.userId !== userId) {
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
    }
    return ok(c, result);
  });
  app.post('/api/posts/:id/view', async (c) => {
    const id = c.req.param('id');
    const postEntity = new PostEntity(c.env, id);
    if (!await postEntity.exists()) return notFound(c, 'Post not found');
    const views = await postEntity.incrementViews();
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
    // Get user details for snapshot
    const userEntity = new UserEntity(c.env, userId);
    if (!await userEntity.exists()) return bad(c, 'User not found');
    const userData = await userEntity.getState();
    const { password, ...safeUser } = userData;
    const comment = await postEntity.addComment(userId, text.trim(), safeUser);
    // Create Notification (if not self-comment)
    const post = await postEntity.getState();
    if (post.userId !== userId) {
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
    return ok(c, comment);
  });
  // --- NOTIFICATIONS ---
  app.get('/api/notifications', async (c) => {
    const userId = c.req.query('userId');
    if (!userId) return bad(c, 'userId required');
    const notifications = await NotificationEntity.listForUser(c.env, userId);
    // Hydrate notifications with actor and post data
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
  // --- CHATS ---
  app.get('/api/chats', async (c) => {
    await ChatBoardEntity.ensureSeed(c.env);
    await UserEntity.ensureSeed(c.env);
    const cq = c.req.query('cursor');
    const lq = c.req.query('limit');
    const page = await ChatBoardEntity.list(c.env, cq ?? null, lq ? Math.max(1, (Number(lq) | 0)) : undefined);
    return ok(c, page);
  });
  app.post('/api/chats', async (c) => {
    const { title } = (await c.req.json()) as { title?: string };
    if (!title?.trim()) return bad(c, 'title required');
    const created = await ChatBoardEntity.create(c.env, { id: crypto.randomUUID(), title: title.trim(), messages: [] });
    return ok(c, { id: created.id, title: created.title });
  });
  app.get('/api/chats/:chatId/messages', async (c) => {
    const chat = new ChatBoardEntity(c.env, c.req.param('chatId'));
    if (!await chat.exists()) return notFound(c, 'chat not found');
    return ok(c, await chat.listMessages());
  });
  app.post('/api/chats/:chatId/messages', async (c) => {
    const chatId = c.req.param('chatId');
    const { userId, text } = (await c.req.json()) as { userId?: string; text?: string };
    if (!isStr(userId) || !text?.trim()) return bad(c, 'userId and text required');
    const chat = new ChatBoardEntity(c.env, chatId);
    if (!await chat.exists()) return notFound(c, 'chat not found');
    return ok(c, await chat.sendMessage(userId, text.trim()));
  });
}