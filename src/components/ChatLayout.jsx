import React, { useState } from 'react';
import { Sidebar } from './Sidebar.jsx';
import { ChatWindow } from './ChatWindow.jsx';
import { GroupModal } from './GroupModal.jsx';
import { ProfileModal } from './ProfileModal.jsx';
import { SettingsModal } from './SettingsModal.jsx';

export function ChatLayout({
  currentUser,
  token,
  users,
  recentChatUserIds = [],
  unreadCounts = {},
  groups,
  selectedTarget,
  messages,
  isTyping,
  typingUsername,
  keyPair,
  onSelectTarget,
  onSendMessage,
  onReactToMessage,
  onTypingStart,
  onTypingStop,
  onCreateGroup,
  onUpdateProfile,
  onLogout,
}) {
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        currentUser={currentUser}
        token={token}
        users={users}
        recentChatUserIds={recentChatUserIds}
        unreadCounts={unreadCounts}
        groups={groups}
        selectedTarget={selectedTarget}
        onSelectTarget={onSelectTarget}
        onOpenProfile={() => setShowProfile(true)}
        onOpenCreateGroup={() => setShowCreateGroup(true)}
        onOpenSettings={() => setShowSettings(true)}
        onLogout={onLogout}
      />

      {/* Main Chat Workspace */}
      <ChatWindow
        currentUser={currentUser}
        target={selectedTarget}
        messages={messages}
        isTyping={isTyping}
        typingUsername={typingUsername}
        keyPair={keyPair}
        onSendMessage={onSendMessage}
        onTypingStart={onTypingStart}
        onTypingStop={onTypingStop}
        onReactToMessage={onReactToMessage}
      />

      {/* Create Group Modal */}
      {showCreateGroup && (
        <GroupModal
          users={users}
          currentUser={currentUser}
          onClose={() => setShowCreateGroup(false)}
          onCreateGroup={onCreateGroup}
        />
      )}

      {/* Profile & Status Modal */}
      {showProfile && (
        <ProfileModal
          user={currentUser}
          keyPair={keyPair}
          onClose={() => setShowProfile(false)}
          onUpdateProfile={onUpdateProfile}
        />
      )}

      {/* App Settings Modal */}
      {showSettings && (
        <SettingsModal
          currentUser={currentUser}
          keyPair={keyPair}
          onClose={() => setShowSettings(false)}
          onUpdateProfile={onUpdateProfile}
          onLogout={onLogout}
        />
      )}
    </div>
  );
}
