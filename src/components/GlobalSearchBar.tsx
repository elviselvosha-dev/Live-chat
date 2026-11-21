import React, { useMemo, useState } from 'react';
import { Clapperboard, MessageCircle, Search, ShoppingBag, UserCheck, UserPlus, X } from 'lucide-react';
import { useSocial } from '../context/SocialContext';

export const GlobalSearchBar: React.FC = () => {
  const {
    users,
    currentUser,
    posts,
    listings,
    reels,
    freeMode,
    openUserProfile,
    openChatWithUser,
    toggleFollow,
    setActiveTab,
  } = useSocial();

  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);

  const trimmed = query.trim().toLowerCase();

  const results = useMemo(() => {
    if (!trimmed) return null;
    return {
      people: users.filter(
        (u) =>
          u.name.toLowerCase().includes(trimmed) ||
          u.handle.toLowerCase().includes(trimmed) ||
          u.location.toLowerCase().includes(trimmed)
      ),
      listings: listings.filter(
        (l) =>
          l.title.toLowerCase().includes(trimmed) ||
          l.category.toLowerCase().includes(trimmed) ||
          l.location.toLowerCase().includes(trimmed)
      ),
      posts: posts.filter(
        (p) =>
          p.content.toLowerCase().includes(trimmed) ||
          (p.location || '').toLowerCase().includes(trimmed)
      ),
      reels: reels.filter(
        (r) =>
          r.caption.toLowerCase().includes(trimmed) ||
          r.audioTrack.toLowerCase().includes(trimmed)
      ),
    };
  }, [trimmed, users, listings, posts, reels]);

  const hasResults =
    results &&
    (results.people.length > 0 ||
      results.listings.length > 0 ||
      results.posts.length > 0 ||
      results.reels.length > 0);

  return (
    <div className="relative mb-4">
      <div className="relative flex items-center">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
        <input
          type="search"
          value={query}
          onFocus={() => setFocused(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setFocused(true);
          }}
          placeholder="Search Kinbook people, posts, Marketplace, Reels..."
          className="w-full min-h-[44px] rounded-2xl bg-white border border-slate-200/90 pl-10 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1877F2]/30 focus:border-[#1877F2]"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setFocused(false);
            }}
            aria-label="Clear search"
            className="absolute right-2.5 w-7 h-7 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {focused && trimmed && results && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-30 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-[420px] overflow-y-auto p-3 space-y-3">
          {!hasResults ? (
            <p className="text-xs text-slate-500 text-center py-4">
              No matches found for &ldquo;{query}&rdquo;
            </p>
          ) : (
            <>
              {results.people.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold text-slate-500 px-2 mb-1.5">People</p>
                  <div className="space-y-1">
                    {results.people.map((person) => {
                      const isMe = person.id === currentUser?.id;
                      const isFollowing = Boolean(currentUser?.following.includes(person.id));
                      return (
                        <div
                          key={person.id}
                          className="flex items-center justify-between gap-2 px-2 py-2 rounded-xl hover:bg-slate-50"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setFocused(false);
                              openUserProfile(person.id);
                            }}
                            className="flex items-center gap-2.5 min-w-0 text-left flex-1"
                          >
                            <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-200 shrink-0">
                              {!freeMode ? (
                                <img
                                  src={person.avatar}
                                  alt={person.name}
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-slate-800 text-white text-xs font-bold">
                                  {person.name.slice(0, 2).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900 truncate">
                                {person.name}
                              </p>
                              <p className="text-[11px] text-slate-500 truncate">
                                @{person.handle} · {person.location}
                              </p>
                            </div>
                          </button>

                          {!isMe && (
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => toggleFollow(person.id)}
                                className={`min-h-[34px] px-2.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1 ${
                                  isFollowing
                                    ? 'bg-slate-100 text-slate-700'
                                    : 'bg-[#1877F2]/10 text-[#1877F2]'
                                }`}
                              >
                                {isFollowing ? (
                                  <UserCheck className="w-3.5 h-3.5" />
                                ) : (
                                  <UserPlus className="w-3.5 h-3.5" />
                                )}
                                <span>{isFollowing ? 'Following' : 'Follow'}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setFocused(false);
                                  openChatWithUser(person.id);
                                }}
                                aria-label={`Message ${person.name}`}
                                className="min-h-[34px] min-w-[34px] rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {results.listings.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold text-slate-500 px-2 mb-1.5">Marketplace</p>
                  <div className="space-y-1">
                    {results.listings.slice(0, 4).map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setFocused(false);
                          setActiveTab('marketplace');
                        }}
                        className="w-full px-2 py-2 rounded-xl hover:bg-slate-50 flex items-center gap-2.5 text-left"
                      >
                        <ShoppingBag className="w-4 h-4 text-[#1877F2] shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-slate-900 truncate">
                            {item.title}
                          </p>
                          <p className="text-[11px] text-slate-500 font-mono tabular-nums">
                            {item.currency}
                            {item.price} · {item.location}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {results.reels.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold text-slate-500 px-2 mb-1.5">Reels</p>
                  <div className="space-y-1">
                    {results.reels.slice(0, 3).map((reel) => (
                      <button
                        key={reel.id}
                        type="button"
                        onClick={() => {
                          setFocused(false);
                          setActiveTab('reels');
                        }}
                        className="w-full px-2 py-2 rounded-xl hover:bg-slate-50 flex items-center gap-2.5 text-left"
                      >
                        <Clapperboard className="w-4 h-4 text-rose-600 shrink-0" />
                        <p className="text-xs text-slate-800 truncate">{reel.caption}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {results.posts.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold text-slate-500 px-2 mb-1.5">Posts</p>
                  <div className="space-y-1">
                    {results.posts.slice(0, 3).map((post) => (
                      <button
                        key={post.id}
                        type="button"
                        onClick={() => {
                          setFocused(false);
                          setActiveTab('feed');
                        }}
                        className="w-full px-2 py-2 rounded-xl hover:bg-slate-50 text-left"
                      >
                        <p className="text-xs text-slate-800 line-clamp-1">{post.content}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
