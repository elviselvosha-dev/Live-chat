import React, { useEffect, useRef, useState } from 'react';
import {
  Camera,
  Eye,
  Heart,
  Radio,
  Send,
  StopCircle,
  UserCheck,
  UserPlus,
  Users,
  Video,
  WifiOff,
  X,
} from 'lucide-react';
import { useSocial } from '../context/SocialContext';
import { formatRelativeTime } from '../utils/format';

export const LiveView: React.FC = () => {
  const {
    streams,
    currentUser,
    freeMode,
    liveFrames,
    activeStreamId,
    openLiveStream,
    getUserById,
    openUserProfile,
    toggleFollow,
    startLiveStream,
    endLiveStream,
    commentOnStream,
    reactToStream,
    sendStreamFrame,
    recordDataUnlocked,
  } = useSocial();

  const [showGoLiveModal, setShowGoLiveModal] = useState(false);
  const [streamTitle, setStreamTitle] = useState('');
  const [streamCategory, setStreamCategory] = useState('Community');
  const [broadcastingStreamId, setBroadcastingStreamId] = useState<string | null>(null);
  const [cameraMode, setCameraMode] = useState<'webcam' | 'studio'>('studio');
  const [chatText, setChatText] = useState('');
  const [unlockedLiveIds, setUnlockedLiveIds] = useState<Record<string, boolean>>({});
  const [elapsedSec, setElapsedSec] = useState(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const liveStreams = streams.filter((s) => s.isLive);
  const selectedStream =
    streams.find((s) => s.id === (broadcastingStreamId || activeStreamId)) || null;

  // Broadcast live frames from webcam or Studio Canvas over WebSocket
  useEffect(() => {
    if (!broadcastingStreamId) {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
      }
      return;
    }

    let cancelled = false;
    setElapsedSec(0);

    async function initMedia() {
      try {
        const ms = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (cancelled) {
          ms.getTracks().forEach((t) => t.stop());
          return;
        }
        mediaStreamRef.current = ms;
        if (videoRef.current) {
          videoRef.current.srcObject = ms;
          await videoRef.current.play().catch(() => {});
        }
        setCameraMode('webcam');
      } catch {
        setCameraMode('studio');
      }
    }

    initMedia();

    const timerId = window.setInterval(() => {
      setElapsedSec((prev) => prev + 1);
    }, 1000);

    let tick = 0;
    const frameInterval = window.setInterval(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      tick += 1;
      if (mediaStreamRef.current && videoRef.current && videoRef.current.readyState >= 2) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      } else {
        // Animated Studio Broadcast Fallback Canvas
        const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        grad.addColorStop(0, '#0f172a');
        grad.addColorStop(1, '#1e3a8a');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        for (let i = 0; i < 12; i++) {
          const barH = 18 + Math.abs(Math.sin(tick * 0.3 + i * 0.7)) * 68;
          ctx.fillRect(48 + i * 32, canvas.height - 54 - barH, 18, barH);
        }

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px sans-serif';
        ctx.fillText(currentUser?.name || 'Live Host', 32, 56);
        ctx.fillStyle = '#93c5fd';
        ctx.font = '14px sans-serif';
        ctx.fillText(selectedStream?.title || 'Live Broadcast', 32, 82);
      }

      const dataUrl = canvas.toDataURL('image/jpeg', 0.45);
      sendStreamFrame(broadcastingStreamId, dataUrl);
    }, 300);

    return () => {
      cancelled = true;
      window.clearInterval(timerId);
      window.clearInterval(frameInterval);
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
      }
    };
  }, [broadcastingStreamId, currentUser?.name, selectedStream?.title, sendStreamFrame]);

  const handleStartBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!streamTitle.trim()) return;
    const created = await startLiveStream({
      title: streamTitle,
      category: streamCategory,
      thumbnail: currentUser?.coverPhoto,
    });
    if (created) {
      setBroadcastingStreamId(created.id);
      setShowGoLiveModal(false);
      setStreamTitle('');
    }
  };

  const handleStopBroadcast = async (shareToFeed: boolean) => {
    if (!broadcastingStreamId) return;
    const id = broadcastingStreamId;
    setBroadcastingStreamId(null);
    await endLiveStream(id, shareToFeed);
  };

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (selectedStream) {
    const host = getUserById(selectedStream.hostId);
    const isBroadcaster = broadcastingStreamId === selectedStream.id;
    const isMe = host?.id === currentUser?.id;
    const isFollowing = Boolean(host && currentUser?.following.includes(host.id));
    const incomingFrame = liveFrames[selectedStream.id];
    const isVideoHiddenByFreeMode =
      freeMode && !isBroadcaster && !unlockedLiveIds[selectedStream.id];

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              if (!isBroadcaster) openLiveStream(null);
            }}
            className="min-h-[40px] px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            {isBroadcaster ? 'Broadcasting Live' : '← All Live Streams'}
          </button>

          {isBroadcaster && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleStopBroadcast(true)}
                className="min-h-[40px] px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-rose-700"
              >
                <StopCircle className="w-4 h-4" />
                <span>End &amp; Share Replay</span>
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-4">
          {/* Live Stage */}
          <div className="bg-slate-950 rounded-2xl overflow-hidden text-white border border-slate-800">
            <div className="relative aspect-video bg-slate-900 flex items-center justify-center">
              {isBroadcaster ? (
                <>
                  <video
                    ref={videoRef}
                    muted
                    playsInline
                    className={`w-full h-full object-cover ${cameraMode === 'webcam' ? 'block' : 'hidden'}`}
                  />
                  <canvas
                    ref={canvasRef}
                    width={480}
                    height={270}
                    className={`w-full h-full object-cover ${cameraMode === 'studio' ? 'block' : 'hidden'}`}
                  />
                </>
              ) : isVideoHiddenByFreeMode ? (
                <div className="p-6 text-center max-w-sm">
                  <WifiOff className="w-7 h-7 text-sky-400 mx-auto mb-2.5" />
                  <p className="text-sm font-bold text-white">
                    Live Video Paused (Free Mode)
                  </p>
                  <p className="text-xs text-slate-300 mt-1">
                    Live chat updates continue using zero media bandwidth.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setUnlockedLiveIds((prev) => ({ ...prev, [selectedStream.id]: true }));
                      recordDataUnlocked(2400);
                    }}
                    className="mt-4 min-h-[42px] px-4 py-2 rounded-xl bg-white text-slate-900 text-xs font-bold inline-flex items-center gap-1.5"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Watch Live Video (2.4 MB)</span>
                  </button>
                </div>
              ) : (
                <img
                  src={incomingFrame || selectedStream.thumbnail}
                  alt={selectedStream.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              )}

              {/* Live Overlay Header */}
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-md bg-rose-600 text-white text-[11px] font-bold tracking-wide">
                    {selectedStream.isLive ? 'LIVE' : 'ENDED'}
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-black/55 backdrop-blur-sm text-white text-[11px] font-semibold inline-flex items-center gap-1 tabular-nums">
                    <Users className="w-3.5 h-3.5" />
                    {selectedStream.viewerCount}
                  </span>
                  {isBroadcaster && (
                    <span className="px-2.5 py-1 rounded-md bg-black/55 text-white text-[11px] font-mono tabular-nums">
                      {formatDuration(elapsedSec)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Stream Meta & Host Follow Bar */}
            <div className="p-4 flex flex-wrap items-center justify-between gap-3 bg-slate-900">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => host && openUserProfile(host.id)}
                  className="w-10 h-10 rounded-full overflow-hidden bg-slate-700 shrink-0"
                >
                  {!freeMode && host ? (
                    <img
                      src={host.avatar}
                      alt={host.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-bold">
                      {(host?.name || 'H').slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </button>
                <div className="min-w-0">
                  <h2 className="text-sm font-bold text-white truncate">{selectedStream.title}</h2>
                  <p className="text-xs text-slate-400 truncate">
                    {host?.name || 'Host'} · {selectedStream.category}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => reactToStream(selectedStream.id)}
                  className="min-h-[40px] px-3.5 py-2 rounded-xl bg-rose-600/20 text-rose-400 hover:bg-rose-600/30 text-xs font-semibold inline-flex items-center gap-1.5 tabular-nums"
                >
                  <Heart className="w-4 h-4 fill-current" />
                  <span>{selectedStream.reactionsCount}</span>
                </button>

                {!isMe && host && (
                  <button
                    type="button"
                    onClick={() => toggleFollow(host.id)}
                    className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 ${
                      isFollowing
                        ? 'bg-slate-800 text-slate-200'
                        : 'bg-[#1877F2] text-white hover:bg-[#166FE5]'
                    }`}
                  >
                    {isFollowing ? <UserCheck className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
                    <span>{isFollowing ? 'Following' : 'Follow'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Real-time Live Chat Panel */}
          <div className="bg-white border border-slate-200 rounded-2xl flex flex-col h-[420px] xl:h-auto xl:min-h-[440px]">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Live Chat</h3>
              <span className="text-xs text-slate-500 tabular-nums">
                {selectedStream.comments.length} messages
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5">
              {selectedStream.comments.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-8">
                  Say hello to {host?.name || 'the host'} in real time.
                </p>
              ) : (
                selectedStream.comments.map((c) => {
                  const commenter = getUserById(c.authorId);
                  return (
                    <div key={c.id} className="text-xs leading-relaxed">
                      <span className="font-bold text-slate-900 mr-1.5">
                        {commenter?.name || 'Viewer'}
                      </span>
                      <span className="text-slate-700">{c.text}</span>
                      <span className="text-[10px] text-slate-400 ml-1.5">
                        {formatRelativeTime(c.createdAt)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!chatText.trim()) return;
                const txt = chatText.trim();
                setChatText('');
                await commentOnStream(selectedStream.id, txt);
              }}
              className="p-3 border-t border-slate-200 flex items-center gap-2"
            >
              <input
                type="text"
                value={chatText}
                onChange={(e) => setChatText(e.target.value)}
                placeholder="Comment live..."
                className="flex-1 min-h-[40px] rounded-xl bg-slate-100 px-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1877F2]/30"
              />
              <button
                type="submit"
                aria-label="Send live comment"
                className="min-h-[40px] min-w-[40px] rounded-xl bg-[#1877F2] text-white flex items-center justify-center hover:bg-[#166FE5]"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header + Go Live CTA */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Live Streaming</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Broadcast live video from your camera or join real-time neighborhood streams.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowGoLiveModal(true)}
          className="min-h-[44px] px-5 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold inline-flex items-center gap-2 hover:bg-rose-700 transition-colors whitespace-nowrap shrink-0"
        >
          <Radio className="w-4 h-4" />
          <span>Go Live Now</span>
        </button>
      </div>

      {/* Live Channels Grid */}
      {liveStreams.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-10 text-center">
          <Video className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-900">No active live streams right now</p>
          <p className="text-xs text-slate-500 mt-1">
            Tap &ldquo;Go Live Now&rdquo; to start broadcasting to your followers.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {liveStreams.map((stream) => {
            const host = getUserById(stream.hostId);
            return (
              <div
                key={stream.id}
                onClick={() => openLiveStream(stream.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') openLiveStream(stream.id);
                }}
                className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden cursor-pointer hover:border-slate-300 transition-colors text-left"
              >
                <div className="relative aspect-video bg-slate-900">
                  {!freeMode ? (
                    <img
                      src={liveFrames[stream.id] || stream.thumbnail}
                      alt={stream.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 px-4 text-center">
                      <WifiOff className="w-5 h-5 text-sky-400 mb-1.5" />
                      <span className="text-xs font-semibold text-white">
                        Audio &amp; Chat Stream (Free Mode)
                      </span>
                    </div>
                  )}
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-bold tracking-wide">
                      LIVE
                    </span>
                    <span className="px-2 py-0.5 rounded bg-black/60 text-white text-[11px] font-semibold tabular-nums">
                      {stream.viewerCount} watching
                    </span>
                  </div>
                </div>
                <div className="p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-200 shrink-0">
                    {!freeMode && host ? (
                      <img
                        src={host.avatar}
                        alt={host.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-800 text-white text-xs font-bold">
                        {(host?.name || 'H').slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-sm font-bold text-slate-900 truncate">{stream.title}</h2>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {host?.name || 'Host'} · {stream.category}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Go Live Setup Modal */}
      {showGoLiveModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <form
            onSubmit={handleStartBroadcast}
            className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Start Live Broadcast</h2>
              <button
                type="button"
                onClick={() => setShowGoLiveModal(false)}
                className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 flex items-center gap-3">
              <Camera className="w-5 h-5 text-rose-600 shrink-0" />
              <p className="text-xs text-slate-600 leading-relaxed">
                Uses your device camera when available, or switches automatically to the live Studio
                Broadcast Canvas.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Stream Title
              </label>
              <input
                type="text"
                required
                value={streamTitle}
                onChange={(e) => setStreamTitle(e.target.value)}
                placeholder="e.g. Afternoon sourdough pull & neighborhood chat"
                className="w-full min-h-[42px] rounded-xl border border-slate-200 px-3 text-sm focus:outline-none focus:border-[#1877F2]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={streamCategory}
                onChange={(e) => setStreamCategory(e.target.value)}
                className="w-full min-h-[42px] rounded-xl border border-slate-200 px-3 text-sm bg-white focus:outline-none focus:border-[#1877F2]"
              >
                <option value="Community">Community</option>
                <option value="Food & Local">Food &amp; Local</option>
                <option value="Music & Arts">Music &amp; Arts</option>
                <option value="Tech & Craft">Tech &amp; Craft</option>
                <option value="Marketplace Live">Marketplace Live</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowGoLiveModal(false)}
                className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!streamTitle.trim()}
                className="min-h-[44px] px-5 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 disabled:opacity-50"
              >
                Go Live
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
