import React, { useState, useEffect } from 'react';
import { Search, Users, User, Plus, LogOut, ShieldCheck, MessageSquare, Tag, Info, UserCheck, Loader2, Settings } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle.jsx';
import { UserProfileCardModal } from './UserProfileCardModal.jsx';

export function Sidebar({
  currentUser,
  token,
  users,
  recentChatUserIds = [],
  unreadCounts = {},
  groups,
  selectedTarget,
  onSelectTarget,
  onOpenProfile,
  onOpenCreateGroup,
  onOpenSettings,
  onLogout,
}) {
  const [activeTab, setActiveTab] = useState('chats'); // 'chats' | 'groups'
  const [searchQuery, setSearchQuery] = useState('');
  const [inspectUser, setInspectUser] = useState(null);
  const [remoteResults, setRemoteResults] = useState([]);
  const [isSearchingApi, setIsSearchingApi] = useState(false);

  const currentUserTag = currentUser?.tag_id || (currentUser?.id ? `@${currentUser.username}#${currentUser.id.slice(-4)}` : '');

  // Live REST API Search Debounce
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setRemoteResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearchingApi(true);
        const authToken = token || localStorage.getItem('cipherchat-token') || localStorage.getItem('cipherchat_token');
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`, {
          headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.users)) {
          setRemoteResults(data.users.filter((u) => u.id !== currentUser?.id));
        }
      } catch (err) {
        console.error('[Search API Error]', err);
      } finally {
        setIsSearchingApi(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, currentUser?.id]);

  // Local Filter
  const isSearching = !!searchQuery.trim();

  const filteredLocalUsers = users.filter((u) => {
    if (u.id === currentUser?.id) return false;

    // Default view when NOT searching: ONLY show users with previous chat history or active selection!
    if (!isSearching) {
      return (
        recentChatUserIds.includes(u.id) ||
        (selectedTarget?.type === 'user' && selectedTarget?.id === u.id)
      );
    }

    const rawQ = searchQuery.toLowerCase().trim();
    const cleanQ = rawQ.replace(/^@/, '');

    const username = (u.username || '').toLowerCase();
    const tagId = (u.tag_id || `@${u.username}#${(u.id || '').slice(-4)}`).toLowerCase();
    const cleanTag = tagId.replace(/^@/, '');
    const id = (u.id || '').toLowerCase();
    const shortId = (u.id || '').slice(-4).toLowerCase();

    return (
      username.includes(rawQ) ||
      username.includes(cleanQ) ||
      tagId.includes(rawQ) ||
      cleanTag.includes(cleanQ) ||
      id.includes(rawQ) ||
      id.includes(cleanQ) ||
      shortId.includes(cleanQ)
    );
  });

  // Combine Local & Remote results
  const combinedUserMap = new Map();
  filteredLocalUsers.forEach((u) => combinedUserMap.set(u.id, u));
  if (isSearching) {
    remoteResults.forEach((u) => {
      if (!combinedUserMap.has(u.id)) {
        combinedUserMap.set(u.id, u);
      }
    });
  }

  const combinedUserList = Array.from(combinedUserMap.values());

  const filteredGroups = groups.filter((g) =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalUnread = Object.values(unreadCounts).reduce((acc, count) => acc + (count || 0), 0);

  return (
    <aside className="w-80 sm:w-96 bg-slate-900 border-r border-slate-800 flex flex-col h-full shadow-xl font-sans">
      {/* 1. Header: Current User Profile Summary & Controls */}
      <div className="p-4 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between">
        <div
          onClick={onOpenProfile}
          className="flex items-center gap-3 cursor-pointer group p-1.5 rounded-2xl hover:bg-slate-800/60 transition-all min-w-0"
        >
          <div className="relative shrink-0">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-white shadow-md border-2 border-slate-800 text-base"
              style={{ backgroundColor: currentUser?.avatar_color || '#10b981' }}
            >
              {currentUser?.username?.charAt(0).toUpperCase()}
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900"></span>
          </div>

          <div className="flex flex-col min-w-0">
            <span className="font-bold text-sm text-slate-100 group-hover:text-emerald-400 transition-colors truncate">
              {currentUser?.username}
            </span>
            <span className="text-[11px] font-mono text-emerald-400 font-semibold truncate">
              {currentUserTag}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onOpenCreateGroup}
            className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-xl transition-all"
            title="Create New Group"
          >
            <Plus className="w-5 h-5" />
          </button>
          <ThemeToggle />
          <button
            onClick={onOpenSettings}
            className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-xl transition-all"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 2. Search Bar by Name or Unique Tag ID */}
      <div className="p-3 border-b border-slate-800/80">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Unique Tag ID (@Bob#fcb4) or Name..."
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-9 pr-8 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors font-medium"
          />
          {isSearchingApi ? (
            <Loader2 className="w-4 h-4 text-emerald-400 animate-spin absolute right-3 top-2.5" />
          ) : searchQuery ? (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-xs text-slate-500 hover:text-slate-300"
            >
              Clear
            </button>
          ) : null}
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="flex items-center border-b border-slate-800 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('chats')}
          className={`flex-1 py-3 flex items-center justify-center gap-2 border-b-2 transition-all ${
            activeTab === 'chats'
              ? 'border-emerald-500 text-emerald-400 bg-slate-800/30'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Direct Chats ({combinedUserList.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('groups')}
          className={`flex-1 py-3 flex items-center justify-center gap-2 border-b-2 transition-all ${
            activeTab === 'groups'
              ? 'border-emerald-500 text-emerald-400 bg-slate-800/30'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Groups ({filteredGroups.length})</span>
        </button>
      </div>

      {/* 4. Lists Container */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
        {activeTab === 'chats' ? (
          combinedUserList.length === 0 ? (
            <div className="text-center py-12 px-4 text-xs text-slate-500 space-y-2">
              <UserCheck className="w-8 h-8 mx-auto text-slate-600" />
              <p className="font-semibold text-slate-400">
                {isSearching ? 'No users found' : 'No recent chats'}
              </p>
              <p className="text-[11px] text-slate-600">
                {isSearching
                  ? 'Try searching by Unique Tag ID (e.g. @Bob#fcb4) or username.'
                  : 'Search for a user above by Unique Tag ID or Name to start a new chat.'}
              </p>
            </div>
          ) : (
            combinedUserList.map((user) => {
              const isSelected = selectedTarget?.type === 'user' && selectedTarget?.id === user.id;
              const isOnline = user.status === 'online';
              const userTag = user.tag_id || `@${user.username}#${user.id.slice(-4)}`;
              const unreadCount = unreadCounts[user.id] || 0;

              return (
                <div
                  key={user.id}
                  onClick={() => onSelectTarget({ type: 'user', id: user.id, data: user })}
                  className={`group relative flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all border ${
                    isSelected
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-slate-100 shadow-md'
                      : 'bg-slate-950/40 border-slate-800/60 hover:bg-slate-800/60 hover:border-slate-700/80 text-slate-300'
                  }`}
                >
                  {/* User Avatar */}
                  <div className="relative shrink-0">
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center font-extrabold text-white shadow-md text-lg"
                      style={{ backgroundColor: user.avatar_color || '#10b981' }}
                    >
                      {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <span
                      className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${
                        isOnline ? 'bg-emerald-500' : 'bg-slate-600'
                      }`}
                    ></span>
                  </div>

                  {/* User Info Section - Clean Grid Layout for Username & Tag ID */}
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className="font-bold text-sm text-slate-100 group-hover:text-emerald-300 transition-colors truncate">
                        {user.username}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/30 shrink-0">
                        {userTag}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="truncate max-w-[140px]">
                        {user.bio || 'Hey there! I am using CipherChat.'}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`text-[10px] font-semibold ${isOnline ? 'text-emerald-400' : 'text-slate-500'}`}>
                          {isOnline ? 'Online' : 'Offline'}
                        </span>
                        {unreadCount > 0 && (
                          <span className="px-2 py-0.5 text-[11px] font-extrabold bg-emerald-500 text-slate-950 rounded-full shadow-lg animate-pulse">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Info / Profile Inspect Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setInspectUser(user);
                    }}
                    className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-xl transition-all shrink-0"
                    title="View Full Profile & ID"
                  >
                    <Info className="w-4.5 h-4.5" />
                  </button>
                </div>
              );
            })
          )
        ) : (
          filteredGroups.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-500 space-y-2">
              <p>No groups created yet.</p>
              <button
                onClick={onOpenCreateGroup}
                className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-xl font-semibold border border-emerald-500/30"
              >
                + Create First Group
              </button>
            </div>
          ) : (
            filteredGroups.map((group) => {
              const isSelected = selectedTarget?.type === 'group' && selectedTarget?.id === group.id;
              const unreadCount = unreadCounts[group.id] || 0;

              return (
                <div
                  key={group.id}
                  onClick={() => onSelectTarget({ type: 'group', id: group.id, data: group })}
                  className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all border ${
                    isSelected
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-slate-100'
                      : 'bg-slate-950/40 border-slate-800/60 hover:bg-slate-800/50 text-slate-300'
                  }`}
                >
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center text-white font-bold shadow-md shrink-0">
                    <Users className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm truncate text-slate-100">{group.name}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/40">
                          {group.members?.length || 0} members
                        </span>
                        {unreadCount > 0 && (
                          <span className="px-2 py-0.5 text-[11px] font-extrabold bg-emerald-500 text-slate-950 rounded-full shadow-lg animate-pulse">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 truncate mt-0.5">
                      {group.description || 'Group E2EE Chat'}
                    </p>
                  </div>
                </div>
              );
            })
          )
        )}
      </div>

      {/* User Profile Card Modal */}
      {inspectUser && (
        <UserProfileCardModal
          user={inspectUser}
          onClose={() => setInspectUser(null)}
          onStartChat={(targetUser) => {
            onSelectTarget({ type: 'user', id: targetUser.id, data: targetUser });
          }}
        />
      )}
    </aside>
  );
}
