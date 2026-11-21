import React, { useMemo, useState } from 'react';
import {
  Briefcase,
  Camera,
  Check,
  Code2,
  Edit3,
  MapPin,
  MessageCircle,
  Plus,
  Share2,
  UserCheck,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { useSocial } from '../context/SocialContext';
import { SmartMedia } from './SmartMedia';
import { formatRelativeTime, readFileAsDataUrl } from '../utils/format';

type ProfileSubTab = 'posts' | 'reels' | 'marketplace' | 'followers' | 'following' | 'rn-source';

const REACT_NATIVE_SNIPPET = `// React Native Android Entry (react-native/App.tsx)
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { FreeModeProvider } from './src/context/FreeModeContext';
import FeedScreen from './src/screens/FeedScreen';
import ReelsScreen from './src/screens/ReelsScreen';
import LiveStreamScreen from './src/screens/LiveStreamScreen';
import MarketplaceScreen from './src/screens/MarketplaceScreen';
import MessagesScreen from './src/screens/MessagesScreen';
import ProfileScreen from './src/screens/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <FreeModeProvider>
      <NavigationContainer>
        <Tab.Navigator screenOptions={{ headerShown: false, tabBarActiveTintColor: '#1877F2' }}>
          <Tab.Screen name="Feed" component={FeedScreen} />
          <Tab.Screen name="Reels" component={ReelsScreen} />
          <Tab.Screen name="Live" component={LiveStreamScreen} />
          <Tab.Screen name="Market" component={MarketplaceScreen} />
          <Tab.Screen name="Chat" component={MessagesScreen} />
          <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </FreeModeProvider>
  );
}`;

export const ProfileView: React.FC = () => {
  const {
    users,
    currentUser,
    inspectedUserId,
    posts,
    reels,
    listings,
    freeMode,
    recordDataUnlocked,
    switchUser,
    openUserProfile,
    openChatWithUser,
    toggleFollow,
    updateProfile,
    createAccount,
    setActiveTab,
  } = useSocial();

  const targetUser = useMemo(() => {
    if (inspectedUserId) {
      return users.find((u) => u.id === inspectedUserId) || currentUser;
    }
    return currentUser;
  }, [inspectedUserId, users, currentUser]);

  const [subTab, setSubTab] = useState<ProfileSubTab>('posts');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateAccountModal, setShowCreateAccountModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Edit profile state
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editWork, setEditWork] = useState('');
  const [editAvatar, setEditAvatar] = useState('');

  // New account state
  const [newAccName, setNewAccName] = useState('');
  const [newAccLocation, setNewAccLocation] = useState('Oakwood District');
  const [newAccWork, setNewAccWork] = useState('');
  const [newAccBio, setNewAccBio] = useState('');

  if (!targetUser || !currentUser) return null;

  const isOwnProfile = targetUser.id === currentUser.id;
  const isFollowing = currentUser.following.includes(targetUser.id);

  const userPosts = posts.filter((p) => p.authorId === targetUser.id);
  const userReels = reels.filter((r) => r.authorId === targetUser.id);
  const userListings = listings.filter((l) => l.sellerId === targetUser.id);

  const followerUsers = users.filter((u) => targetUser.followers.includes(u.id));
  const followingUsers = users.filter((u) => targetUser.following.includes(u.id));

  const openEdit = () => {
    setEditName(targetUser.name);
    setEditBio(targetUser.bio);
    setEditLocation(targetUser.location);
    setEditWork(targetUser.work);
    setEditAvatar(targetUser.avatar);
    setShowEditModal(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile({
      name: editName,
      bio: editBio,
      location: editLocation,
      work: editWork,
      avatar: editAvatar,
    });
    setShowEditModal(false);
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccName.trim()) return;
    await createAccount({
      name: newAccName,
      location: newAccLocation,
      work: newAccWork,
      bio: newAccBio,
    });
    setNewAccName('');
    setNewAccWork('');
    setNewAccBio('');
    setShowCreateAccountModal(false);
  };

  return (
    <div className="space-y-4">
      {/* Profile Header Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden">
        {/* Cover Photo */}
        <SmartMedia
          src={targetUser.coverPhoto}
          alt={`${targetUser.name}'s cover photo`}
          sizeKb={320}
          freeMode={freeMode}
          onUnlockCost={recordDataUnlocked}
          aspectClass="aspect-[16/6] min-h-[150px]"
        />

        <div className="px-5 pb-5">
          {/* Avatar + Primary Action Row */}
          <div className="flex flex-wrap items-end justify-between gap-4 -mt-10 relative z-10">
            <div className="relative shrink-0">
              <div className="w-24 h-24 rounded-full border-4 border-white overflow-hidden bg-slate-200 shadow-sm">
                {!freeMode ? (
                  <img
                    src={targetUser.avatar}
                    alt={targetUser.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-800 text-white text-xl font-bold">
                    {targetUser.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              {isOwnProfile && (
                <label
                  title="Change profile picture"
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-slate-900 text-white border-2 border-white flex items-center justify-center cursor-pointer hover:bg-slate-800 shadow-sm"
                >
                  <Camera className="w-4 h-4" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const dataUrl = await readFileAsDataUrl(file);
                      await updateProfile({ avatar: dataUrl });
                    }}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2">
              {isOwnProfile ? (
                <>
                  <button
                    type="button"
                    onClick={openEdit}
                    className="min-h-[40px] px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-semibold inline-flex items-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Profile</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateAccountModal(true)}
                    className="min-h-[40px] px-4 py-2 rounded-xl bg-[#1877F2] hover:bg-[#166FE5] text-white text-xs font-semibold inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New Profile</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => toggleFollow(targetUser.id)}
                    className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 ${
                      isFollowing
                        ? 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                        : 'bg-[#1877F2] text-white hover:bg-[#166FE5]'
                    }`}
                  >
                    {isFollowing ? (
                      <>
                        <UserCheck className="w-4 h-4" />
                        <span>Following</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        <span>Follow</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => openChatWithUser(targetUser.id)}
                    className="min-h-[40px] px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-slate-800"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Message</span>
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={async () => {
                  const shareUrl = `${window.location.origin}/?tab=profile&profile=${encodeURIComponent(
                    targetUser.id
                  )}`;
                  if (navigator.share) {
                    try {
                      await navigator.share({
                        title: `${targetUser.name} on Kinbook`,
                        url: shareUrl,
                      });
                      return;
                    } catch {
                      // Fall back to clipboard copy
                    }
                  }
                  await navigator.clipboard?.writeText(shareUrl).catch(() => {});
                  setCopiedLink(true);
                  window.setTimeout(() => setCopiedLink(false), 2000);
                }}
                className="min-h-[40px] px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold inline-flex items-center gap-1.5"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Link Copied' : 'Share Link'}</span>
              </button>
            </div>
          </div>

          {/* Identity & Bio */}
          <div className="mt-3">
            <h1 className="text-xl font-bold text-slate-900">{targetUser.name}</h1>
            <p className="text-xs text-slate-500">@{targetUser.handle}</p>
            <p className="text-sm text-slate-700 mt-2.5 leading-relaxed max-w-2xl">
              {targetUser.bio}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600">
              {targetUser.work && (
                <span className="inline-flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                  <span>{targetUser.work}</span>
                </span>
              )}
              {targetUser.location && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{targetUser.location}</span>
                </span>
              )}
            </div>

            {/* Followers / Following Interactive Counters */}
            <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-wrap items-center gap-5 text-sm">
              <button
                type="button"
                onClick={() => setSubTab('followers')}
                className="hover:underline text-left"
              >
                <span className="font-bold text-slate-900 tabular-nums">
                  {targetUser.followers.length}
                </span>{' '}
                <span className="text-slate-600">Followers</span>
              </button>
              <button
                type="button"
                onClick={() => setSubTab('following')}
                className="hover:underline text-left"
              >
                <span className="font-bold text-slate-900 tabular-nums">
                  {targetUser.following.length}
                </span>{' '}
                <span className="text-slate-600">Following</span>
              </button>
              <span className="text-slate-500 tabular-nums">
                <strong className="text-slate-900">{userPosts.length}</strong> Posts
              </span>
            </div>
          </div>

          {/* Account Switcher Strip (makes multi-user testing across tabs effortless) */}
          <div className="mt-4 pt-3.5 border-t border-slate-100">
            <p className="text-[11px] font-semibold text-slate-500 mb-2">
              Switch Active Account (for multi-user messaging &amp; live testing)
            </p>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5">
              {users.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => switchUser(u.id)}
                  className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    currentUser.id === u.id
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {u.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sub-navigation Tabs */}
        <div className="px-4 border-t border-slate-200 flex items-center gap-1 overflow-x-auto no-scrollbar">
          {(
            [
              { key: 'posts', label: `Posts (${userPosts.length})` },
              { key: 'reels', label: `Reels (${userReels.length})` },
              { key: 'marketplace', label: `Listings (${userListings.length})` },
              { key: 'followers', label: `Followers (${followerUsers.length})` },
              { key: 'following', label: `Following (${followingUsers.length})` },
              { key: 'rn-source', label: 'React Native Android' },
            ] as { key: ProfileSubTab; label: string }[]
          ).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setSubTab(tab.key)}
              className={`min-h-[44px] px-3.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                subTab === tab.key
                  ? 'border-[#1877F2] text-[#1877F2]'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sub-Tab Content */}
      {subTab === 'posts' && (
        <div className="space-y-3">
          {userPosts.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-xs text-slate-500">
              No posts yet from {targetUser.name}.
            </div>
          ) : (
            userPosts.map((post) => (
              <div
                key={post.id}
                className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden p-4 space-y-2.5"
              >
                <div className="text-xs text-slate-500">
                  {formatRelativeTime(post.createdAt)}
                  {post.location ? ` · ${post.location}` : ''}
                </div>
                <p className="text-sm text-slate-800 leading-relaxed">{post.content}</p>
                {post.image && (
                  <SmartMedia
                    src={post.image}
                    alt="Profile post attachment"
                    sizeKb={post.imageSizeKb || 250}
                    freeMode={freeMode}
                    onUnlockCost={recordDataUnlocked}
                    containerClassName="rounded-xl"
                  />
                )}
              </div>
            ))
          )}
        </div>
      )}

      {subTab === 'reels' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {userReels.length === 0 ? (
            <div className="col-span-full bg-white border border-slate-200 rounded-2xl p-8 text-center text-xs text-slate-500">
              No Reels uploaded yet.
            </div>
          ) : (
            userReels.map((reel) => (
              <button
                key={reel.id}
                type="button"
                onClick={() => setActiveTab('reels')}
                className="relative aspect-[9/16] rounded-2xl overflow-hidden bg-slate-900 text-white text-left"
              >
                {!freeMode ? (
                  <img
                    src={reel.posterImage}
                    alt={reel.caption}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center p-3 text-center text-xs text-slate-300">
                    Reel ({reel.sizeMb} MB)
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <p className="absolute bottom-2.5 left-2.5 right-2.5 text-xs font-medium line-clamp-2">
                  {reel.caption}
                </p>
              </button>
            ))
          )}
        </div>
      )}

      {subTab === 'marketplace' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {userListings.length === 0 ? (
            <div className="col-span-full bg-white border border-slate-200 rounded-2xl p-8 text-center text-xs text-slate-500">
              No Marketplace items listed.
            </div>
          ) : (
            userListings.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab('marketplace')}
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden text-left"
              >
                <SmartMedia
                  src={item.image}
                  alt={item.title}
                  sizeKb={item.imageSizeKb}
                  freeMode={freeMode}
                  onUnlockCost={recordDataUnlocked}
                />
                <div className="p-3">
                  <p className="text-sm font-bold text-slate-900 font-mono tabular-nums">
                    {item.currency}
                    {item.price}
                  </p>
                  <p className="text-xs font-medium text-slate-700 truncate mt-0.5">{item.title}</p>
                </div>
              </button>
            ))
          )}
        </div>
      )}

      {(subTab === 'followers' || subTab === 'following') && (
        <div className="bg-white border border-slate-200/80 rounded-2xl divide-y divide-slate-100">
          {(subTab === 'followers' ? followerUsers : followingUsers).length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              <Users className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
              No users in this list yet.
            </div>
          ) : (
            (subTab === 'followers' ? followerUsers : followingUsers).map((person) => {
              const amFollowing = currentUser.following.includes(person.id);
              const isMe = person.id === currentUser.id;
              return (
                <div key={person.id} className="p-4 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => openUserProfile(person.id)}
                    className="flex items-center gap-3 min-w-0 text-left"
                  >
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-200 shrink-0">
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
                      <p className="text-sm font-bold text-slate-900 truncate">{person.name}</p>
                      <p className="text-xs text-slate-500 truncate">{person.location}</p>
                    </div>
                  </button>

                  {!isMe && (
                    <button
                      type="button"
                      onClick={() => toggleFollow(person.id)}
                      className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-semibold ${
                        amFollowing
                          ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          : 'bg-[#1877F2] text-white hover:bg-[#166FE5]'
                      }`}
                    >
                      {amFollowing ? 'Following' : 'Follow'}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {subTab === 'rn-source' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-[#1877F2]" />
            <h2 className="text-sm font-bold text-slate-900">
              React Native Android Architecture
            </h2>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            The project workspace also includes modular React Native Android source files under{' '}
            <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">react-native/</code>{' '}
            implementing bottom-tab navigation, Free Mode data-saver context, Reels, Marketplace,
            Live Stream, and Messenger screens.
          </p>
          <pre className="rounded-xl bg-slate-950 text-slate-100 p-4 text-xs font-mono overflow-x-auto leading-relaxed">
            {REACT_NATIVE_SNIPPET}
          </pre>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <form
            onSubmit={handleSaveProfile}
            className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl p-5 space-y-3.5"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Edit Profile</h2>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full min-h-[42px] rounded-xl border border-slate-200 px-3 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Bio</label>
              <textarea
                rows={3}
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Location</label>
                <input
                  type="text"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  className="w-full min-h-[42px] rounded-xl border border-slate-200 px-3 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Work</label>
                <input
                  type="text"
                  value={editWork}
                  onChange={(e) => setEditWork(e.target.value)}
                  className="w-full min-h-[42px] rounded-xl border border-slate-200 px-3 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Profile Photo
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) setEditAvatar(await readFileAsDataUrl(file));
                }}
                className="w-full text-xs text-slate-600"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="min-h-[44px] px-5 py-2 rounded-xl bg-[#1877F2] text-white text-xs font-semibold"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Create New Profile Modal */}
      {showCreateAccountModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <form
            onSubmit={handleCreateAccount}
            className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl p-5 space-y-3.5"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Create New Profile</h2>
              <button
                type="button"
                onClick={() => setShowCreateAccountModal(false)}
                className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Name</label>
              <input
                type="text"
                required
                value={newAccName}
                onChange={(e) => setNewAccName(e.target.value)}
                placeholder="Jordan Patel"
                className="w-full min-h-[42px] rounded-xl border border-slate-200 px-3 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Location</label>
                <input
                  type="text"
                  value={newAccLocation}
                  onChange={(e) => setNewAccLocation(e.target.value)}
                  className="w-full min-h-[42px] rounded-xl border border-slate-200 px-3 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Work</label>
                <input
                  type="text"
                  value={newAccWork}
                  onChange={(e) => setNewAccWork(e.target.value)}
                  placeholder="Designer"
                  className="w-full min-h-[42px] rounded-xl border border-slate-200 px-3 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Bio</label>
              <textarea
                rows={2}
                value={newAccBio}
                onChange={(e) => setNewAccBio(e.target.value)}
                placeholder="Tell neighbors a bit about yourself..."
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateAccountModal(false)}
                className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="min-h-[44px] px-5 py-2 rounded-xl bg-[#1877F2] text-white text-xs font-semibold"
              >
                Create &amp; Switch
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
