import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Send, ShoppingBag, SmilePlus, User } from 'lucide-react';
import { useSocial } from '../context/SocialContext';
import { formatRelativeTime } from '../utils/format';

const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

export const MessagesView: React.FC = () => {
  const {
    users,
    currentUser,
    messages,
    listings,
    onlineUserIds,
    typingUsers,
    freeMode,
    activeChatUserId,
    openChatWithUser,
    openUserProfile,
    sendMessage,
    reactToMessage,
    markConversationRead,
    sendTypingSignal,
    prefillMessageDraft,
    clearPrefillMessageDraft,
  } = useSocial();

  const [selectedPeerId, setSelectedPeerId] = useState<string | null>(activeChatUserId);
  const [mobileShowThread, setMobileShowThread] = useState(Boolean(activeChatUserId));
  const [draft, setDraft] = useState('');
  const [reactionTargetId, setReactionTargetId] = useState<string | null>(null);

  const typingTimeoutRef = useRef<number | null>(null);
  const threadEndRef = useRef<HTMLDivElement | null>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const pressStartPosRef = useRef<{ x: number; y: number } | null>(null);

  const peers = useMemo(
    () => users.filter((u) => u.id !== currentUser?.id),
    [users, currentUser]
  );

  useEffect(() => {
    if (activeChatUserId && activeChatUserId !== currentUser?.id) {
      setSelectedPeerId(activeChatUserId);
      setMobileShowThread(true);
    } else if (!selectedPeerId && peers[0]) {
      setSelectedPeerId(peers[0].id);
    }
  }, [activeChatUserId, currentUser?.id, peers, selectedPeerId]);

  useEffect(() => {
    if (
      prefillMessageDraft &&
      prefillMessageDraft.recipientId === selectedPeerId &&
      prefillMessageDraft.listing
    ) {
      setDraft(`Hi! Is "${prefillMessageDraft.listing.title}" still available for pickup?`);
    }
  }, [prefillMessageDraft, selectedPeerId]);

  const activePeer = peers.find((p) => p.id === selectedPeerId) || peers[0] || null;

  const threadMessages = useMemo(() => {
    if (!currentUser || !activePeer) return [];
    const convId = [currentUser.id, activePeer.id].sort().join('__');
    return messages.filter((m) => m.conversationId === convId);
  }, [messages, currentUser, activePeer]);

  useEffect(() => {
    if (activePeer) {
      markConversationRead(activePeer.id);
    }
  }, [activePeer, threadMessages.length, markConversationRead]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [threadMessages.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setReactionTargetId(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    pressStartPosRef.current = null;
  };

  const handlePointerDown = (msgId: string, e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    clearLongPressTimer();
    pressStartPosRef.current = { x: e.clientX, y: e.clientY };
    longPressTimerRef.current = window.setTimeout(() => {
      setReactionTargetId(msgId);
      longPressTimerRef.current = null;
    }, 420);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!pressStartPosRef.current || longPressTimerRef.current === null) return;
    const dx = Math.abs(e.clientX - pressStartPosRef.current.x);
    const dy = Math.abs(e.clientY - pressStartPosRef.current.y);
    if (dx > 10 || dy > 10) {
      clearLongPressTimer();
    }
  };

  const handleSelectReaction = async (msgId: string, emoji: string) => {
    setReactionTargetId(null);
    await reactToMessage(msgId, emoji);
  };

  const handleTypingChange = (val: string) => {
    setDraft(val);
    if (!activePeer) return;
    sendTypingSignal(activePeer.id, true);
    if (typingTimeoutRef.current) window.clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = window.setTimeout(() => {
      sendTypingSignal(activePeer.id, false);
    }, 1200);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePeer || !draft.trim()) return;
    const text = draft.trim();
    const attachedId =
      prefillMessageDraft?.recipientId === activePeer.id
        ? prefillMessageDraft.listing?.id
        : undefined;
    setDraft('');
    clearPrefillMessageDraft();
    sendTypingSignal(activePeer.id, false);
    await sendMessage(activePeer.id, text, attachedId);
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden grid grid-cols-1 md:grid-cols-[260px_minmax(0,1fr)] min-h-[580px]">
      {/* Inbox List */}
      <div
        className={`border-r border-slate-200 flex flex-col ${
          mobileShowThread ? 'hidden md:flex' : 'flex'
        }`}
      >
        <div className="p-4 border-b border-slate-200">
          <h1 className="text-base font-bold text-slate-900">Live Chat · Messenger</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time Messenger from Meta · Zero-data compatible
          </p>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {peers.map((peer) => {
            const convId = currentUser ? [currentUser.id, peer.id].sort().join('__') : '';
            const convMsgs = messages.filter((m) => m.conversationId === convId);
            const lastMsg = convMsgs[convMsgs.length - 1];
            const unread = convMsgs.filter(
              (m) => m.recipientId === currentUser?.id && !m.read
            ).length;
            const isOnline = onlineUserIds.includes(peer.id);
            const isSelected = activePeer?.id === peer.id;

            return (
              <button
                key={peer.id}
                type="button"
                onClick={() => {
                  setSelectedPeerId(peer.id);
                  openChatWithUser(peer.id);
                  setMobileShowThread(true);
                  setReactionTargetId(null);
                }}
                className={`w-full px-4 py-3.5 flex items-center gap-3 text-left transition-colors min-h-[64px] ${
                  isSelected ? 'bg-[#1877F2]/8' : 'hover:bg-slate-50'
                }`}
              >
                <div className="relative w-10 h-10 rounded-full overflow-hidden bg-slate-200 shrink-0">
                  {!freeMode ? (
                    <img
                      src={peer.avatar}
                      alt={peer.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-800 text-white text-xs font-bold">
                      {peer.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-slate-900 truncate">{peer.name}</span>
                    {lastMsg && (
                      <span className="text-[11px] text-slate-400 shrink-0">
                        {formatRelativeTime(lastMsg.createdAt)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <p className="text-xs text-slate-500 truncate">
                      {typingUsers[peer.id]
                        ? 'Typing...'
                        : lastMsg
                          ? lastMsg.text
                          : isOnline
                            ? 'Active now'
                            : 'Start a conversation'}
                    </p>
                    {unread > 0 && (
                      <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-[#1877F2] text-white text-[11px] font-bold flex items-center justify-center tabular-nums shrink-0">
                        {unread}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Conversation Thread */}
      <div className={`flex flex-col relative ${mobileShowThread ? 'flex' : 'hidden md:flex'}`}>
        {activePeer ? (
          <>
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  type="button"
                  onClick={() => setMobileShowThread(false)}
                  aria-label="Back to conversations"
                  className="md:hidden w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center shrink-0"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-200 shrink-0">
                  {!freeMode ? (
                    <img
                      src={activePeer.avatar}
                      alt={activePeer.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-800 text-white text-xs font-bold">
                      {activePeer.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <button
                    type="button"
                    onClick={() => openUserProfile(activePeer.id)}
                    className="text-sm font-bold text-slate-900 hover:underline truncate block"
                  >
                    {activePeer.name}
                  </button>
                  <p className="text-[11px] text-slate-500">
                    {typingUsers[activePeer.id]
                      ? 'Typing now...'
                      : onlineUserIds.includes(activePeer.id)
                        ? 'Active now'
                        : activePeer.location}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => openUserProfile(activePeer.id)}
                className="min-h-[36px] px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 inline-flex items-center gap-1.5 shrink-0"
              >
                <User className="w-3.5 h-3.5" />
                <span>Profile</span>
              </button>
            </div>

            {/* Messages Timeline */}
            <div
              onClick={() => {
                if (reactionTargetId) setReactionTargetId(null);
              }}
              className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50 max-h-[440px]"
            >
              {threadMessages.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-sm font-semibold text-slate-700">
                    Say hello to {activePeer.name}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Messages sync instantly across devices via WebSocket.
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-[11px] text-slate-400 text-center pb-1">
                    Long-press or right-click any message to react
                  </p>
                  {threadMessages.map((msg) => {
                    const isMine = msg.senderId === currentUser?.id;
                    const attachedListing = msg.attachmentListingId
                      ? listings.find((l) => l.id === msg.attachmentListingId)
                      : undefined;
                    const reactionEntries = Object.entries(msg.reactions || {}).filter(
                      ([, uids]) => uids.length > 0
                    );
                    const isPickerOpen = reactionTargetId === msg.id;

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} relative`}
                      >
                        {attachedListing && (
                          <div className="mb-1 max-w-[260px] rounded-xl bg-white border border-slate-200 p-2.5 flex items-center gap-2.5 text-left">
                            <ShoppingBag className="w-4 h-4 text-[#1877F2] shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900 truncate">
                                {attachedListing.title}
                              </p>
                              <p className="text-[11px] text-slate-500 font-mono tabular-nums">
                                {attachedListing.currency}
                                {attachedListing.price} · {attachedListing.location}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Floating Long-Press Emoji Reaction Picker */}
                        {isPickerOpen && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            role="toolbar"
                            aria-label="React to message"
                            className={`mb-1.5 z-20 flex items-center gap-1 bg-white border border-slate-200 rounded-2xl shadow-lg p-1 ${
                              isMine ? 'self-end' : 'self-start'
                            }`}
                          >
                            {REACTION_EMOJIS.map((emoji) => {
                              const userSelected = Boolean(
                                currentUser && msg.reactions?.[emoji]?.includes(currentUser.id)
                              );
                              return (
                                <button
                                  key={emoji}
                                  type="button"
                                  onClick={() => handleSelectReaction(msg.id, emoji)}
                                  aria-label={`React with ${emoji}`}
                                  className={`min-w-[40px] min-h-[40px] rounded-xl text-lg flex items-center justify-center transition-transform hover:scale-110 active:scale-95 ${
                                    userSelected
                                      ? 'bg-[#1877F2]/15 ring-1 ring-[#1877F2]/40'
                                      : 'hover:bg-slate-100'
                                  }`}
                                >
                                  {emoji}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        <div
                          className={`group flex items-center gap-1.5 max-w-[85%] ${
                            isMine ? 'flex-row-reverse' : 'flex-row'
                          }`}
                        >
                          <div
                            onPointerDown={(e) => handlePointerDown(msg.id, e)}
                            onPointerMove={handlePointerMove}
                            onPointerUp={clearLongPressTimer}
                            onPointerCancel={clearLongPressTimer}
                            onPointerLeave={clearLongPressTimer}
                            onContextMenu={(e) => {
                              e.preventDefault();
                              clearLongPressTimer();
                              setReactionTargetId((prev) => (prev === msg.id ? null : msg.id));
                            }}
                            className={`select-none touch-pan-y cursor-pointer rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed transition-transform active:scale-[0.98] ${
                              isMine
                                ? 'bg-[#1877F2] text-white'
                                : 'bg-white border border-slate-200 text-slate-900'
                            } ${isPickerOpen ? 'ring-2 ring-[#1877F2]/40' : ''}`}
                          >
                            {msg.text}
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setReactionTargetId((prev) => (prev === msg.id ? null : msg.id));
                            }}
                            aria-label="Add reaction to message"
                            className="opacity-60 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 w-8 h-8 rounded-full hover:bg-slate-200/70 text-slate-500 flex items-center justify-center transition-opacity shrink-0"
                          >
                            <SmilePlus className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Attached Emoji Reactions Row */}
                        {reactionEntries.length > 0 && (
                          <div
                            className={`flex flex-wrap items-center gap-1 mt-1 ${
                              isMine ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            {reactionEntries.map(([emoji, uids]) => {
                              const reactedByMe = Boolean(
                                currentUser && uids.includes(currentUser.id)
                              );
                              return (
                                <button
                                  key={emoji}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelectReaction(msg.id, emoji);
                                  }}
                                  className={`min-h-[28px] px-2 py-0.5 rounded-xl border text-xs inline-flex items-center gap-1 transition-colors ${
                                    reactedByMe
                                      ? 'bg-[#1877F2]/10 border-[#1877F2]/40 text-slate-900 font-semibold'
                                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                                  }`}
                                >
                                  <span>{emoji}</span>
                                  {uids.length > 1 && (
                                    <span className="text-[11px] tabular-nums">{uids.length}</span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        <span className="text-[10px] text-slate-400 mt-1 px-1">
                          {formatRelativeTime(msg.createdAt)}
                        </span>
                      </div>
                    );
                  })}
                </>
              )}
              <div ref={threadEndRef} />
            </div>

            {/* Attached Draft Listing Preview */}
            {prefillMessageDraft?.recipientId === activePeer.id && prefillMessageDraft.listing && (
              <div className="px-4 py-2 bg-slate-100 border-t border-slate-200 flex items-center justify-between gap-2 text-xs">
                <span className="truncate text-slate-700 font-medium">
                  Inquiring about: {prefillMessageDraft.listing.title} (
                  {prefillMessageDraft.listing.currency}
                  {prefillMessageDraft.listing.price})
                </span>
                <button
                  type="button"
                  onClick={clearPrefillMessageDraft}
                  className="text-slate-500 hover:text-slate-800 font-semibold shrink-0"
                >
                  Clear
                </button>
              </div>
            )}

            {/* Composer */}
            <form
              onSubmit={handleSend}
              className="p-3 border-t border-slate-200 bg-white flex items-center gap-2"
            >
              <input
                type="text"
                value={draft}
                onChange={(e) => handleTypingChange(e.target.value)}
                placeholder={`Message ${activePeer.name}...`}
                className="flex-1 min-h-[44px] rounded-xl bg-slate-100 px-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1877F2]/30"
              />
              <button
                type="submit"
                disabled={!draft.trim()}
                aria-label="Send message"
                className="min-h-[44px] min-w-[44px] rounded-xl bg-[#1877F2] text-white flex items-center justify-center hover:bg-[#166FE5] disabled:opacity-45 shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8 text-center text-sm text-slate-500">
            Select a conversation to begin messaging.
          </div>
        )}
      </div>
    </div>
  );
};
