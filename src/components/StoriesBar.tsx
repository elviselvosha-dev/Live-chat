import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Eye, ImagePlus, Plus, Send, WifiOff, X } from 'lucide-react';
import { useSocial } from '../context/SocialContext';
import { formatRelativeTime, readFileAsDataUrl } from '../utils/format';

const STORY_BG_PRESETS = [
  { label: 'Cobalt Blue', value: 'from-[#1877F2] to-indigo-700' },
  { label: 'Emerald Dusk', value: 'from-emerald-600 to-teal-800' },
  { label: 'Slate Midnight', value: 'from-slate-800 to-slate-950' },
  { label: 'Amber Sunset', value: 'from-amber-500 to-rose-600' },
];

export const StoriesBar: React.FC = () => {
  const {
    stories,
    currentUser,
    freeMode,
    getUserById,
    openUserProfile,
    createStory,
    markStoryViewed,
    sendMessage,
    recordDataUnlocked,
  } = useSocial();

  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [replyText, setReplyText] = useState('');
  const [replySentNotice, setReplySentNotice] = useState(false);
  const [unlockedStoryIds, setUnlockedStoryIds] = useState<Record<string, boolean>>({});

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCaption, setNewCaption] = useState('');
  const [newMediaUrl, setNewMediaUrl] = useState<string | undefined>(undefined);
  const [newBgColor, setNewBgColor] = useState(STORY_BG_PRESETS[0].value);
  const [publishing, setPublishing] = useState(false);

  const activeStory = viewerIndex !== null ? stories[viewerIndex] || null : null;
  const activeAuthor = activeStory ? getUserById(activeStory.authorId) : undefined;

  useEffect(() => {
    if (!activeStory) return;
    setProgress(0);
    markStoryViewed(activeStory.id);

    const durationMs = 6000;
    const stepMs = 80;
    const timer = window.setInterval(() => {
      setProgress((prev) => {
        const next = prev + (stepMs / durationMs) * 100;
        if (next >= 100) {
          setViewerIndex((idx) => {
            if (idx === null) return null;
            return idx + 1 < stories.length ? idx + 1 : null;
          });
          return 0;
        }
        return next;
      });
    }, stepMs);

    return () => window.clearInterval(timer);
  }, [activeStory?.id, stories.length, markStoryViewed]);

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await readFileAsDataUrl(file);
    setNewMediaUrl(dataUrl);
  };

  const handlePublishStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCaption.trim() && !newMediaUrl) return;
    setPublishing(true);
    try {
      await createStory({
        caption: newCaption,
        mediaUrl: newMediaUrl,
        bgColor: newBgColor,
      });
      setNewCaption('');
      setNewMediaUrl(undefined);
      setShowCreateModal(false);
    } finally {
      setPublishing(false);
    }
  };

  const handleReplyInMessenger = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStory || !replyText.trim() || !activeAuthor) return;
    const txt = replyText.trim();
    setReplyText('');
    await sendMessage(
      activeAuthor.id,
      `Replied to your story: "${txt}"`
    );
    setReplySentNotice(true);
    window.setTimeout(() => setReplySentNotice(false), 2000);
  };

  return (
    <>
      <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5">
        <div className="flex items-center justify-between mb-2.5 px-0.5">
          <h2 className="text-sm font-bold text-slate-900">Stories</h2>
          <span className="text-xs text-slate-500 tabular-nums">{stories.length} active</span>
        </div>

        <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
          {/* Create Story Card */}
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="relative w-[108px] h-[176px] rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors flex flex-col shrink-0 text-left group"
          >
            <div className="h-[116px] w-full bg-slate-200 overflow-hidden">
              {currentUser && !freeMode ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-800 text-white text-sm font-bold">
                  {(currentUser?.name || 'You').slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>
            <div className="relative flex-1 bg-white flex flex-col items-center justify-end pb-2.5 px-1.5">
              <span className="absolute -top-4 w-8 h-8 rounded-full bg-[#1877F2] text-white border-2 border-white flex items-center justify-center shadow-sm">
                <Plus className="w-4 h-4" />
              </span>
              <span className="text-[11px] font-bold text-slate-900 text-center leading-tight">
                Create Story
              </span>
            </div>
          </button>

          {/* Neighbor Stories */}
          {stories.map((story, idx) => {
            const author = getUserById(story.authorId);
            const hasViewed = Boolean(currentUser && story.viewedBy.includes(currentUser.id));

            return (
              <button
                key={story.id}
                type="button"
                onClick={() => setViewerIndex(idx)}
                className="relative w-[108px] h-[176px] rounded-2xl overflow-hidden bg-slate-900 text-white shrink-0 text-left group border border-slate-200/70"
              >
                {story.mediaUrl && !freeMode ? (
                  <img
                    src={story.mediaUrl}
                    alt={story.caption || 'User story'}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div
                    className={`w-full h-full bg-gradient-to-br ${
                      story.bgColor || 'from-slate-800 to-slate-950'
                    } p-2.5 flex items-center justify-center`}
                  >
                    <p className="text-[11px] font-medium text-white/95 line-clamp-4 text-center leading-snug">
                      {story.caption || 'Photo story'}
                    </p>
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/30 pointer-events-none" />

                {/* Author Avatar Ring */}
                <div
                  className={`absolute top-2.5 left-2.5 w-9 h-9 rounded-full p-0.5 ${
                    hasViewed ? 'bg-white/60' : 'bg-[#1877F2]'
                  }`}
                >
                  <div className="w-full h-full rounded-full overflow-hidden border border-white bg-slate-700">
                    {!freeMode && author ? (
                      <img
                        src={author.avatar}
                        alt={author.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] font-bold">
                        {(author?.name || 'U').slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>

                <span className="absolute bottom-2.5 left-2.5 right-2.5 text-[11px] font-semibold text-white truncate">
                  {author?.id === currentUser?.id ? 'Your Story' : author?.name || 'Neighbor'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Story Viewer Modal */}
      {activeStory && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-0 sm:p-4">
          <div className="relative w-full h-full sm:h-auto sm:max-w-[400px] sm:aspect-[9/16] sm:max-h-[700px] sm:rounded-3xl overflow-hidden bg-slate-950 text-white flex flex-col">
            {/* Background Media / Card */}
            {activeStory.mediaUrl && !(freeMode && !unlockedStoryIds[activeStory.id]) ? (
              <img
                src={activeStory.mediaUrl}
                alt={activeStory.caption || 'Story'}
                referrerPolicy="no-referrer"
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div
                className={`absolute inset-0 bg-gradient-to-br ${
                  activeStory.bgColor || 'from-slate-800 to-slate-950'
                } flex flex-col items-center justify-center p-8 text-center`}
              >
                {activeStory.mediaUrl && freeMode && !unlockedStoryIds[activeStory.id] ? (
                  <div className="space-y-3">
                    <WifiOff className="w-7 h-7 text-sky-400 mx-auto" />
                    <p className="text-sm font-bold">Story Photo Paused in Free Mode</p>
                    <p className="text-xs text-slate-200">{activeStory.caption}</p>
                    <button
                      type="button"
                      onClick={() => {
                        setUnlockedStoryIds((prev) => ({ ...prev, [activeStory.id]: true }));
                        recordDataUnlocked(220);
                      }}
                      className="min-h-[40px] px-4 py-2 rounded-xl bg-white text-slate-900 text-xs font-bold inline-flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Load Photo (220 KB)</span>
                    </button>
                  </div>
                ) : (
                  <p className="text-lg font-bold leading-relaxed">{activeStory.caption}</p>
                )}
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/55 pointer-events-none" />

            {/* Top Progress Bars + Author Header */}
            <div className="relative z-10 p-4 space-y-3">
              <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${stories.length}, 1fr)` }}>
                {stories.map((s, idx) => (
                  <div key={s.id} className="h-1 bg-white/30 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white transition-all duration-75"
                      style={{
                        width:
                          viewerIndex !== null && idx < viewerIndex
                            ? '100%'
                            : idx === viewerIndex
                              ? `${progress}%`
                              : '0%',
                      }}
                    />
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (activeAuthor) {
                      setViewerIndex(null);
                      openUserProfile(activeAuthor.id);
                    }
                  }}
                  className="flex items-center gap-2.5 min-w-0 text-left"
                >
                  <div className="w-9 h-9 rounded-full overflow-hidden border border-white/50 bg-slate-700 shrink-0">
                    {!freeMode && activeAuthor ? (
                      <img
                        src={activeAuthor.avatar}
                        alt={activeAuthor.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs font-bold">
                        {(activeAuthor?.name || 'U').slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">
                      {activeAuthor?.name || 'Neighbor'}
                    </p>
                    <p className="text-[11px] text-white/75">
                      {formatRelativeTime(activeStory.createdAt)} · {activeStory.viewedBy.length} views
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setViewerIndex(null)}
                  aria-label="Close story viewer"
                  className="w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Prev / Next Tap Controls */}
            <div className="relative z-10 flex-1 flex items-center justify-between px-2">
              <button
                type="button"
                aria-label="Previous story"
                onClick={() =>
                  setViewerIndex((idx) => (idx !== null && idx > 0 ? idx - 1 : stories.length - 1))
                }
                className="w-10 h-10 rounded-full bg-black/35 hover:bg-black/55 flex items-center justify-center"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                aria-label="Next story"
                onClick={() =>
                  setViewerIndex((idx) =>
                    idx !== null && idx + 1 < stories.length ? idx + 1 : null
                  )
                }
                className="w-10 h-10 rounded-full bg-black/35 hover:bg-black/55 flex items-center justify-center"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Bottom Caption + Messenger Quick Reply */}
            <div className="relative z-10 p-4 space-y-3">
              {activeStory.mediaUrl && activeStory.caption && (
                <p className="text-xs text-white/95 leading-relaxed">{activeStory.caption}</p>
              )}

              {activeAuthor && activeAuthor.id !== currentUser?.id && (
                <form onSubmit={handleReplyInMessenger} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={
                      replySentNotice
                        ? 'Sent to Messenger!'
                        : `Reply to ${activeAuthor.name.split(' ')[0]} in Messenger...`
                    }
                    className="flex-1 min-h-[42px] rounded-full bg-white/15 border border-white/25 px-4 text-xs text-white placeholder:text-white/70 focus:outline-none focus:bg-white/20"
                  />
                  <button
                    type="submit"
                    aria-label="Send story reply to Messenger"
                    className="min-h-[42px] min-w-[42px] rounded-full bg-[#1877F2] text-white flex items-center justify-center hover:bg-[#166FE5]"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Story Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <form
            onSubmit={handlePublishStory}
            className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Add to Your Story</h2>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Story Caption
              </label>
              <textarea
                rows={3}
                value={newCaption}
                onChange={(e) => setNewCaption(e.target.value)}
                placeholder="Share a quick 24-hour update with neighbors..."
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-[#1877F2]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Photo or Card Background
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                <label className="min-h-[40px] px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-800 cursor-pointer inline-flex items-center gap-1.5">
                  <ImagePlus className="w-4 h-4 text-[#1877F2]" />
                  <span>{newMediaUrl ? 'Change Photo' : 'Upload Photo'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                </label>

                {!newMediaUrl &&
                  STORY_BG_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setNewBgColor(preset.value)}
                      aria-label={preset.label}
                      className={`w-8 h-8 rounded-full bg-gradient-to-br ${preset.value} ${
                        newBgColor === preset.value ? 'ring-2 ring-offset-2 ring-slate-900' : ''
                      }`}
                    />
                  ))}
              </div>
            </div>

            {newMediaUrl && (
              <div className="relative rounded-xl overflow-hidden border border-slate-200 max-h-44">
                <img src={newMediaUrl} alt="Story preview" className="w-full h-40 object-cover" />
                <button
                  type="button"
                  onClick={() => setNewMediaUrl(undefined)}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-slate-900/75 text-white flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

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
                disabled={publishing || (!newCaption.trim() && !newMediaUrl)}
                className="min-h-[44px] px-5 py-2 rounded-xl bg-[#1877F2] text-white text-xs font-semibold hover:bg-[#166FE5] disabled:opacity-50"
              >
                {publishing ? 'Sharing...' : 'Share Story'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};
