import { Hono } from "hono";
import type { Env } from './core-utils';
import { UserEntity, ChatBoardEntity, PostEntity } from "./entities";
import { ok, bad, notFound, isStr } from './core-utils';
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  app.get('/api/test', (c) => c.json({ success: true, data: { name: 'Pulse API' }}));
  // USERS
  app.get('/api/users', async (c) => {
    await UserEntity.ensureSeed(c.env);
    const cq = c.req.query('cursor');
    const lq = c.req.query('limit');
    const page = await UserEntity.list(c.env, cq ?? null, lq ? Math.max(1, (Number(lq) | 0)) : undefined);
    return ok(c, page);
  });
  app.get('/api/users/:id', async (c) => {
    const id = c.req.param('id');
    const user = new UserEntity(c.env, id);
    if (!await user.exists()) return notFound(c, 'User not found');
    return ok(c, await user.getState());
  });
  app.post('/api/users', async (c) => {
    const { name } = (await c.req.json()) as { name?: string };
    if (!name?.trim()) return bad(c, 'name required');
    return ok(c, await UserEntity.create(c.env, { id: crypto.randomUUID(), name: name.trim() }));
  });
  app.get('/api/users/:id/posts', async (c) => {
    const userId = c.req.param('id');
    // In a real app, we would use an index. For this demo, we list all and filter.
    // Ensure seeds exist first
    await PostEntity.ensureSeed(c.env);
    const page = await PostEntity.list(c.env, null, 100); // Fetch up to 100 posts to filter
    const userPosts = page.items.filter(p => p.userId === userId);
    // Hydrate with user data (though we know the user)
    const userEntity = new UserEntity(c.env, userId);
    const userData = await userEntity.getState();
    const hydrated = userPosts.map(p => ({ ...p, user: userData }));
    return ok(c, { items: hydrated, next: null });
  });
  // FEED / POSTS
  app.get('/api/feed', async (c) => {
    await PostEntity.ensureSeed(c.env);
    await UserEntity.ensureSeed(c.env); // Ensure users exist for hydration
    const cq = c.req.query('cursor');
    const lq = c.req.query('limit');
    const page = await PostEntity.list(c.env, cq ?? null, lq ? Math.max(1, (Number(lq) | 0)) : 10);
    // Hydrate posts with user data
    const hydratedPosts = await Promise.all(page.items.map(async (post) => {
        if (post.userId) {
            const userEntity = new UserEntity(c.env, post.userId);
            if (await userEntity.exists()) {
                const userData = await userEntity.getState();
                return { ...post, user: userData };
            }
        }
        return post;
    }));
    return ok(c, { ...page, items: hydratedPosts });
  });
  app.post('/api/posts', async (c) => {
    const body = await c.req.json() as { videoUrl?: string; caption?: string; userId?: string };
    if (!body.videoUrl || !body.userId) {
        return bad(c, 'videoUrl and userId are required');
    }
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
  // CHATS
  app.get('/api/chats', async (c) => {
    await ChatBoardEntity.ensureSeed(c.env);
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
  // MESSAGES
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