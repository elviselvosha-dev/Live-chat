import express from 'express';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import type {
  DirectMessage,
  FeedPost,
  LiveStream,
  MarketplaceItem,
  ReactionType,
  ReelItem,
  StoreState,
  StoryItem,
  UserProfile,
} from './src/types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const STORE_PATH = path.join(DATA_DIR, 'store.json');

const SEED_STATE: StoreState = {
  users: [
    {
      id: 'user-maya',
      name: 'Maya Lin',
      handle: 'mayalin',
      avatar: '/src/assets/images/avatar_maya_1795260453388.jpg',
      coverPhoto: '/src/assets/images/cover_neighborhood_1795260453679.jpg',
      bio: 'Neighborhood baker, weekend cyclist & community market regular. Sharing local finds and fresh sourdough batches.',
      location: 'Oakwood District',
      work: 'Co-founder at Hearth & Crumb',
      verified: true,
      followers: ['user-marcus', 'user-priya', 'user-carlos'],
      following: ['user-marcus', 'user-priya'],
      joinedAt: '2024-03-14T10:00:00.000Z',
    },
    {
      id: 'user-marcus',
      name: 'Marcus Vance',
      handle: 'marcusv',
      avatar: '/src/assets/images/avatar_marcus_1795260453604.jpg',
      coverPhoto: '/src/assets/images/feed_artisan_market_1795260453896.jpg',
      bio: 'Analog camera collector, commuter bike restorer, and street food enthusiast.',
      location: 'Riverside Heights',
      work: 'Industrial Designer at Studio North',
      verified: true,
      followers: ['user-maya', 'user-priya'],
      following: ['user-maya', 'user-carlos'],
      joinedAt: '2024-01-22T09:15:00.000Z',
    },
    {
      id: 'user-priya',
      name: 'Priya Nair',
      handle: 'priyanair',
      avatar: '/src/assets/images/avatar_maya_1795260453388.jpg',
      coverPhoto: '/src/assets/images/cover_neighborhood_1795260453679.jpg',
      bio: 'Acoustic sessions, local food pop-ups, and zero-waste living tips around the city.',
      location: 'Cedar Park',
      work: 'Community Producer',
      verified: false,
      followers: ['user-maya', 'user-carlos'],
      following: ['user-maya', 'user-marcus'],
      joinedAt: '2024-06-05T14:30:00.000Z',
    },
    {
      id: 'user-carlos',
      name: 'Carlos Rivera',
      handle: 'carlosr',
      avatar: '/src/assets/images/avatar_marcus_1795260453604.jpg',
      coverPhoto: '/src/assets/images/feed_artisan_market_1795260453896.jpg',
      bio: 'Night market grill chef & acoustic guitarist. Catch my live streams on Friday evenings.',
      location: 'Midtown Plaza',
      work: 'Chef at Barrio Grill',
      verified: false,
      followers: ['user-marcus'],
      following: ['user-maya', 'user-priya'],
      joinedAt: '2024-08-19T18:00:00.000Z',
    },
  ],
  posts: [
    {
      id: 'post-1',
      authorId: 'user-maya',
      content:
        'Morning rush at the Oakwood Artisan Market was unreal today! Picked up fresh wildflower bouquets and warm rosemary focaccia before 9 AM. Who else made it out before the sun got high?',
      image: '/src/assets/images/feed_artisan_market_1795260453896.jpg',
      imageSizeKb: 310,
      location: 'Oakwood Market Square',
      createdAt: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
      reactions: {
        like: ['user-marcus', 'user-priya'],
        love: ['user-carlos'],
        haha: [],
        wow: [],
      },
      comments: [
        {
          id: 'c-1',
          authorId: 'user-marcus',
          text: 'Grabbed two loaves from the corner bakery booth — still warm!',
          createdAt: new Date(Date.now() - 1000 * 60 * 28).toISOString(),
        },
        {
          id: 'c-2',
          authorId: 'user-priya',
          text: 'The flower stall on the east row has the best tulips this week.',
          createdAt: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
        },
      ],
      shares: 6,
    },
    {
      id: 'post-2',
      authorId: 'user-marcus',
      content:
        'Just finished tuning up my teal 8-speed commuter bike and posted it on the local Marketplace for anyone needing a reliable daily ride. New leather grips, freshly trued wheels, zero creaks.',
      image: '/src/assets/images/market_commuter_bike_1795260453231.jpg',
      imageSizeKb: 265,
      location: 'Riverside Heights',
      createdAt: new Date(Date.now() - 1000 * 60 * 155).toISOString(),
      reactions: {
        like: ['user-maya'],
        love: [],
        haha: [],
        wow: ['user-carlos', 'user-priya'],
      },
      comments: [
        {
          id: 'c-3',
          authorId: 'user-carlos',
          text: 'That matte teal paint job is super clean. Sent you a message!',
          createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
        },
      ],
      shares: 3,
    },
    {
      id: 'post-3',
      authorId: 'user-priya',
      content:
        'Tip for anyone commuting on a capped or zero-data plan this week: toggle Free Mode on in Kinbook to keep chatting in private messages, browsing Marketplace prices, and following live text updates with zero photo bandwidth.',
      location: 'Cedar Park',
      createdAt: new Date(Date.now() - 1000 * 60 * 320).toISOString(),
      reactions: {
        like: ['user-maya', 'user-marcus', 'user-carlos'],
        love: [],
        haha: [],
        wow: [],
      },
      comments: [],
      shares: 12,
    },
  ],
  stories: [
    {
      id: 'story-1',
      authorId: 'user-marcus',
      mediaUrl: '/src/assets/images/market_retro_camera_1795260453875.jpg',
      caption: 'Testing the 35mm prime lens by the window before listing it on Marketplace.',
      viewedBy: [],
      createdAt: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 23).toISOString(),
    },
    {
      id: 'story-2',
      authorId: 'user-carlos',
      mediaUrl: '/src/assets/images/reel_cooking_street_1795260453483.jpg',
      caption: 'Midtown grill is fired up! Swing by Stall 2 before 10 PM.',
      viewedBy: [],
      createdAt: new Date(Date.now() - 1000 * 60 * 110).toISOString(),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 22).toISOString(),
    },
    {
      id: 'story-3',
      authorId: 'user-priya',
      caption: 'Acoustic set at Cedar Park gazebo starts at 6:30 PM tonight — bring a blanket!',
      bgColor: 'from-blue-600 to-indigo-700',
      viewedBy: [],
      createdAt: new Date(Date.now() - 1000 * 60 * 185).toISOString(),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 20).toISOString(),
    },
  ],
  reels: [
    {
      id: 'reel-1',
      authorId: 'user-maya',
      caption: 'Golden hour boardwalk ride down by the harbor before sunset. Nothing beats this evening breeze.',
      audioTrack: 'Harbor Sunset · Lo-Fi Keys',
      posterImage: '/src/assets/images/reel_city_sunset_1795260453677.jpg',
      durationSec: 24,
      sizeMb: 4.6,
      likes: ['user-marcus', 'user-priya', 'user-carlos'],
      comments: [
        {
          id: 'rc-1',
          authorId: 'user-marcus',
          text: 'The reflections on the timber boardwalk look cinematic!',
          createdAt: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
        },
      ],
      views: 1420,
      createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    },
    {
      id: 'reel-2',
      authorId: 'user-carlos',
      caption: 'Charred limes, fresh cilantro, and smoky al pastor hitting the flat-top at tonight’s Midtown street pop-up.',
      audioTrack: 'Evening Market · Acoustic Groove',
      posterImage: '/src/assets/images/reel_cooking_street_1795260453483.jpg',
      durationSec: 19,
      sizeMb: 3.8,
      likes: ['user-maya', 'user-priya'],
      comments: [
        {
          id: 'rc-2',
          authorId: 'user-maya',
          text: 'Saving three tacos for after closing the bakery!',
          createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
        },
      ],
      views: 2890,
      createdAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    },
  ],
  streams: [
    {
      id: 'stream-1',
      hostId: 'user-carlos',
      title: 'Evening Street Tacos & Neighborhood Q&A from Midtown Plaza',
      category: 'Food & Local',
      isLive: true,
      viewerIds: ['user-maya', 'user-priya'],
      viewerCount: 48,
      thumbnail: '/src/assets/images/reel_cooking_street_1795260453483.jpg',
      startedAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
      comments: [
        {
          id: 'lc-1',
          authorId: 'user-maya',
          text: 'How long are you open tonight?',
          createdAt: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
        },
        {
          id: 'lc-2',
          authorId: 'user-priya',
          text: 'Those charred limes look incredible!',
          createdAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
        },
      ],
      reactionsCount: 164,
    },
    {
      id: 'stream-2',
      hostId: 'user-marcus',
      title: 'Vintage Mirrorless Camera Tear-Down & Lens Cleaning Workshop',
      category: 'Tech & Craft',
      isLive: true,
      viewerIds: ['user-maya'],
      viewerCount: 27,
      thumbnail: '/src/assets/images/market_retro_camera_1795260453875.jpg',
      startedAt: new Date(Date.now() - 1000 * 60 * 34).toISOString(),
      comments: [
        {
          id: 'lc-3',
          authorId: 'user-maya',
          text: 'Is that the 35mm f/2 prime you listed on Marketplace?',
          createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        },
      ],
      reactionsCount: 92,
    },
  ],
  listings: [
    {
      id: 'item-1',
      sellerId: 'user-marcus',
      title: 'Teal 8-Speed City Commuter Bicycle with Leather Saddle',
      price: 340,
      currency: '$',
      condition: 'Like New',
      category: 'Vehicles',
      location: 'Riverside Heights',
      distanceKm: 2.4,
      description:
        'Lightweight steel frame commuter bike (54cm, fits 5\'7" to 6\'0"). Includes Brooks-style leather saddle, matching grips, aluminum fenders, rear cargo rack, and bottle cage. Ready to ride.',
      image: '/src/assets/images/market_commuter_bike_1795260453231.jpg',
      imageSizeKb: 265,
      savedBy: ['user-maya'],
      status: 'available',
      createdAt: new Date(Date.now() - 1000 * 60 * 160).toISOString(),
    },
    {
      id: 'item-2',
      sellerId: 'user-marcus',
      title: 'Silver Mirrorless Camera Body + 35mm f/2 Prime Lens',
      price: 890,
      currency: '$',
      condition: 'Like New',
      category: 'Electronics',
      location: 'Riverside Heights',
      distanceKm: 2.4,
      description:
        'Low shutter count (under 3,200 clicks). Includes 35mm f/2 metal prime lens, braided rope strap, two batteries, and original charger. Local pickup at Riverside Coffee or Oakwood Square.',
      image: '/src/assets/images/market_retro_camera_1795260453875.jpg',
      imageSizeKb: 280,
      savedBy: ['user-priya', 'user-carlos'],
      status: 'available',
      createdAt: new Date(Date.now() - 1000 * 60 * 410).toISOString(),
    },
    {
      id: 'item-3',
      sellerId: 'user-maya',
      title: 'Weekend Artisan Market Floral & Sourdough Bundle Voucher',
      price: 28,
      currency: '$',
      condition: 'New',
      category: 'Home & Garden',
      location: 'Oakwood Market Square',
      distanceKm: 0.8,
      description:
        'Fresh seasonal wildflower bouquet paired with one country sourdough boule and sea-salt rosemary focaccia. Pickup Saturday or Sunday morning at Stall 4.',
      image: '/src/assets/images/feed_artisan_market_1795260453896.jpg',
      imageSizeKb: 310,
      savedBy: [],
      status: 'available',
      createdAt: new Date(Date.now() - 1000 * 60 * 500).toISOString(),
    },
  ],
  messages: [
    {
      id: 'msg-1',
      conversationId: 'user-marcus__user-maya',
      senderId: 'user-marcus',
      recipientId: 'user-maya',
      text: 'Hey Maya! Are you saving any rosemary focaccia for the afternoon pickup?',
      createdAt: new Date(Date.now() - 1000 * 60 * 48).toISOString(),
      read: true,
    },
    {
      id: 'msg-2',
      conversationId: 'user-marcus__user-maya',
      senderId: 'user-maya',
      recipientId: 'user-marcus',
      text: 'Yes! I set two loaves aside behind the counter for you.',
      createdAt: new Date(Date.now() - 1000 * 60 * 44).toISOString(),
      read: true,
    },
    {
      id: 'msg-3',
      conversationId: 'user-maya__user-priya',
      senderId: 'user-priya',
      recipientId: 'user-maya',
      text: 'Loved your sunset boardwalk Reel! What route did you take along the pier?',
      createdAt: new Date(Date.now() - 1000 * 60 * 22).toISOString(),
      read: false,
    },
  ],
};

function makeConversationId(a: string, b: string): string {
  return [a, b].sort().join('__');
}

function loadStore(): StoreState {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(STORE_PATH)) {
      fs.writeFileSync(STORE_PATH, JSON.stringify(SEED_STATE, null, 2), 'utf-8');
      return JSON.parse(JSON.stringify(SEED_STATE)) as StoreState;
    }
    const raw = fs.readFileSync(STORE_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as StoreState;
    if (!Array.isArray(parsed.stories)) {
      parsed.stories = JSON.parse(JSON.stringify(SEED_STATE.stories)) as StoryItem[];
    }
    return parsed;
  } catch (err) {
    console.error('Failed to load store.json, falling back to seed state:', err);
    return JSON.parse(JSON.stringify(SEED_STATE)) as StoreState;
  }
}

let store: StoreState = loadStore();

function saveStore() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tmpPath = `${STORE_PATH}.tmp`;
    fs.writeFileSync(tmpPath, JSON.stringify(store, null, 2), 'utf-8');
    fs.renameSync(tmpPath, STORE_PATH);
  } catch (err) {
    console.error('Failed to persist store.json:', err);
  }
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '15mb' }));

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });

  const clientSockets = new Map<WebSocket, { userId: string | null }>();

  function getOnlineUserIds(): string[] {
    const ids = new Set<string>();
    for (const meta of clientSockets.values()) {
      if (meta.userId) ids.add(meta.userId);
    }
    return Array.from(ids);
  }

  function broadcastAll(payload: Record<string, unknown>) {
    const encoded = JSON.stringify(payload);
    for (const [sock] of clientSockets.entries()) {
      if (sock.readyState === WebSocket.OPEN) {
        sock.send(encoded);
      }
    }
  }

  function broadcastToUsers(userIds: string[], payload: Record<string, unknown>) {
    const targets = new Set(userIds);
    const encoded = JSON.stringify(payload);
    for (const [sock, meta] of clientSockets.entries()) {
      if (sock.readyState === WebSocket.OPEN && meta.userId && targets.has(meta.userId)) {
        sock.send(encoded);
      }
    }
  }

  wss.on('connection', (ws) => {
    clientSockets.set(ws, { userId: null });

    ws.on('message', (rawData) => {
      try {
        const msg = JSON.parse(rawData.toString()) as Record<string, unknown>;
        const meta = clientSockets.get(ws);
        if (!meta) return;

        if (msg.type === 'auth' && typeof msg.userId === 'string') {
          meta.userId = msg.userId;
          broadcastAll({ type: 'presence:update', onlineUserIds: getOnlineUserIds() });
        } else if (
          msg.type === 'typing' &&
          typeof msg.fromUserId === 'string' &&
          typeof msg.toUserId === 'string'
        ) {
          broadcastToUsers([msg.toUserId], {
            type: 'typing',
            fromUserId: msg.fromUserId,
            toUserId: msg.toUserId,
            isTyping: Boolean(msg.isTyping),
          });
        } else if (
          msg.type === 'stream:join' &&
          typeof msg.streamId === 'string' &&
          typeof msg.userId === 'string'
        ) {
          const stream = store.streams.find((s) => s.id === msg.streamId);
          if (stream) {
            if (!stream.viewerIds.includes(msg.userId)) {
              stream.viewerIds.push(msg.userId);
              stream.viewerCount = Math.max(stream.viewerCount + 1, stream.viewerIds.length);
            }
            broadcastAll({ type: 'stream:updated', stream });
          }
        } else if (
          msg.type === 'stream:leave' &&
          typeof msg.streamId === 'string' &&
          typeof msg.userId === 'string'
        ) {
          const stream = store.streams.find((s) => s.id === msg.streamId);
          if (stream) {
            const idx = stream.viewerIds.indexOf(msg.userId);
            if (idx !== -1) {
              stream.viewerIds.splice(idx, 1);
              stream.viewerCount = Math.max(1, stream.viewerCount - 1);
            }
            broadcastAll({ type: 'stream:updated', stream });
          }
        } else if (
          msg.type === 'stream:frame' &&
          typeof msg.streamId === 'string' &&
          typeof msg.frameData === 'string'
        ) {
          // Relay live video frames to all connected viewers except sender
          const encoded = JSON.stringify({
            type: 'stream:frame',
            streamId: msg.streamId,
            frameData: msg.frameData,
          });
          for (const [sock] of clientSockets.entries()) {
            if (sock !== ws && sock.readyState === WebSocket.OPEN) {
              sock.send(encoded);
            }
          }
        }
      } catch {
        // Ignore malformed WS packets
      }
    });

    ws.on('close', () => {
      clientSockets.delete(ws);
      broadcastAll({ type: 'presence:update', onlineUserIds: getOnlineUserIds() });
    });
  });

  // REST API Endpoints
  app.get('/api/bootstrap', (_req, res) => {
    res.json({
      ...store,
      onlineUserIds: getOnlineUserIds(),
    });
  });

  app.post('/api/users/profile', (req, res) => {
    const { userId, name, bio, location, work, avatar, coverPhoto } = req.body as Partial<UserProfile> & {
      userId: string;
    };
    const user = store.users.find((u) => u.id === userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (typeof name === 'string' && name.trim()) user.name = name.trim().slice(0, 60);
    if (typeof bio === 'string') user.bio = bio.trim().slice(0, 240);
    if (typeof location === 'string') user.location = location.trim().slice(0, 80);
    if (typeof work === 'string') user.work = work.trim().slice(0, 80);
    if (typeof avatar === 'string' && avatar.trim()) user.avatar = avatar;
    if (typeof coverPhoto === 'string' && coverPhoto.trim()) user.coverPhoto = coverPhoto;

    saveStore();
    broadcastAll({ type: 'user:updated', user });
    res.json({ user });
  });

  app.post('/api/users/create', (req, res) => {
    const { name, location, bio, work } = req.body as {
      name: string;
      location?: string;
      bio?: string;
      work?: string;
    };
    if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });

    const cleanName = name.trim().slice(0, 50);
    const handle = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '') || `user${Date.now()}`;
    const newUser: UserProfile = {
      id: `user-${Date.now()}`,
      name: cleanName,
      handle: `${handle}${Math.floor(Math.random() * 90 + 10)}`,
      avatar: '/src/assets/images/avatar_maya_1795260453388.jpg',
      coverPhoto: '/src/assets/images/cover_neighborhood_1795260453679.jpg',
      bio: (bio || 'New Kinbook neighbor exploring local goods and community updates.').slice(0, 240),
      location: (location || 'Oakwood District').slice(0, 80),
      work: (work || 'Community Member').slice(0, 80),
      verified: false,
      followers: [],
      following: ['user-maya'],
      joinedAt: new Date().toISOString(),
    };

    const maya = store.users.find((u) => u.id === 'user-maya');
    if (maya && !maya.followers.includes(newUser.id)) {
      maya.followers.push(newUser.id);
    }

    store.users.push(newUser);
    saveStore();
    broadcastAll({ type: 'users:sync', users: store.users });
    res.json({ user: newUser, users: store.users });
  });

  app.post('/api/users/:targetId/follow', (req, res) => {
    const { targetId } = req.params;
    const { followerId } = req.body as { followerId: string };
    if (!followerId || followerId === targetId) {
      return res.status(400).json({ error: 'Invalid follow action' });
    }
    const follower = store.users.find((u) => u.id === followerId);
    const target = store.users.find((u) => u.id === targetId);
    if (!follower || !target) return res.status(404).json({ error: 'User not found' });

    const alreadyFollowing = follower.following.includes(targetId);
    if (alreadyFollowing) {
      follower.following = follower.following.filter((id) => id !== targetId);
      target.followers = target.followers.filter((id) => id !== followerId);
    } else {
      follower.following.push(targetId);
      if (!target.followers.includes(followerId)) target.followers.push(followerId);
    }

    saveStore();
    broadcastAll({ type: 'users:sync', users: store.users });
    res.json({ users: store.users, following: !alreadyFollowing });
  });

  app.post('/api/posts', (req, res) => {
    const { authorId, content, image, location } = req.body as {
      authorId: string;
      content: string;
      image?: string;
      location?: string;
    };
    if (!authorId || (!content?.trim() && !image)) {
      return res.status(400).json({ error: 'Post content or image required' });
    }
    const newPost: FeedPost = {
      id: `post-${Date.now()}`,
      authorId,
      content: (content || '').trim().slice(0, 1200),
      image: image || undefined,
      imageSizeKb: image ? Math.max(85, Math.round((image.length * 0.75) / 1024)) : undefined,
      location: location?.trim() || undefined,
      createdAt: new Date().toISOString(),
      reactions: { like: [], love: [], haha: [], wow: [] },
      comments: [],
      shares: 0,
    };

    store.posts.unshift(newPost);
    saveStore();
    broadcastAll({ type: 'post:created', post: newPost });
    res.json({ post: newPost });
  });

  app.post('/api/posts/:id/react', (req, res) => {
    const { id } = req.params;
    const { userId, reaction } = req.body as { userId: string; reaction: ReactionType };
    const post = store.posts.find((p) => p.id === id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const types: ReactionType[] = ['like', 'love', 'haha', 'wow'];
    const hadSame = post.reactions[reaction]?.includes(userId);
    for (const t of types) {
      post.reactions[t] = (post.reactions[t] || []).filter((uid) => uid !== userId);
    }
    if (!hadSame) {
      post.reactions[reaction].push(userId);
    }

    saveStore();
    broadcastAll({ type: 'post:updated', post });
    res.json({ post });
  });

  app.post('/api/posts/:id/comment', (req, res) => {
    const { id } = req.params;
    const { authorId, text } = req.body as { authorId: string; text: string };
    const post = store.posts.find((p) => p.id === id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (!text?.trim()) return res.status(400).json({ error: 'Comment required' });

    post.comments.push({
      id: `c-${Date.now()}`,
      authorId,
      text: text.trim().slice(0, 500),
      createdAt: new Date().toISOString(),
    });

    saveStore();
    broadcastAll({ type: 'post:updated', post });
    res.json({ post });
  });

  app.post('/api/posts/:id/share', (req, res) => {
    const { id } = req.params;
    const post = store.posts.find((p) => p.id === id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    post.shares += 1;
    saveStore();
    broadcastAll({ type: 'post:updated', post });
    res.json({ post });
  });

  app.post('/api/reels', (req, res) => {
    const { authorId, caption, audioTrack, posterImage, videoUrl } = req.body as {
      authorId: string;
      caption: string;
      audioTrack?: string;
      posterImage?: string;
      videoUrl?: string;
    };
    if (!authorId || !caption?.trim()) {
      return res.status(400).json({ error: 'Caption is required' });
    }
    const newReel: ReelItem = {
      id: `reel-${Date.now()}`,
      authorId,
      caption: caption.trim().slice(0, 300),
      audioTrack: (audioTrack || 'Original Neighborhood Audio').trim().slice(0, 80),
      posterImage: posterImage || '/src/assets/images/reel_city_sunset_1795260453677.jpg',
      videoUrl: videoUrl || undefined,
      durationSec: 20,
      sizeMb: 3.4,
      likes: [],
      comments: [],
      views: 1,
      createdAt: new Date().toISOString(),
    };

    store.reels.unshift(newReel);
    saveStore();
    broadcastAll({ type: 'reel:created', reel: newReel });
    res.json({ reel: newReel });
  });

  app.post('/api/reels/:id/like', (req, res) => {
    const { id } = req.params;
    const { userId } = req.body as { userId: string };
    const reel = store.reels.find((r) => r.id === id);
    if (!reel) return res.status(404).json({ error: 'Reel not found' });

    if (reel.likes.includes(userId)) {
      reel.likes = reel.likes.filter((uid) => uid !== userId);
    } else {
      reel.likes.push(userId);
    }
    saveStore();
    broadcastAll({ type: 'reel:updated', reel });
    res.json({ reel });
  });

  app.post('/api/reels/:id/comment', (req, res) => {
    const { id } = req.params;
    const { authorId, text } = req.body as { authorId: string; text: string };
    const reel = store.reels.find((r) => r.id === id);
    if (!reel) return res.status(404).json({ error: 'Reel not found' });
    if (!text?.trim()) return res.status(400).json({ error: 'Comment required' });

    reel.comments.push({
      id: `rc-${Date.now()}`,
      authorId,
      text: text.trim().slice(0, 300),
      createdAt: new Date().toISOString(),
    });
    saveStore();
    broadcastAll({ type: 'reel:updated', reel });
    res.json({ reel });
  });

  app.post('/api/marketplace', (req, res) => {
    const { sellerId, title, price, condition, category, location, description, image } =
      req.body as Partial<MarketplaceItem>;
    if (!sellerId || !title?.trim() || typeof price !== 'number') {
      return res.status(400).json({ error: 'Title, price, and seller are required' });
    }
    const listing: MarketplaceItem = {
      id: `item-${Date.now()}`,
      sellerId,
      title: title.trim().slice(0, 120),
      price: Math.max(0, Math.round(price)),
      currency: '$',
      condition: condition || 'Good',
      category: category || 'Home & Garden',
      location: (location || 'Oakwood District').trim().slice(0, 80),
      distanceKm: Number((Math.random() * 4 + 0.5).toFixed(1)),
      description: (description || '').trim().slice(0, 600),
      image: image || '/src/assets/images/market_commuter_bike_1795260453231.jpg',
      imageSizeKb: image ? Math.max(95, Math.round((image.length * 0.75) / 1024)) : 240,
      savedBy: [],
      status: 'available',
      createdAt: new Date().toISOString(),
    };

    store.listings.unshift(listing);
    saveStore();
    broadcastAll({ type: 'listing:created', listing });
    res.json({ listing });
  });

  app.post('/api/marketplace/:id/save', (req, res) => {
    const { id } = req.params;
    const { userId } = req.body as { userId: string };
    const listing = store.listings.find((l) => l.id === id);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });

    if (listing.savedBy.includes(userId)) {
      listing.savedBy = listing.savedBy.filter((uid) => uid !== userId);
    } else {
      listing.savedBy.push(userId);
    }
    saveStore();
    broadcastAll({ type: 'listing:updated', listing });
    res.json({ listing });
  });

  app.post('/api/marketplace/:id/status', (req, res) => {
    const { id } = req.params;
    const { status, buyerId } = req.body as {
      status: 'available' | 'pending' | 'sold';
      buyerId?: string;
    };
    const listing = store.listings.find((l) => l.id === id);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });

    listing.status = status;
    if (buyerId) listing.buyerId = buyerId;
    saveStore();
    broadcastAll({ type: 'listing:updated', listing });
    res.json({ listing });
  });

  app.post('/api/streams', (req, res) => {
    const { hostId, title, category, thumbnail } = req.body as {
      hostId: string;
      title: string;
      category?: string;
      thumbnail?: string;
    };
    if (!hostId || !title?.trim()) {
      return res.status(400).json({ error: 'Host and stream title required' });
    }
    const stream: LiveStream = {
      id: `stream-${Date.now()}`,
      hostId,
      title: title.trim().slice(0, 120),
      category: category || 'Community',
      isLive: true,
      viewerIds: [hostId],
      viewerCount: 1,
      thumbnail: thumbnail || '/src/assets/images/cover_neighborhood_1795260453679.jpg',
      startedAt: new Date().toISOString(),
      comments: [],
      reactionsCount: 0,
    };

    store.streams.unshift(stream);
    saveStore();
    broadcastAll({ type: 'stream:started', stream });
    res.json({ stream });
  });

  app.post('/api/streams/:id/end', (req, res) => {
    const { id } = req.params;
    const { shareToFeed } = req.body as { shareToFeed?: boolean };
    const stream = store.streams.find((s) => s.id === id);
    if (!stream) return res.status(404).json({ error: 'Stream not found' });

    stream.isLive = false;
    let archivedPost: FeedPost | null = null;
    if (shareToFeed) {
      archivedPost = {
        id: `post-${Date.now()}`,
        authorId: stream.hostId,
        content: `Wrapped up a live broadcast: "${stream.title}" (${stream.viewerCount} viewers tuned in). Thanks for joining!`,
        image: stream.thumbnail,
        imageSizeKb: 220,
        createdAt: new Date().toISOString(),
        reactions: { like: [], love: [], haha: [], wow: [] },
        comments: [],
        shares: 0,
      };
      store.posts.unshift(archivedPost);
    }

    saveStore();
    broadcastAll({ type: 'stream:ended', streamId: stream.id, archivedPost });
    res.json({ stream, archivedPost });
  });

  app.post('/api/streams/:id/comment', (req, res) => {
    const { id } = req.params;
    const { authorId, text } = req.body as { authorId: string; text: string };
    const stream = store.streams.find((s) => s.id === id);
    if (!stream) return res.status(404).json({ error: 'Stream not found' });
    if (!text?.trim()) return res.status(400).json({ error: 'Comment required' });

    const comment = {
      id: `lc-${Date.now()}`,
      authorId,
      text: text.trim().slice(0, 240),
      createdAt: new Date().toISOString(),
    };
    stream.comments.push(comment);
    saveStore();
    broadcastAll({ type: 'stream:comment', streamId: stream.id, comment });
    res.json({ comment });
  });

  app.post('/api/streams/:id/react', (req, res) => {
    const { id } = req.params;
    const stream = store.streams.find((s) => s.id === id);
    if (!stream) return res.status(404).json({ error: 'Stream not found' });
    stream.reactionsCount += 1;
    saveStore();
    broadcastAll({
      type: 'stream:react',
      streamId: stream.id,
      reactionsCount: stream.reactionsCount,
    });
    res.json({ reactionsCount: stream.reactionsCount });
  });

  app.post('/api/messages', (req, res) => {
    const { senderId, recipientId, text, attachmentListingId } = req.body as {
      senderId: string;
      recipientId: string;
      text: string;
      attachmentListingId?: string;
    };
    if (!senderId || !recipientId || !text?.trim()) {
      return res.status(400).json({ error: 'Sender, recipient, and message text required' });
    }
    const message: DirectMessage = {
      id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      conversationId: makeConversationId(senderId, recipientId),
      senderId,
      recipientId,
      text: text.trim().slice(0, 1000),
      attachmentListingId: attachmentListingId || undefined,
      createdAt: new Date().toISOString(),
      read: false,
    };

    store.messages.push(message);
    saveStore();
    broadcastToUsers([senderId, recipientId], { type: 'message:new', message });
    res.json({ message });
  });

  app.post('/api/messages/:id/react', (req, res) => {
    const { id } = req.params;
    const { userId, emoji } = req.body as { userId: string; emoji: string };
    const message = store.messages.find((m) => m.id === id);
    if (!message) return res.status(404).json({ error: 'Message not found' });
    if (!userId || !emoji || typeof emoji !== 'string' || emoji.length > 16) {
      return res.status(400).json({ error: 'Valid userId and emoji required' });
    }

    if (!message.reactions) {
      message.reactions = {};
    }

    const hadSame = message.reactions[emoji]?.includes(userId);

    // One active reaction per user per message (Messenger-style toggle/switch)
    for (const key of Object.keys(message.reactions)) {
      message.reactions[key] = message.reactions[key].filter((uid) => uid !== userId);
      if (message.reactions[key].length === 0) {
        delete message.reactions[key];
      }
    }

    if (!hadSame) {
      if (!message.reactions[emoji]) message.reactions[emoji] = [];
      message.reactions[emoji].push(userId);
    }

    saveStore();
    broadcastToUsers([message.senderId, message.recipientId], {
      type: 'message:updated',
      message,
    });
    res.json({ message });
  });

  app.post('/api/messages/read', (req, res) => {
    const { userId, peerId } = req.body as { userId: string; peerId: string };
    const convId = makeConversationId(userId, peerId);
    let updated = false;
    for (const msg of store.messages) {
      if (msg.conversationId === convId && msg.recipientId === userId && !msg.read) {
        msg.read = true;
        updated = true;
      }
    }
    if (updated) saveStore();
    res.json({ ok: true });
  });

  app.post('/api/stories', (req, res) => {
    const { authorId, caption, mediaUrl, bgColor } = req.body as {
      authorId: string;
      caption?: string;
      mediaUrl?: string;
      bgColor?: string;
    };
    if (!authorId || (!caption?.trim() && !mediaUrl)) {
      return res.status(400).json({ error: 'Story caption or media required' });
    }
    const story: StoryItem = {
      id: `story-${Date.now()}`,
      authorId,
      mediaUrl: mediaUrl || undefined,
      caption: (caption || '').trim().slice(0, 220),
      bgColor: bgColor || 'from-[#1877F2] to-indigo-700',
      viewedBy: [authorId],
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
    };
    store.stories.unshift(story);
    saveStore();
    broadcastAll({ type: 'story:created', story });
    res.json({ story });
  });

  app.post('/api/stories/:id/view', (req, res) => {
    const { id } = req.params;
    const { userId } = req.body as { userId: string };
    const story = store.stories.find((s) => s.id === id);
    if (!story) return res.status(404).json({ error: 'Story not found' });
    if (userId && !story.viewedBy.includes(userId)) {
      story.viewedBy.push(userId);
      saveStore();
      broadcastAll({ type: 'story:updated', story });
    }
    res.json({ story });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.join(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const PORT = 3000;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Kinbook server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
