import React, { useMemo, useState } from 'react';
import {
  Heart,
  ImagePlus,
  MapPin,
  MessageCircle,
  Send,
  Share2,
  Smile,
  Sparkles,
  ThumbsUp,
  UserCheck,
  UserPlus,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';
import { useSocial } from '../context/SocialContext';
import { SmartMedia } from './SmartMedia';
import { StoriesBar } from './StoriesBar';
import { formatCount, formatDataSize, formatRelativeTime, readFileAsDataUrl } from '../utils/format';
import type { FeedPost, ReactionType } from '../types';

const REACTION_META: { key: ReactionType; label: string; colorClass: string }[] = [
  { key: 'like', label: 'Like', colorClass: 'text-[#1877F2]' },
  { key: 'love', label: 'Love', colorClass: 'text-rose-600' },
  { key: 'haha', label: 'Haha', colorClass: 'text-amber-600' },
  { key: 'wow', label: 'Wow', colorClass: 'text-indigo-600' },
];

export const FeedView: React.FC = () => {
  const {
    currentUser,
    posts,
    users,
    freeMode,
    setFreeMode,
    dataSavedKb,
    recordDataUnlocked,
    getUserById,
    openUserProfile,
    toggleFollow,
    createPost,
    reactToPost,
    commentOnPost,
    sharePost,
    openLiveStream,
    streams,
  } = useSocial();

  const [filterMode, setFilterMode] = useState<'all' | 'following'>('all');
  const [draftText, setDraftText] = useState('');
  const [draftLocation, setDraftLocation] = useState('');
  const [draftImage, setDraftImage] = useState<string | undefined>(undefined);
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [openReactionPicker, setOpenReactionPicker] = useState<string | null>(null);
  const [shareToastId, setShareToastId] = useState<string | null>(null);

  const filteredPosts = useMemo(() => {
    if (filterMode === 'all' || !currentUser) return posts;
    const followingSet = new Set([currentUser.id, ...currentUser.following]);
    return posts.filter((p) => followingSet.has(p.authorId));
  }, [posts, filterMode, currentUser]);

  const activeLiveStreams = useMemo(() => streams.filter((s) => s.isLive), [streams]);

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await readFileAsDataUrl(file);
    setDraftImage(dataUrl);
  };

  const handlePublishPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftText.trim() && !draftImage) return;
    setSubmitting(true);
    try {
      await createPost({
        content: draftText,
        image: draftImage,
        location: draftLocation || undefined,
      });
      setDraftText('');
      setDraftImage(undefined);
      setDraftLocation('');
      setShowLocationInput(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddComment = async (postId: string) => {
    const text = (commentInputs[postId] || '').trim();
    if (!text) return;
    setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
    await commentOnPost(postId, text);
  };

  const handleShare = async (postId: string) => {
    await sharePost(postId);
    setShareToastId(postId);
    window.setTimeout(() => {
      setShareToastId((prev) => (prev === postId ? null : prev));
    }, 2000);
  };

  const getUserReaction = (post: FeedPost): ReactionType | null => {
    if (!currentUser) return null;
    for (const r of REACTION_META) {
      if (post.reactions[r.key]?.includes(currentUser.id)) return r.key;
    }
    return null;
  };

  const getTotalReactions = (post: FeedPost): number => {
    return Object.values(post.reactions).reduce((sum, list) => sum + list.length, 0);
  };

  return (
    <div className="space-y-4">
      {/* Free Mode Zero-Data Banner (Inline, non-sticky for 15% mobile sticky cap compliance) */}
      {freeMode && (
        <div className="rounded-2xl bg-slate-900 text-white px-4 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center shrink-0">
              <WifiOff className="w-4 h-4 text-sky-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-tight">
                Free Mode Active · Zero-Data Plan
              </p>
              <p className="text-xs text-slate-300 mt-0.5 tabular-nums">
                Photos &amp; videos paused · {formatDataSize(dataSavedKb)} saved this session
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setFreeMode(false)}
            className="min-h-[40px] px-4 py-2 rounded-lg bg-white text-slate-900 text-xs font-semibold hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0"
          >
            See Photos
          </button>
        </div>
      )}

      {/* User Stories Strip */}
      <StoriesBar />

      {/* Active Live Broadcast Strip */}
      {activeLiveStreams.length > 0 && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-900">Live Now Nearby</h2>
            <button
              type="button"
              onClick={() => openLiveStream(null)}
              className="text-xs font-semibold text-[#1877F2] hover:underline whitespace-nowrap shrink-0"
            >
              See all streams
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
            {activeLiveStreams.map((stream) => {
              const host = getUserById(stream.hostId);
              return (
                <button
                  key={stream.id}
                  type="button"
                  onClick={() => openLiveStream(stream.id)}
                  className="flex items-center gap-3 min-w-[230px] max-w-[270px] p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/70 text-left transition-colors shrink-0"
                >
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-200 shrink-0">
                    {!freeMode ? (
                      <img
                        src={stream.thumbnail}
                        alt={stream.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-800 text-white text-[10px] font-bold">
                        LIVE
                      </div>
                    )}
                    <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-rose-600 text-white text-[9px] font-bold tracking-wide">
                      LIVE
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-900 truncate">{stream.title}</p>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5 tabular-nums">
                      {host?.name || 'Host'} · {stream.viewerCount} watching
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Post Composer */}
      <form
        onSubmit={handlePublishPost}
        className="bg-white border border-slate-200/80 rounded-2xl p-4"
      >
        <div className="flex gap-3">
          {currentUser && (
            <button
              type="button"
              onClick={() => openUserProfile(currentUser.id)}
              className="w-10 h-10 rounded-full overflow-hidden bg-slate-200 shrink-0"
            >
              {!freeMode ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-800 text-white text-xs font-bold">
                  {currentUser.name.slice(0, 2).toUpperCase()}
                </div>
              )}
            </button>
          )}
          <div className="flex-1 min-w-0">
            <textarea
              rows={2}
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
              placeholder={`Share an update with your neighborhood, ${currentUser?.name.split(' ')[0] || 'friend'}...`}
              className="w-full resize-none rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1877F2]/30 focus:border-[#1877F2]"
            />

            {showLocationInput && (
              <div className="mt-2 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={draftLocation}
                  onChange={(e) => setDraftLocation(e.target.value)}
                  placeholder="Add neighborhood or place..."
                  className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#1877F2]"
                />
              </div>
            )}

            {draftImage && (
              <div className="relative mt-3 rounded-xl overflow-hidden border border-slate-200 max-h-56">
                <img
                  src={draftImage}
                  alt="Post upload preview"
                  className="w-full h-48 object-cover"
                />
                <button
                  type="button"
                  onClick={() => setDraftImage(undefined)}
                  aria-label="Remove attached photo"
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-slate-900/75 text-white flex items-center justify-center hover:bg-slate-900"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1">
                <label className="min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 cursor-pointer inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0">
                  <ImagePlus className="w-4 h-4 text-emerald-600" />
                  <span>Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setShowLocationInput((prev) => !prev)}
                  className="min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                >
                  <MapPin className="w-4 h-4 text-rose-500" />
                  <span>Location</span>
                </button>
              </div>

              <button
                type="submit"
                disabled={submitting || (!draftText.trim() && !draftImage)}
                className="min-h-[40px] px-5 py-2 rounded-lg bg-[#1877F2] text-white text-xs font-semibold hover:bg-[#166FE5] disabled:opacity-45 disabled:cursor-not-allowed transition-colors whitespace-nowrap shrink-0"
              >
                {submitting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Feed Filter Segmented Bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="inline-flex items-center gap-1 p-1 bg-white border border-slate-200/80 rounded-xl">
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`min-h-[36px] px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              filterMode === 'all'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Community
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('following')}
            className={`min-h-[36px] px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              filterMode === 'following'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Following ({currentUser?.following.length || 0})
          </button>
        </div>

        <button
          type="button"
          onClick={() => setFreeMode(!freeMode)}
          className={`min-h-[36px] px-3 py-1.5 rounded-xl border text-xs font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
            freeMode
              ? 'bg-slate-900 border-slate-900 text-white'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          {freeMode ? <WifiOff className="w-3.5 h-3.5 text-sky-400" /> : <Wifi className="w-3.5 h-3.5 text-slate-500" />}
          <span>{freeMode ? 'Free Mode On' : 'Free Mode'}</span>
        </button>
      </div>

      {/* Posts Feed */}
      {filteredPosts.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-8 text-center">
          <p className="text-sm font-semibold text-slate-800">No posts from people you follow yet</p>
          <p className="text-xs text-slate-500 mt-1">
            Switch to All Community or follow neighbors to see their latest posts.
          </p>
        </div>
      ) : (
        filteredPosts.map((post) => {
          const author = getUserById(post.authorId) || users[0];
          const isMe = currentUser?.id === author?.id;
          const isFollowing = Boolean(author && currentUser?.following.includes(author.id));
          const myReaction = getUserReaction(post);
          const totalReactions = getTotalReactions(post);
          const commentsOpen = Boolean(expandedComments[post.id]);

          return (
            <article
              key={post.id}
              className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden"
            >
              {/* Post Header */}
              <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => author && openUserProfile(author.id)}
                    className="w-10 h-10 rounded-full overflow-hidden bg-slate-200 shrink-0"
                  >
                    {!freeMode && author ? (
                      <img
                        src={author.avatar}
                        alt={author.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-800 text-white text-xs font-bold">
                        {(author?.name || 'U').slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </button>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => author && openUserProfile(author.id)}
                        className="text-sm font-bold text-slate-900 hover:underline truncate"
                      >
                        {author?.name || 'Neighbor'}
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <span>{formatRelativeTime(post.createdAt)}</span>
                      {post.location && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="truncate">{post.location}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {!isMe && author && (
                  <button
                    type="button"
                    onClick={() => toggleFollow(author.id)}
                    className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                      isFollowing
                        ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        : 'bg-[#1877F2]/10 text-[#1877F2] hover:bg-[#1877F2]/15'
                    }`}
                  >
                    {isFollowing ? (
                      <>
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Following</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Follow</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Post Copy */}
              {post.content && (
                <p className="px-4 pb-3 text-[15px] leading-relaxed text-slate-800 whitespace-pre-line">
                  {post.content}
                </p>
              )}

              {/* Post Photo */}
              {post.image && (
                <SmartMedia
                  src={post.image}
                  alt={`Photo shared by ${author?.name || 'neighbor'}`}
                  sizeKb={post.imageSizeKb || 260}
                  freeMode={freeMode}
                  onUnlockCost={recordDataUnlocked}
                  aspectClass="aspect-[4/3] max-h-[440px] w-full"
                />
              )}

              {/* Counts Summary Row */}
              <div className="px-4 py-2.5 flex items-center justify-between text-xs text-slate-500 border-b border-slate-100 tabular-nums">
                <span>
                  {totalReactions > 0
                    ? `${formatCount(totalReactions)} ${totalReactions === 1 ? 'reaction' : 'reactions'}`
                    : 'Be the first to react'}
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedComments((prev) => ({ ...prev, [post.id]: !prev[post.id] }))
                    }
                    className="hover:underline"
                  >
                    {post.comments.length} {post.comments.length === 1 ? 'comment' : 'comments'}
                  </button>
                  <span>
                    {post.shares} {post.shares === 1 ? 'share' : 'shares'}
                  </span>
                </div>
              </div>

              {/* Action Bar */}
              <div className="px-2 py-1 grid grid-cols-3 gap-1 relative">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => reactToPost(post.id, myReaction || 'like')}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setOpenReactionPicker((prev) => (prev === post.id ? null : post.id));
                    }}
                    className={`w-full min-h-[44px] rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-1.5 hover:bg-slate-50 transition-colors ${
                      myReaction
                        ? REACTION_META.find((r) => r.key === myReaction)?.colorClass || 'text-[#1877F2]'
                        : 'text-slate-600'
                    }`}
                  >
                    {myReaction === 'love' ? (
                      <Heart className="w-4 h-4 fill-current" />
                    ) : myReaction === 'haha' ? (
                      <Smile className="w-4 h-4" />
                    ) : myReaction === 'wow' ? (
                      <Sparkles className="w-4 h-4" />
                    ) : (
                      <ThumbsUp className={`w-4 h-4 ${myReaction === 'like' ? 'fill-current' : ''}`} />
                    )}
                    <span>
                      {myReaction ? REACTION_META.find((r) => r.key === myReaction)?.label : 'Like'}
                    </span>
                  </button>
                  <button
                    type="button"
                    aria-label="More reactions"
                    onClick={() =>
                      setOpenReactionPicker((prev) => (prev === post.id ? null : post.id))
                    }
                    className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700"
                  >
                    <Smile className="w-3.5 h-3.5" />
                  </button>

                  {openReactionPicker === post.id && (
                    <div className="absolute bottom-full left-1 mb-1 z-20 flex items-center gap-1 bg-white border border-slate-200 rounded-xl shadow-lg p-1.5">
                      {REACTION_META.map((r) => (
                        <button
                          key={r.key}
                          type="button"
                          onClick={() => {
                            reactToPost(post.id, r.key);
                            setOpenReactionPicker(null);
                          }}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-slate-100 ${r.colorClass}`}
                        >
                          {r.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setExpandedComments((prev) => ({ ...prev, [post.id]: !prev[post.id] }))
                  }
                  className="w-full min-h-[44px] rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 inline-flex items-center justify-center gap-1.5 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Comment</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleShare(post.id)}
                  className="w-full min-h-[44px] rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 inline-flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  <span>{shareToastId === post.id ? 'Shared' : 'Share'}</span>
                </button>
              </div>

              {/* Comments Section */}
              {commentsOpen && (
                <div className="px-4 py-3 bg-slate-50/70 border-t border-slate-100 space-y-3">
                  {post.comments.map((c) => {
                    const commenter = getUserById(c.authorId);
                    return (
                      <div key={c.id} className="flex items-start gap-2.5">
                        <button
                          type="button"
                          onClick={() => commenter && openUserProfile(commenter.id)}
                          className="w-8 h-8 rounded-full overflow-hidden bg-slate-200 shrink-0 mt-0.5"
                        >
                          {!freeMode && commenter ? (
                            <img
                              src={commenter.avatar}
                              alt={commenter.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-slate-700 text-white text-[10px] font-bold">
                              {(commenter?.name || 'U').slice(0, 2).toUpperCase()}
                            </div>
                          )}
                        </button>
                        <div className="flex-1 min-w-0 bg-white border border-slate-200/70 rounded-xl px-3 py-2">
                          <div className="flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => commenter && openUserProfile(commenter.id)}
                              className="text-xs font-bold text-slate-900 hover:underline truncate"
                            >
                              {commenter?.name || 'Neighbor'}
                            </button>
                            <span className="text-[11px] text-slate-400 shrink-0">
                              {formatRelativeTime(c.createdAt)}
                            </span>
                          </div>
                          <p className="text-xs text-slate-700 mt-0.5 leading-relaxed">{c.text}</p>
                        </div>
                      </div>
                    );
                  })}

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleAddComment(post.id);
                    }}
                    className="flex items-center gap-2 pt-1"
                  >
                    <input
                      type="text"
                      value={commentInputs[post.id] || ''}
                      onChange={(e) =>
                        setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))
                      }
                      placeholder="Write a comment..."
                      className="flex-1 min-h-[40px] rounded-xl bg-white border border-slate-200 px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#1877F2]"
                    />
                    <button
                      type="submit"
                      aria-label="Send comment"
                      className="min-h-[40px] min-w-[40px] rounded-xl bg-[#1877F2] text-white flex items-center justify-center hover:bg-[#166FE5] transition-colors shrink-0"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              )}
            </article>
          );
        })
      )}
    </div>
  );
};
