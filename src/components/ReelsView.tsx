import React, { useEffect, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Eye,
  Heart,
  MessageCircle,
  Music2,
  Pause,
  Play,
  Plus,
  Send,
  Share2,
  UserCheck,
  UserPlus,
  Volume2,
  VolumeX,
  WifiOff,
  X,
} from 'lucide-react';
import { useSocial } from '../context/SocialContext';
import { formatCount, formatRelativeTime, readFileAsDataUrl } from '../utils/format';

export const ReelsView: React.FC = () => {
  const {
    reels,
    currentUser,
    freeMode,
    recordDataUnlocked,
    getUserById,
    openUserProfile,
    toggleFollow,
    likeReel,
    commentOnReel,
    createReel,
  } = useSocial();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [muted, setMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [unlockedReelIds, setUnlockedReelIds] = useState<Record<string, boolean>>({});
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [newCaption, setNewCaption] = useState('');
  const [newAudio, setNewAudio] = useState('Neighborhood Sunset Beats');
  const [newPoster, setNewPoster] = useState<string | undefined>(undefined);
  const [newVideoUrl, setNewVideoUrl] = useState<string | undefined>(undefined);
  const [creating, setCreating] = useState(false);

  const activeReel = reels[currentIndex] || reels[0];
  const author = activeReel ? getUserById(activeReel.authorId) : undefined;
  const isLiked = Boolean(activeReel && currentUser && activeReel.likes.includes(currentUser.id));
  const isFollowing = Boolean(author && currentUser && currentUser.following.includes(author.id));
  const isMe = Boolean(author && currentUser && author.id === currentUser.id);

  const isVideoBlockedByFreeMode = freeMode && activeReel && !unlockedReelIds[activeReel.id];

  // Animate Reel playback progress bar
  useEffect(() => {
    setProgress(0);
  }, [currentIndex]);

  useEffect(() => {
    if (!isPlaying || isVideoBlockedByFreeMode || !activeReel) return;
    const stepMs = 100;
    const totalMs = activeReel.durationSec * 1000;
    const id = window.setInterval(() => {
      setProgress((prev) => {
        const next = prev + (stepMs / totalMs) * 100;
        return next >= 100 ? 0 : next;
      });
    }, stepMs);
    return () => window.clearInterval(id);
  }, [isPlaying, isVideoBlockedByFreeMode, activeReel]);

  const handlePrev = () => {
    setShowComments(false);
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : reels.length - 1));
  };

  const handleNext = () => {
    setShowComments(false);
    setCurrentIndex((prev) => (prev + 1) % Math.max(1, reels.length));
  };

  const handleVideoOrImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await readFileAsDataUrl(file);
    if (file.type.startsWith('video/')) {
      setNewVideoUrl(dataUrl);
    } else {
      setNewPoster(dataUrl);
    }
  };

  const handlePublishReel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCaption.trim()) return;
    setCreating(true);
    try {
      await createReel({
        caption: newCaption,
        audioTrack: newAudio,
        posterImage: newPoster,
        videoUrl: newVideoUrl,
      });
      setNewCaption('');
      setNewPoster(undefined);
      setNewVideoUrl(undefined);
      setShowCreateModal(false);
      setCurrentIndex(0);
    } finally {
      setCreating(false);
    }
  };

  if (!activeReel) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
        <p className="text-sm font-semibold text-slate-900">No Reels published yet</p>
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="mt-3 min-h-[44px] px-5 py-2 rounded-xl bg-[#1877F2] text-white text-xs font-semibold"
        >
          Create First Reel
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Reels</h1>
          <p className="text-xs text-slate-500 tabular-nums">
            Reel {currentIndex + 1} of {reels.length} · Short vertical clips
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="min-h-[44px] px-4 py-2 rounded-xl bg-[#1877F2] text-white text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-[#166FE5] transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create Reel</span>
        </button>
      </div>

      {/* Main Reels Theater */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-4">
        <div className="relative w-full max-w-[390px] aspect-[9/16] max-h-[680px] rounded-3xl overflow-hidden bg-slate-950 text-white shadow-xl border border-slate-800">
          {/* Video / Motion Visual OR Free Mode Zero-Data Slate */}
          {isVideoBlockedByFreeMode ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-900">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mb-3">
                <WifiOff className="w-6 h-6 text-sky-400" />
              </div>
              <p className="text-base font-bold text-white">Reel Video Paused in Free Mode</p>
              <p className="text-xs text-slate-300 mt-1.5 max-w-[260px] leading-relaxed">
                Video streaming is turned off to protect your mobile data balance.
              </p>
              <p className="text-xs text-slate-400 mt-3 italic px-3 py-2 rounded-xl bg-slate-800/80">
                &ldquo;{activeReel.caption}&rdquo;
              </p>
              <button
                type="button"
                onClick={() => {
                  setUnlockedReelIds((prev) => ({ ...prev, [activeReel.id]: true }));
                  recordDataUnlocked(Math.round(activeReel.sizeMb * 1024));
                }}
                className="mt-4 min-h-[44px] px-5 py-2.5 rounded-xl bg-white text-slate-900 text-xs font-bold inline-flex items-center gap-2 hover:bg-slate-100 transition-colors"
              >
                <Eye className="w-4 h-4" />
                <span>Use Data to Watch ({activeReel.sizeMb.toFixed(1)} MB)</span>
              </button>
            </div>
          ) : (
            <div
              onClick={() => setIsPlaying((p) => !p)}
              className="absolute inset-0 cursor-pointer select-none"
            >
              {activeReel.videoUrl ? (
                <video
                  src={activeReel.videoUrl}
                  autoPlay={isPlaying}
                  loop
                  muted={muted}
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={activeReel.posterImage}
                  alt={activeReel.caption}
                  referrerPolicy="no-referrer"
                  className={`w-full h-full object-cover transition-transform duration-[4000ms] ease-out ${
                    isPlaying ? 'scale-105' : 'scale-100'
                  }`}
                />
              )}

              {/* Contrast Scrim */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-black/35 pointer-events-none" />

              {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-14 h-14 rounded-full bg-black/55 backdrop-blur-sm flex items-center justify-center">
                    <Play className="w-6 h-6 text-white fill-white ml-0.5" />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Top Progress & Mute Controls */}
          <div className="absolute top-0 left-0 right-0 p-4 z-10 flex flex-col gap-2.5 pointer-events-none">
            <div className="w-full h-1 bg-white/25 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-100"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex items-center justify-between pointer-events-auto">
              <span className="text-xs font-semibold text-white/90 tabular-nums">
                {formatCount(activeReel.views)} views
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPlaying((p) => !p)}
                  aria-label={isPlaying ? 'Pause reel' : 'Play reel'}
                  className="w-9 h-9 rounded-full bg-black/45 backdrop-blur-sm flex items-center justify-center hover:bg-black/65"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => setMuted((m) => !m)}
                  aria-label={muted ? 'Unmute reel' : 'Mute reel'}
                  className="w-9 h-9 rounded-full bg-black/45 backdrop-blur-sm flex items-center justify-center hover:bg-black/65"
                >
                  {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Right Vertical Action Rail */}
          <div className="absolute right-3 bottom-24 z-10 flex flex-col items-center gap-4">
            <button
              type="button"
              onClick={() => likeReel(activeReel.id)}
              className="flex flex-col items-center gap-1 min-w-[44px] min-h-[44px] justify-center"
            >
              <span
                className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-sm transition-colors ${
                  isLiked ? 'bg-rose-600 text-white' : 'bg-black/45 text-white hover:bg-black/65'
                }`}
              >
                <Heart className={`w-5 h-5 ${isLiked ? 'fill-white' : ''}`} />
              </span>
              <span className="text-[11px] font-semibold tabular-nums">
                {formatCount(activeReel.likes.length)}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setShowComments(true)}
              className="flex flex-col items-center gap-1 min-w-[44px] min-h-[44px] justify-center"
            >
              <span className="w-11 h-11 rounded-full bg-black/45 backdrop-blur-sm flex items-center justify-center hover:bg-black/65">
                <MessageCircle className="w-5 h-5" />
              </span>
              <span className="text-[11px] font-semibold tabular-nums">
                {formatCount(activeReel.comments.length)}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(window.location.href).catch(() => {});
              }}
              className="flex flex-col items-center gap-1 min-w-[44px] min-h-[44px] justify-center"
            >
              <span className="w-11 h-11 rounded-full bg-black/45 backdrop-blur-sm flex items-center justify-center hover:bg-black/65">
                <Share2 className="w-5 h-5" />
              </span>
              <span className="text-[11px] font-semibold">Share</span>
            </button>
          </div>

          {/* Bottom Creator Info & Caption */}
          <div className="absolute bottom-0 left-0 right-16 p-4 z-10">
            <div className="flex items-center gap-2.5 mb-2">
              <button
                type="button"
                onClick={() => author && openUserProfile(author.id)}
                className="w-9 h-9 rounded-full overflow-hidden border border-white/40 bg-slate-700 shrink-0"
              >
                {!freeMode && author ? (
                  <img
                    src={author.avatar}
                    alt={author.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs font-bold">
                    {(author?.name || 'U').slice(0, 2).toUpperCase()}
                  </div>
                )}
              </button>
              <button
                type="button"
                onClick={() => author && openUserProfile(author.id)}
                className="text-sm font-bold text-white hover:underline truncate"
              >
                {author?.name || 'Creator'}
              </button>
              {!isMe && author && (
                <button
                  type="button"
                  onClick={() => toggleFollow(author.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 ${
                    isFollowing
                      ? 'bg-white/20 text-white'
                      : 'bg-[#1877F2] text-white hover:bg-[#166FE5]'
                  }`}
                >
                  {isFollowing ? (
                    <>
                      <UserCheck className="w-3 h-3" />
                      <span>Following</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3 h-3" />
                      <span>Follow</span>
                    </>
                  )}
                </button>
              )}
            </div>
            <p className="text-xs text-white/95 leading-relaxed line-clamp-2">{activeReel.caption}</p>
            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-white/75">
              <Music2 className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{activeReel.audioTrack}</span>
            </div>
          </div>

          {/* Comments Bottom Sheet Inside Reel */}
          {showComments && (
            <div className="absolute inset-x-0 bottom-0 top-24 z-20 bg-white text-slate-900 rounded-t-3xl flex flex-col shadow-2xl">
              <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                <h3 className="text-sm font-bold tabular-nums">
                  Comments ({activeReel.comments.length})
                </h3>
                <button
                  type="button"
                  onClick={() => setShowComments(false)}
                  aria-label="Close comments"
                  className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {activeReel.comments.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-8">
                    No comments yet. Start the conversation.
                  </p>
                ) : (
                  activeReel.comments.map((c) => {
                    const commenter = getUserById(c.authorId);
                    return (
                      <div key={c.id} className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden shrink-0">
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
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">
                              {commenter?.name || 'Neighbor'}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {formatRelativeTime(c.createdAt)}
                            </span>
                          </div>
                          <p className="text-xs text-slate-700 mt-0.5">{c.text}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!commentText.trim()) return;
                  const txt = commentText.trim();
                  setCommentText('');
                  await commentOnReel(activeReel.id, txt);
                }}
                className="p-3 border-t border-slate-200 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 min-h-[40px] rounded-xl bg-slate-100 px-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1877F2]/30"
                />
                <button
                  type="submit"
                  className="min-h-[40px] min-w-[40px] rounded-xl bg-[#1877F2] text-white flex items-center justify-center"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Vertical Stepper Controls */}
        <div className="flex md:flex-col items-center gap-2">
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous reel"
            className="w-11 h-11 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center justify-center shadow-sm"
          >
            <ChevronUp className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            aria-label="Next reel"
            className="w-11 h-11 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center justify-center shadow-sm"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Create Reel Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <form
            onSubmit={handlePublishReel}
            className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Publish New Reel</h2>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Caption</label>
              <textarea
                required
                rows={3}
                value={newCaption}
                onChange={(e) => setNewCaption(e.target.value)}
                placeholder="Describe your short video clip..."
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-[#1877F2]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Audio Track</label>
              <input
                type="text"
                value={newAudio}
                onChange={(e) => setNewAudio(e.target.value)}
                className="w-full min-h-[42px] rounded-xl border border-slate-200 px-3 text-sm focus:outline-none focus:border-[#1877F2]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Video or Cover Frame (optional)
              </label>
              <input
                type="file"
                accept="video/*,image/*"
                onChange={handleVideoOrImageUpload}
                className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-800 hover:file:bg-slate-200"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating || !newCaption.trim()}
                className="min-h-[44px] px-5 py-2 rounded-xl bg-[#1877F2] text-white text-xs font-semibold hover:bg-[#166FE5] disabled:opacity-50"
              >
                {creating ? 'Publishing...' : 'Publish Reel'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
