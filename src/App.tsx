import React from 'react';
import {
  Clapperboard,
  Home,
  MessageCircle,
  Radio,
  ShoppingBag,
  User,
  UserCheck,
  UserPlus,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { SocialProvider, useSocial } from './context/SocialContext';
import { FeedView } from './components/FeedView';
import { ReelsView } from './components/ReelsView';
import { LiveView } from './components/LiveView';
import { MarketplaceView } from './components/MarketplaceView';
import { MessagesView } from './components/MessagesView';
import { ProfileView } from './components/ProfileView';
import { GlobalSearchBar } from './components/GlobalSearchBar';
import { formatDataSize } from './utils/format';
import type { TabKey } from './types';

const DESKTOP_NAV: { key: TabKey; label: string }[] = [
  { key: 'feed', label: 'Feed' },
  { key: 'reels', label: 'Reels' },
  { key: 'live', label: 'Live' },
  { key: 'marketplace', label: 'Marketplace' },
  { key: 'messages', label: 'Live Chat' },
];

const MOBILE_BOTTOM_TABS: { key: TabKey; label: string; icon: React.FC<{ className?: string }> }[] = [
  { key: 'feed', label: 'Feed', icon: Home },
  { key: 'reels', label: 'Reels', icon: Clapperboard },
  { key: 'marketplace', label: 'Market', icon: ShoppingBag },
  { key: 'messages', label: 'Live Chat', icon: MessageCircle },
  { key: 'profile', label: 'Profile', icon: User },
];

const KinbookShell: React.FC = () => {
  const {
    loading,
    users,
    currentUser,
    listings,
    streams,
    onlineUserIds,
    freeMode,
    dataSavedKb,
    activeTab,
    unreadMessageCount,
    setActiveTab,
    setFreeMode,
    openUserProfile,
    openChatWithUser,
    toggleFollow,
  } = useSocial();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F2F4F7] p-6">
        <div className="text-center space-y-2">
          <p className="text-lg font-bold font-display text-slate-900">Kinbook</p>
          <p className="text-xs text-slate-500">Connecting to neighborhood feed...</p>
        </div>
      </div>
    );
  }

  const otherUsers = users.filter((u) => u.id !== currentUser?.id);
  const liveCount = streams.filter((s) => s.isLive).length;
  const featuredListing = listings.find((l) => l.status === 'available') || listings[0];

  return (
    <div className="min-h-screen bg-[#F2F4F7] text-slate-900 pb-16 lg:pb-0">
      {/* Desktop Top Bar (Strictly 3 zones: Brand wordmark — Nav links — 1 primary action) */}
      <header className="hidden lg:block sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90">
        <div className="max-w-[1380px] mx-auto h-14 px-6 flex items-center justify-between gap-8">
          <a
            href="#feed"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('feed');
            }}
            className="text-xl font-extrabold font-display tracking-tight text-[#1877F2] whitespace-nowrap shrink-0"
          >
            Kinbook
          </a>

          <nav className="flex items-center gap-7" aria-label="Primary navigation">
            {DESKTOP_NAV.map((item) => {
              const isActive = activeTab === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setActiveTab(item.key)}
                  className={`relative py-4 text-sm font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    isActive ? 'text-[#1877F2]' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>{item.label}</span>
                  {item.key === 'messages' && unreadMessageCount > 0 && (
                    <span className="ml-1.5 text-xs font-bold text-[#1877F2] tabular-nums">
                      ({unreadMessageCount})
                    </span>
                  )}
                  {item.key === 'live' && liveCount > 0 && (
                    <span className="ml-1.5 text-[11px] font-bold text-rose-600 tabular-nums">
                      {liveCount}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1877F2]" />
                  )}
                </button>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={() => currentUser && openUserProfile(currentUser.id)}
            className="pl-1.5 pr-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-semibold inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
          >
            <span className="w-7 h-7 rounded-full overflow-hidden bg-slate-300 shrink-0">
              {currentUser && !freeMode ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="w-full h-full flex items-center justify-center bg-slate-800 text-white text-[10px] font-bold">
                  {(currentUser?.name || 'U').slice(0, 2).toUpperCase()}
                </span>
              )}
            </span>
            <span>{currentUser?.name || 'My Profile'}</span>
          </button>
        </div>
      </header>

      {/* Mobile Top App Bar (48px, compliant with 15% sticky height cap) */}
      <header className="lg:hidden sticky top-0 z-40 h-12 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setActiveTab('feed')}
          className="text-lg font-extrabold font-display tracking-tight text-[#1877F2] whitespace-nowrap shrink-0"
        >
          Kinbook
        </button>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('live')}
            className={`min-h-[36px] px-2.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1 whitespace-nowrap shrink-0 ${
              activeTab === 'live'
                ? 'bg-rose-600 text-white'
                : 'bg-slate-100 text-slate-800'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Live</span>
          </button>

          <button
            type="button"
            onClick={() => setFreeMode(!freeMode)}
            className={`min-h-[36px] px-2.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1 whitespace-nowrap shrink-0 ${
              freeMode
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-800'
            }`}
          >
            {freeMode ? (
              <WifiOff className="w-3.5 h-3.5 text-sky-400" />
            ) : (
              <Wifi className="w-3.5 h-3.5 text-slate-600" />
            )}
            <span>{freeMode ? 'Free' : 'Data'}</span>
          </button>

          {currentUser && (
            <button
              type="button"
              onClick={() => openUserProfile(currentUser.id)}
              aria-label="Open your profile"
              className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 bg-slate-200 shrink-0 ml-0.5"
            >
              {!freeMode ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="w-full h-full flex items-center justify-center bg-slate-800 text-white text-[10px] font-bold">
                  {currentUser.name.slice(0, 2).toUpperCase()}
                </span>
              )}
            </button>
          )}
        </div>
      </header>

      {/* Responsive 3-Column Workspace Container */}
      <div className="max-w-[1380px] mx-auto px-3 sm:px-6 py-4 lg:py-6 grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)_300px] gap-6 items-start">
        {/* Left Navigation & Free Mode Rail (Desktop) */}
        <aside className="hidden lg:block sticky top-20 space-y-4">
          {currentUser && (
            <button
              type="button"
              onClick={() => openUserProfile(currentUser.id)}
              className="w-full bg-white border border-slate-200/80 rounded-2xl p-4 text-left hover:border-slate-300 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full overflow-hidden bg-slate-200 shrink-0">
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
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{currentUser.name}</p>
                  <p className="text-xs text-slate-500 truncate">{currentUser.location}</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 tabular-nums">
                <span>
                  <strong className="text-slate-900">{currentUser.followers.length}</strong> followers
                </span>
                <span>
                  <strong className="text-slate-900">{currentUser.following.length}</strong> following
                </span>
              </div>
            </button>
          )}

          {/* Free Mode Zero-Data Plan Card */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Free Mode</h2>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  Browse posts, chats, and Marketplace without a mobile data plan.
                </p>
              </div>
              {freeMode ? (
                <WifiOff className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
              ) : (
                <Wifi className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              )}
            </div>

            {freeMode && (
              <p className="text-xs font-mono font-semibold text-slate-900 tabular-nums">
                Saved: {formatDataSize(dataSavedKb)}
              </p>
            )}

            <button
              type="button"
              onClick={() => setFreeMode(!freeMode)}
              className={`w-full min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
                freeMode
                  ? 'bg-slate-900 text-white hover:bg-slate-800'
                  : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
              }`}
            >
              {freeMode ? 'Switch to Data Mode' : 'Enable Free Mode'}
            </button>
          </div>

          <p className="px-2 text-[11px] text-slate-500 leading-relaxed">
            Kinbook · Messenger · from <strong className="font-semibold text-slate-700">Meta</strong>
          </p>
        </aside>

        {/* Center Main Stage */}
        <main className="min-w-0">
          <GlobalSearchBar />
          {activeTab === 'feed' && <FeedView />}
          {activeTab === 'reels' && <ReelsView />}
          {activeTab === 'live' && <LiveView />}
          {activeTab === 'marketplace' && <MarketplaceView />}
          {activeTab === 'messages' && <MessagesView />}
          {activeTab === 'profile' && <ProfileView />}
        </main>

        {/* Right Community & Contacts Rail (Desktop) */}
        <aside className="hidden lg:block sticky top-20 space-y-4">
          {/* Active Contacts (Click to open real-time Live Chat) */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-slate-900">Live Chat</h2>
              <button
                type="button"
                onClick={() => setActiveTab('messages')}
                className="text-xs font-semibold text-[#1877F2] hover:underline"
              >
                Open inbox
              </button>
            </div>
            <div className="space-y-1">
              {otherUsers.map((person) => {
                const isOnline = onlineUserIds.includes(person.id);
                return (
                  <button
                    key={person.id}
                    type="button"
                    onClick={() => openChatWithUser(person.id)}
                    className="w-full min-h-[48px] px-2 py-1.5 rounded-xl hover:bg-slate-50 flex items-center justify-between gap-2.5 text-left transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-200 shrink-0">
                        {!freeMode ? (
                          <img
                            src={person.avatar}
                            alt={person.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-slate-800 text-white text-[10px] font-bold">
                            {person.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 truncate">
                          {person.name}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {isOnline ? 'Active now' : person.location}
                        </p>
                      </div>
                    </div>
                    <MessageCircle className="w-4 h-4 text-slate-400 shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* People to Follow */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4">
            <h2 className="text-sm font-bold text-slate-900 mb-3">Neighbors &amp; Creators</h2>
            <div className="space-y-2.5">
              {otherUsers.slice(0, 3).map((person) => {
                const isFollowing = Boolean(currentUser?.following.includes(person.id));
                return (
                  <div key={person.id} className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => openUserProfile(person.id)}
                      className="min-w-0 text-left hover:underline"
                    >
                      <p className="text-xs font-bold text-slate-900 truncate">{person.name}</p>
                      <p className="text-[11px] text-slate-500 truncate tabular-nums">
                        {person.followers.length} followers
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleFollow(person.id)}
                      className={`min-h-[34px] px-3 py-1 rounded-lg text-xs font-semibold inline-flex items-center gap-1 shrink-0 ${
                        isFollowing
                          ? 'bg-slate-100 text-slate-700'
                          : 'bg-[#1877F2]/10 text-[#1877F2]'
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
                  </div>
                );
              })}
            </div>
          </div>

          {/* Local Marketplace Highlight */}
          {featuredListing && (
            <button
              type="button"
              onClick={() => setActiveTab('marketplace')}
              className="w-full bg-white border border-slate-200/80 rounded-2xl overflow-hidden text-left hover:border-slate-300 transition-colors"
            >
              {!freeMode && (
                <div className="aspect-[4/3] bg-slate-100 overflow-hidden">
                  <img
                    src={featuredListing.image}
                    alt={featuredListing.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="p-3.5">
                <p className="text-[11px] font-semibold text-slate-500">Marketplace Nearby</p>
                <p className="text-sm font-bold text-slate-900 mt-0.5 line-clamp-1">
                  {featuredListing.title}
                </p>
                <p className="text-xs text-slate-600 mt-1 font-mono tabular-nums">
                  {featuredListing.currency}
                  {featuredListing.price} · {featuredListing.location}
                </p>
              </div>
            </button>
          )}
        </aside>
      </div>

      {/* Mobile Fixed Bottom Thumb-Zone Navigation Bar (56px height) */}
      <nav
        aria-label="Mobile navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 h-14 pb-safe bg-white/95 backdrop-blur-md border-t border-slate-200 grid grid-cols-5 items-center"
      >
        {MOBILE_BOTTOM_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                if (tab.key === 'profile' && currentUser) {
                  openUserProfile(currentUser.id);
                } else {
                  setActiveTab(tab.key);
                }
              }}
              className={`relative h-full min-h-[44px] flex flex-col items-center justify-center transition-colors ${
                isActive ? 'text-[#1877F2]' : 'text-slate-500'
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {tab.key === 'messages' && unreadMessageCount > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center tabular-nums">
                    {unreadMessageCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-semibold tracking-tight mt-0.5">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default function App() {
  return (
    <SocialProvider>
      <KinbookShell />
    </SocialProvider>
  );
}
