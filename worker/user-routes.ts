import { Hono } from "hono";
import type { Env } from './core-utils';
import { UserEntity, ChatBoardEntity, PostEntity } from "./entities";
import { ok, bad, notFound, isStr } from './core-utils';
import type { User } from "@shared/types";
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
      password: password.trim(), // In a real app, hash this!
      bio: bio?.trim() || 'New to Pulse',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
      followers: 0,
      following: 0
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
    // Simple password check (plain text for this phase as per constraints, ideally hashed)
    // Also allow login for seed users who might not have passwords set in the seed data (optional fallback)
    if (!user || (user.password && user.password !== password)) {
      // If it's a seed user without a password, we might allow it for demo purposes, 
      // but let's enforce security if a password exists.
      // For seed users (u1, u2, etc) they don't have passwords in seedData.
      // Let's assume seed users can be logged in with ANY password for now to unblock testing,
      // OR we require them to have passwords. 
      // Better: If user has NO password (seed), allow. If user HAS password, check it.
      if (user && user.password && user.password !== password) {
         return bad(c, 'Invalid credentials');
      }
      if (!user) {
        return bad(c, 'User not found');
      }
    }
    const { password: _, ...safeUser } = user;
    return ok(c, safeUser);
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
  app.post('/api/users/:id/follow', async (c) => {
    const id = c.req.param('id');
    const { currentUserId } = await c.req.json() as { currentUserId?: string };
    if (!currentUserId) return bad(c, 'currentUserId required');
    const targetUser = new UserEntity(c.env, id);
    if (!await targetUser.exists()) return notFound(c, 'User not found');
    // Increment followers on target
    await targetUser.mutate(s => ({ ...s, followers: (s.followers || 0) + 1 }));
    // Increment following on current user
    const currentUser = new UserEntity(c.env, currentUserId);
    if (await currentUser.exists()) {
        await currentUser.mutate(s => ({ ...s, following: (s.following || 0) + 1 }));
    }
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
  app.post('/api/posts', async (c) => {
    const body = await c.req.json() as { videoUrl?: string; caption?: string; userId?: string };
    if (!body.videoUrl || !body.userId) {
        return bad(c, 'videoUrl and userId are required');
    }
    // SQLite DOs can handle large values, so we can store the base64 string directly.
    // In a production app, we'd use R2, but for this demo/template constraint, this works.
    const newPost = {
        id: crypto.randomUUID(),
        userId: body.userId,
        videoUrl: body.videoUrl,
        caption: body.caption || '',
        likes: 0,
        comments: 0,
        shares: 0,
        createdAt: Date.now(),
        tags: []
    };
    const created = await PostEntity.create(c.env, newPost);
    return ok(c, created);
  });
  app.post('/api/posts/:id/like', async (c) => {
    const id = c.req.param('id');
    const post = new PostEntity(c.env, id);
    if (!await post.exists()) return notFound(c, 'Post not found');
    const updated = await post.mutate(s => ({ ...s, likes: s.likes + 1 }));
    return ok(c, updated);
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