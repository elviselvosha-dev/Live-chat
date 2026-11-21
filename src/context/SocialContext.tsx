import React, { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from 'react';
import type {
  BootstrapResponse,
  DirectMessage,
  FeedPost,
  LiveComment,
  LiveStream,
  MarketplaceItem,
  ReactionType,
  ReelItem,
  StoryItem,
  TabKey,
  UserProfile,
} from '../types';

interface SocialContextValue {
  loading: boolean;
  users: UserProfile[];
  currentUser: UserProfile | null;
  posts: FeedPost[];
  stories: StoryItem[];
  reels: ReelItem[];
  streams: LiveStream[];
  listings: MarketplaceItem[];
  messages: DirectMessage[];
  onlineUserIds: string[];
  typingUsers: Record<string, boolean>;
  liveFrames: Record<string, string>;
  freeMode: boolean;
  dataSavedKb: number;
  activeTab: TabKey;
  inspectedUserId: string | null;
  activeChatUserId: string | null;
  activeStreamId: string | null;
  unreadMessageCount: number;
  setActiveTab: (tab: TabKey) => void;
  setFreeMode: (val: boolean) => void;
  recordDataUnlocked: (kb: number) => void;
  switchUser: (userId: string) => void;
  openUserProfile: (userId: string) => void;
  openChatWithUser: (userId: string, prefillListing?: MarketplaceItem) => void;
  openLiveStream: (streamId: string | null) => void;
  getUserById: (id: string) => UserProfile | undefined;
  toggleFollow: (targetId: string) => Promise<void>;
  updateProfile: (patch: Partial<UserProfile>) => Promise<void>;
  createAccount: (input: { name: string; location: string; work: string; bio: string }) => Promise<void>;
  createPost: (input: { content: string; image?: string; location?: string }) => Promise<void>;
  reactToPost: (postId: string, reaction: ReactionType) => Promise<void>;
  commentOnPost: (postId: string, text: string) => Promise<void>;
  sharePost: (postId: string) => Promise<void>;
  createStory: (input: { caption: string; mediaUrl?: string; bgColor?: string }) => Promise<void>;
  markStoryViewed: (storyId: string) => Promise<void>;
  createReel: (input: { caption: string; audioTrack: string; posterImage?: string; videoUrl?: string }) => Promise<void>;
  likeReel: (reelId: string) => Promise<void>;
  commentOnReel: (reelId: string, text: string) => Promise<void>;
  createListing: (input: {
    title: string;
    price: number;
    condition: MarketplaceItem['condition'];
    category: MarketplaceItem['category'];
    location: string;
    description: string;
    image?: string;
  }) => Promise<void>;
  toggleSaveListing: (listingId: string) => Promise<void>;
  updateListingStatus: (listingId: string, status: MarketplaceItem['status']) => Promise<void>;
  startLiveStream: (input: { title: string; category: string; thumbnail?: string }) => Promise<LiveStream | null>;
  endLiveStream: (streamId: string, shareToFeed: boolean) => Promise<void>;
  commentOnStream: (streamId: string, text: string) => Promise<void>;
  reactToStream: (streamId: string) => Promise<void>;
  sendStreamFrame: (streamId: string, frameData: string) => void;
  sendMessage: (recipientId: string, text: string, attachmentListingId?: string) => Promise<void>;
  reactToMessage: (messageId: string, emoji: string) => Promise<void>;
  markConversationRead: (peerId: string) => Promise<void>;
  sendTypingSignal: (toUserId: string, isTyping: boolean) => void;
  prefillMessageDraft: { recipientId: string; listing?: MarketplaceItem } | null;
  clearPrefillMessageDraft: () => void;
}

const SocialContext = createContext<SocialContextValue | null>(null);

export const SocialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    return localStorage.getItem('kinbook_user_id') || 'user-maya';
  });
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [stories, setStories] = useState<StoryItem[]>([]);
  const [reels, setReels] = useState<ReelItem[]>([]);
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [listings, setListings] = useState<MarketplaceItem[]>([]);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
  const [liveFrames, setLiveFrames] = useState<Record<string, string>>({});

  const [freeMode, setFreeModeState] = useState<boolean>(() => {
    return localStorage.getItem('kinbook_free_mode') === 'true';
  });
  const [unlockedKb, setUnlockedKb] = useState(0);
  const [activeTab, setActiveTabState] = useState<TabKey>(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab') as TabKey | null;
    if (tab && ['feed', 'reels', 'live', 'marketplace', 'messages', 'profile'].includes(tab)) {
      return tab;
    }
    if (params.get('profile')) return 'profile';
    return 'feed';
  });
  const [inspectedUserId, setInspectedUserId] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('profile');
  });
  const [activeChatUserId, setActiveChatUserId] = useState<string | null>('user-marcus');
  const [activeStreamId, setActiveStreamId] = useState<string | null>(null);
  const [prefillMessageDraft, setPrefillMessageDraft] = useState<{
    recipientId: string;
    listing?: MarketplaceItem;
  } | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const currentUserIdRef = useRef(currentUserId);
  currentUserIdRef.current = currentUserId;

  const setFreeMode = useCallback((val: boolean) => {
    setFreeModeState(val);
    localStorage.setItem('kinbook_free_mode', String(val));
  }, []);

  const recordDataUnlocked = useCallback((kb: number) => {
    setUnlockedKb((prev) => prev + kb);
  }, []);

  const dataSavedKb = useMemo(() => {
    if (!freeMode) return 0;
    const postImagesKb = posts.reduce((acc, p) => acc + (p.image ? p.imageSizeKb || 260 : 0), 0);
    const marketImagesKb = listings.reduce((acc, l) => acc + (l.imageSizeKb || 240), 0);
    const reelsKb = reels.reduce((acc, r) => acc + Math.round(r.sizeMb * 1024), 0);
    const liveKb = streams.filter((s) => s.isLive).length * 2400;
    return Math.max(0, postImagesKb + marketImagesKb + reelsKb + liveKb - unlockedKb);
  }, [freeMode, posts, listings, reels, streams, unlockedKb]);

  // Initial bootstrap
  useEffect(() => {
    let mounted = true;
    fetch('/api/bootstrap')
      .then((res) => res.json())
      .then((data: BootstrapResponse) => {
        if (!mounted) return;
        setUsers(data.users);
        setPosts(data.posts);
        setStories(data.stories || []);
        setReels(data.reels);
        setStreams(data.streams);
        setListings(data.listings);
        setMessages(data.messages);
        setOnlineUserIds(data.onlineUserIds || []);
        if (!data.users.some((u) => u.id === currentUserIdRef.current) && data.users[0]) {
          setCurrentUserId(data.users[0].id);
        }
      })
      .catch((err) => {
        console.error('Bootstrap failed:', err);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // WebSocket real-time connection with auto-reconnect
  useEffect(() => {
    let closed = false;
    let reconnectTimer: number | undefined;

    function connect() {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      const socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        socket.send(JSON.stringify({ type: 'auth', userId: currentUserIdRef.current }));
      };

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data) as Record<string, unknown>;
          switch (payload.type) {
            case 'presence:update':
              setOnlineUserIds((payload.onlineUserIds as string[]) || []);
              break;
            case 'users:sync':
              setUsers((payload.users as UserProfile[]) || []);
              break;
            case 'user:updated': {
              const updated = payload.user as UserProfile;
              setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
              break;
            }
            case 'post:created': {
              const post = payload.post as FeedPost;
              setPosts((prev) => (prev.some((p) => p.id === post.id) ? prev : [post, ...prev]));
              break;
            }
            case 'post:updated': {
              const post = payload.post as FeedPost;
              setPosts((prev) => prev.map((p) => (p.id === post.id ? post : p)));
              break;
            }
            case 'story:created': {
              const story = payload.story as StoryItem;
              setStories((prev) => (prev.some((s) => s.id === story.id) ? prev : [story, ...prev]));
              break;
            }
            case 'story:updated': {
              const story = payload.story as StoryItem;
              setStories((prev) => prev.map((s) => (s.id === story.id ? story : s)));
              break;
            }
            case 'reel:created': {
              const reel = payload.reel as ReelItem;
              setReels((prev) => (prev.some((r) => r.id === reel.id) ? prev : [reel, ...prev]));
              break;
            }
            case 'reel:updated': {
              const reel = payload.reel as ReelItem;
              setReels((prev) => prev.map((r) => (r.id === reel.id ? reel : r)));
              break;
            }
            case 'listing:created': {
              const listing = payload.listing as MarketplaceItem;
              setListings((prev) => (prev.some((l) => l.id === listing.id) ? prev : [listing, ...prev]));
              break;
            }
            case 'listing:updated': {
              const listing = payload.listing as MarketplaceItem;
              setListings((prev) => prev.map((l) => (l.id === listing.id ? listing : l)));
              break;
            }
            case 'stream:started': {
              const stream = payload.stream as LiveStream;
              setStreams((prev) => (prev.some((s) => s.id === stream.id) ? prev : [stream, ...prev]));
              break;
            }
            case 'stream:updated': {
              const stream = payload.stream as LiveStream;
              setStreams((prev) => prev.map((s) => (s.id === stream.id ? stream : s)));
              break;
            }
            case 'stream:ended': {
              const streamId = payload.streamId as string;
              const archivedPost = payload.archivedPost as FeedPost | null;
              setStreams((prev) => prev.map((s) => (s.id === streamId ? { ...s, isLive: false } : s)));
              if (archivedPost) {
                setPosts((prev) => (prev.some((p) => p.id === archivedPost.id) ? prev : [archivedPost, ...prev]));
              }
              break;
            }
            case 'stream:comment': {
              const streamId = payload.streamId as string;
              const comment = payload.comment as LiveComment;
              setStreams((prev) =>
                prev.map((s) =>
                  s.id === streamId && !s.comments.some((c) => c.id === comment.id)
                    ? { ...s, comments: [...s.comments, comment] }
                    : s
                )
              );
              break;
            }
            case 'stream:react': {
              const streamId = payload.streamId as string;
              const reactionsCount = payload.reactionsCount as number;
              setStreams((prev) =>
                prev.map((s) => (s.id === streamId ? { ...s, reactionsCount } : s))
              );
              break;
            }
            case 'stream:frame': {
              const streamId = payload.streamId as string;
              const frameData = payload.frameData as string;
              setLiveFrames((prev) => ({ ...prev, [streamId]: frameData }));
              break;
            }
            case 'message:new': {
              const msg = payload.message as DirectMessage;
              setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
              break;
            }
            case 'message:updated': {
              const msg = payload.message as DirectMessage;
              setMessages((prev) => prev.map((m) => (m.id === msg.id ? msg : m)));
              break;
            }
            case 'typing': {
              const fromUserId = payload.fromUserId as string;
              const isTyping = Boolean(payload.isTyping);
              setTypingUsers((prev) => ({ ...prev, [fromUserId]: isTyping }));
              break;
            }
          }
        } catch {
          // Ignore malformed message
        }
      };

      socket.onclose = () => {
        if (!closed) {
          reconnectTimer = window.setTimeout(connect, 2000);
        }
      };
    }

    connect();
    return () => {
      closed = true;
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      wsRef.current?.close();
    };
  }, []);

  // Re-auth WebSocket when switching current user
  useEffect(() => {
    localStorage.setItem('kinbook_user_id', currentUserId);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'auth', userId: currentUserId }));
    }
  }, [currentUserId]);

  const currentUser = useMemo(
    () => users.find((u) => u.id === currentUserId) || users[0] || null,
    [users, currentUserId]
  );

  const getUserById = useCallback(
    (id: string) => users.find((u) => u.id === id),
    [users]
  );

  const unreadMessageCount = useMemo(() => {
    if (!currentUser) return 0;
    return messages.filter((m) => m.recipientId === currentUser.id && !m.read).length;
  }, [messages, currentUser]);

  const setActiveTab = useCallback((tab: TabKey) => {
    setActiveTabState(tab);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    if (tab !== 'profile') url.searchParams.delete('profile');
    window.history.replaceState({}, '', url.toString());
  }, []);

  const switchUser = useCallback((userId: string) => {
    setCurrentUserId(userId);
    setInspectedUserId(null);
  }, []);

  const openUserProfile = useCallback((userId: string) => {
    setInspectedUserId(userId);
    setActiveTabState('profile');
    const url = new URL(window.location.href);
    url.searchParams.set('tab', 'profile');
    url.searchParams.set('profile', userId);
    window.history.replaceState({}, '', url.toString());
  }, []);

  const openChatWithUser = useCallback((userId: string, prefillListing?: MarketplaceItem) => {
    setActiveChatUserId(userId);
    if (prefillListing) {
      setPrefillMessageDraft({ recipientId: userId, listing: prefillListing });
    }
    setActiveTab('messages');
  }, [setActiveTab]);

  const openLiveStream = useCallback((streamId: string | null) => {
    if (activeStreamId && activeStreamId !== streamId && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({ type: 'stream:leave', streamId: activeStreamId, userId: currentUserIdRef.current })
      );
    }
    setActiveStreamId(streamId);
    setActiveTab('live');
    if (streamId && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({ type: 'stream:join', streamId, userId: currentUserIdRef.current })
      );
    }
  }, [activeStreamId]);

  const toggleFollow = useCallback(async (targetId: string) => {
    const res = await fetch(`/api/users/${targetId}/follow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ followerId: currentUserIdRef.current }),
    });
    if (res.ok) {
      const data = (await res.json()) as { users: UserProfile[] };
      setUsers(data.users);
    }
  }, []);

  const updateProfile = useCallback(async (patch: Partial<UserProfile>) => {
    const res = await fetch('/api/users/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUserIdRef.current, ...patch }),
    });
    if (res.ok) {
      const { user } = (await res.json()) as { user: UserProfile };
      setUsers((prev) => prev.map((u) => (u.id === user.id ? user : u)));
    }
  }, []);

  const createAccount = useCallback(
    async (input: { name: string; location: string; work: string; bio: string }) => {
      const res = await fetch('/api/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (res.ok) {
        const data = (await res.json()) as { user: UserProfile; users: UserProfile[] };
        setUsers(data.users);
        setCurrentUserId(data.user.id);
        setInspectedUserId(data.user.id);
      }
    },
    []
  );

  const createPost = useCallback(async (input: { content: string; image?: string; location?: string }) => {
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ authorId: currentUserIdRef.current, ...input }),
    });
    if (res.ok) {
      const { post } = (await res.json()) as { post: FeedPost };
      setPosts((prev) => (prev.some((p) => p.id === post.id) ? prev : [post, ...prev]));
    }
  }, []);

  const reactToPost = useCallback(async (postId: string, reaction: ReactionType) => {
    const res = await fetch(`/api/posts/${postId}/react`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUserIdRef.current, reaction }),
    });
    if (res.ok) {
      const { post } = (await res.json()) as { post: FeedPost };
      setPosts((prev) => prev.map((p) => (p.id === post.id ? post : p)));
    }
  }, []);

  const commentOnPost = useCallback(async (postId: string, text: string) => {
    const res = await fetch(`/api/posts/${postId}/comment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ authorId: currentUserIdRef.current, text }),
    });
    if (res.ok) {
      const { post } = (await res.json()) as { post: FeedPost };
      setPosts((prev) => prev.map((p) => (p.id === post.id ? post : p)));
    }
  }, []);

  const sharePost = useCallback(async (postId: string) => {
    const res = await fetch(`/api/posts/${postId}/share`, { method: 'POST' });
    if (res.ok) {
      const { post } = (await res.json()) as { post: FeedPost };
      setPosts((prev) => prev.map((p) => (p.id === post.id ? post : p)));
    }
  }, []);

  const createStory = useCallback(
    async (input: { caption: string; mediaUrl?: string; bgColor?: string }) => {
      const res = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authorId: currentUserIdRef.current, ...input }),
      });
      if (res.ok) {
        const { story } = (await res.json()) as { story: StoryItem };
        setStories((prev) => (prev.some((s) => s.id === story.id) ? prev : [story, ...prev]));
      }
    },
    []
  );

  const markStoryViewed = useCallback(async (storyId: string) => {
    const res = await fetch(`/api/stories/${storyId}/view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUserIdRef.current }),
    });
    if (res.ok) {
      const { story } = (await res.json()) as { story: StoryItem };
      setStories((prev) => prev.map((s) => (s.id === story.id ? story : s)));
    }
  }, []);

  const createReel = useCallback(
    async (input: { caption: string; audioTrack: string; posterImage?: string; videoUrl?: string }) => {
      const res = await fetch('/api/reels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authorId: currentUserIdRef.current, ...input }),
      });
      if (res.ok) {
        const { reel } = (await res.json()) as { reel: ReelItem };
        setReels((prev) => (prev.some((r) => r.id === reel.id) ? prev : [reel, ...prev]));
      }
    },
    []
  );

  const likeReel = useCallback(async (reelId: string) => {
    const res = await fetch(`/api/reels/${reelId}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUserIdRef.current }),
    });
    if (res.ok) {
      const { reel } = (await res.json()) as { reel: ReelItem };
      setReels((prev) => prev.map((r) => (r.id === reel.id ? reel : r)));
    }
  }, []);

  const commentOnReel = useCallback(async (reelId: string, text: string) => {
    const res = await fetch(`/api/reels/${reelId}/comment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ authorId: currentUserIdRef.current, text }),
    });
    if (res.ok) {
      const { reel } = (await res.json()) as { reel: ReelItem };
      setReels((prev) => prev.map((r) => (r.id === reel.id ? reel : r)));
    }
  }, []);

  const createListing = useCallback(
    async (input: {
      title: string;
      price: number;
      condition: MarketplaceItem['condition'];
      category: MarketplaceItem['category'];
      location: string;
      description: string;
      image?: string;
    }) => {
      const res = await fetch('/api/marketplace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sellerId: currentUserIdRef.current, ...input }),
      });
      if (res.ok) {
        const { listing } = (await res.json()) as { listing: MarketplaceItem };
        setListings((prev) => (prev.some((l) => l.id === listing.id) ? prev : [listing, ...prev]));
      }
    },
    []
  );

  const toggleSaveListing = useCallback(async (listingId: string) => {
    const res = await fetch(`/api/marketplace/${listingId}/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUserIdRef.current }),
    });
    if (res.ok) {
      const { listing } = (await res.json()) as { listing: MarketplaceItem };
      setListings((prev) => prev.map((l) => (l.id === listing.id ? listing : l)));
    }
  }, []);

  const updateListingStatus = useCallback(async (listingId: string, status: MarketplaceItem['status']) => {
    const res = await fetch(`/api/marketplace/${listingId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, buyerId: currentUserIdRef.current }),
    });
    if (res.ok) {
      const { listing } = (await res.json()) as { listing: MarketplaceItem };
      setListings((prev) => prev.map((l) => (l.id === listing.id ? listing : l)));
    }
  }, []);

  const startLiveStream = useCallback(
    async (input: { title: string; category: string; thumbnail?: string }) => {
      const res = await fetch('/api/streams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostId: currentUserIdRef.current, ...input }),
      });
      if (res.ok) {
        const { stream } = (await res.json()) as { stream: LiveStream };
        setStreams((prev) => (prev.some((s) => s.id === stream.id) ? prev : [stream, ...prev]));
        setActiveStreamId(stream.id);
        return stream;
      }
      return null;
    },
    []
  );

  const endLiveStream = useCallback(async (streamId: string, shareToFeed: boolean) => {
    const res = await fetch(`/api/streams/${streamId}/end`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shareToFeed }),
    });
    if (res.ok) {
      const data = (await res.json()) as { stream: LiveStream; archivedPost: FeedPost | null };
      setStreams((prev) => prev.map((s) => (s.id === streamId ? { ...s, isLive: false } : s)));
      if (data.archivedPost) {
        const archived = data.archivedPost;
        setPosts((prev) => (prev.some((p) => p.id === archived.id) ? prev : [archived, ...prev]));
      }
      setActiveStreamId(null);
    }
  }, []);

  const commentOnStream = useCallback(async (streamId: string, text: string) => {
    const res = await fetch(`/api/streams/${streamId}/comment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ authorId: currentUserIdRef.current, text }),
    });
    if (res.ok) {
      const { comment } = (await res.json()) as { comment: LiveComment };
      setStreams((prev) =>
        prev.map((s) =>
          s.id === streamId && !s.comments.some((c) => c.id === comment.id)
            ? { ...s, comments: [...s.comments, comment] }
            : s
        )
      );
    }
  }, []);

  const reactToStream = useCallback(async (streamId: string) => {
    const res = await fetch(`/api/streams/${streamId}/react`, { method: 'POST' });
    if (res.ok) {
      const { reactionsCount } = (await res.json()) as { reactionsCount: number };
      setStreams((prev) =>
        prev.map((s) => (s.id === streamId ? { ...s, reactionsCount } : s))
      );
    }
  }, []);

  const sendStreamFrame = useCallback((streamId: string, frameData: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'stream:frame', streamId, frameData }));
    }
  }, []);

  const sendMessage = useCallback(
    async (recipientId: string, text: string, attachmentListingId?: string) => {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: currentUserIdRef.current,
          recipientId,
          text,
          attachmentListingId,
        }),
      });
      if (res.ok) {
        const { message } = (await res.json()) as { message: DirectMessage };
        setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
      }
    },
    []
  );

  const reactToMessage = useCallback(async (messageId: string, emoji: string) => {
    const res = await fetch(`/api/messages/${messageId}/react`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUserIdRef.current, emoji }),
    });
    if (res.ok) {
      const { message } = (await res.json()) as { message: DirectMessage };
      setMessages((prev) => prev.map((m) => (m.id === message.id ? message : m)));
    }
  }, []);

  const markConversationRead = useCallback(async (peerId: string) => {
    await fetch('/api/messages/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUserIdRef.current, peerId }),
    });
    setMessages((prev) =>
      prev.map((m) =>
        m.senderId === peerId && m.recipientId === currentUserIdRef.current ? { ...m, read: true } : m
      )
    );
  }, []);

  const sendTypingSignal = useCallback((toUserId: string, isTyping: boolean) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({ type: 'typing', fromUserId: currentUserIdRef.current, toUserId, isTyping })
      );
    }
  }, []);

  const clearPrefillMessageDraft = useCallback(() => {
    setPrefillMessageDraft(null);
  }, []);

  return (
    <SocialContext.Provider
      value={{
        loading,
        users,
        currentUser,
        posts,
        stories,
        reels,
        streams,
        listings,
        messages,
        onlineUserIds,
        typingUsers,
        liveFrames,
        freeMode,
        dataSavedKb,
        activeTab,
        inspectedUserId,
        activeChatUserId,
        activeStreamId,
        unreadMessageCount,
        setActiveTab,
        setFreeMode,
        recordDataUnlocked,
        switchUser,
        openUserProfile,
        openChatWithUser,
        openLiveStream,
        getUserById,
        toggleFollow,
        updateProfile,
        createAccount,
        createPost,
        reactToPost,
        commentOnPost,
        sharePost,
        createStory,
        markStoryViewed,
        createReel,
        likeReel,
        commentOnReel,
        createListing,
        toggleSaveListing,
        updateListingStatus,
        startLiveStream,
        endLiveStream,
        commentOnStream,
        reactToStream,
        sendStreamFrame,
        sendMessage,
        reactToMessage,
        markConversationRead,
        sendTypingSignal,
        prefillMessageDraft,
        clearPrefillMessageDraft,
      }}
    >
      {children}
    </SocialContext.Provider>
  );
};

export function useSocial() {
  const ctx = useContext(SocialContext);
  if (!ctx) throw new Error('useSocial must be used inside SocialProvider');
  return ctx;
}
