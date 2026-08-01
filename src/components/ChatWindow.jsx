import React, { useState, useRef, useEffect } from 'react';
import { Shield, ShieldAlert, Lock, Users, Phone, Video, MoreVertical, MessageSquare, Info } from 'lucide-react';
import { MessageBubble } from './MessageBubble.jsx';
import { MessageInput } from './MessageInput.jsx';
import { MediaLightbox } from './MediaLightbox.jsx';
import { EncryptionBadge } from './EncryptionBadge.jsx';
import { UserProfileCardModal } from './UserProfileCardModal.jsx';

export function ChatWindow({
  currentUser,
  target, // { type: 'user' | 'group', id, data }
  messages = [],
  isTyping = false,
  typingUsername = '',
  keyPair,
  onSendMessage,
  onTypingStart,
  onTypingStop,
  onReactToMessage,
}) {
  const [replyToMessage, setReplyToMessage] = useState(null);
  const [lightboxMedia, setLightboxMedia] = useState(null);
  const [showKeyBadge, setShowKeyBadge] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const messagesEndRef = useRef(null);

  const isGroup = target?.type === 'group';
  const targetData = target?.data;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  if (!target) {
    return (
      <div className="flex-1 bg-slate-950 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 mb-4 shadow-xl">
          <Lock className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-slate-100 mb-2">CipherChat Web for Desktop</h2>
        <p className="text-slate-400 max-w-md text-sm leading-relaxed mb-6">
          Send zero-knowledge end-to-end encrypted direct messages, voice notes, and group chats seamlessly.
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-full text-xs text-emerald-400 font-semibold">
          <Shield className="w-4 h-4" /> End-to-End Encrypted Architecture
        </div>
      </div>
    );
  }

  const statusSubtitle = isGroup
    ? `${targetData?.members?.length || 0} members • Group Chat`
    : targetData?.status === 'online'
    ? 'Online'
    : targetData?.last_seen
    ? `Last seen ${new Date(targetData.last_seen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : 'Offline';

  return (
    <div className="flex-1 bg-slate-950 flex flex-col h-full relative overflow-hidden">
      {/* Header */}
      <div className="p-3 sm:p-4 bg-slate-900/90 border-b border-slate-800/80 flex items-center justify-between backdrop-blur-md z-10 shadow-sm">
        <div
          onClick={() => !isGroup && setShowProfileModal(true)}
          className={`flex items-center gap-3 ${!isGroup ? 'cursor-pointer group hover:opacity-90 transition-opacity' : ''}`}
          title={!isGroup ? "Click to view full user profile" : ""}
        >
          {isGroup ? (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center text-white font-bold shadow-md">
              <Users className="w-5 h-5" />
            </div>
          ) : (
            <div className="relative shrink-0">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-md border border-slate-700 group-hover:border-emerald-500 transition-colors"
                style={{ backgroundColor: targetData?.avatar_color || '#10b981' }}
              >
                {targetData?.username?.charAt(0).toUpperCase()}
              </div>
              <span
                className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-900 ${
                  targetData?.status === 'online' ? 'bg-emerald-500' : 'bg-slate-600'
                }`}
              ></span>
            </div>
          )}

          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-100 text-sm sm:text-base group-hover:text-emerald-300 transition-colors">
                {isGroup ? targetData?.name : targetData?.username}
              </h3>
              {!isGroup && targetData && (
                <span className="text-xs font-mono font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/40">
                  {targetData.tag_id || `@${targetData.username}#${targetData.id?.slice(-4)}`}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">{statusSubtitle}</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 sm:gap-2">
          {!isGroup && (
            <button
              onClick={() => setShowProfileModal(true)}
              className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-xl transition-all"
              title="View User Profile"
            >
              <Info className="w-4.5 h-4.5" />
            </button>
          )}

          <button
            onClick={() => setShowKeyBadge(!showKeyBadge)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-semibold transition-all"
            title="View Security Keys"
          >
            <Shield className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">E2EE Verified</span>
          </button>
        </div>
      </div>

      {/* User Profile Modal */}
      {showProfileModal && !isGroup && (
        <UserProfileCardModal
          user={targetData}
          onClose={() => setShowProfileModal(false)}
          onStartChat={() => setShowProfileModal(false)}
        />
      )}

      {/* Security Key Badge Drawer */}
      {showKeyBadge && (
        <div className="p-3 bg-slate-900 border-b border-slate-800 animate-slideDown">
          <EncryptionBadge keyPair={keyPair} peerPublicKey={targetData?.publicKey} />
        </div>
      )}

      {/* Messages List Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="text-center py-16 text-slate-500 space-y-2">
            <Lock className="w-8 h-8 mx-auto text-emerald-500/50" />
            <p className="text-xs font-semibold text-slate-400">
              No messages yet. Send an E2EE message to start chatting!
            </p>
            <p className="text-[11px] text-slate-600 max-w-xs mx-auto">
              Messages are encrypted with AES-256 GCM on your device before transmission.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.senderId === currentUser?.id;
            return (
              <div key={msg.id || msg.tempId} className={`flex w-full ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <MessageBubble
                  message={msg}
                  isOwn={isOwn}
                  senderName={msg.senderUsername}
                  isGroup={isGroup}
                  onReact={onReactToMessage}
                  onReply={(m) => setReplyToMessage(m)}
                  onMediaClick={(url, name) => setLightboxMedia({ url, name })}
                />
              </div>
            );
          })
        )}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex items-center gap-2 text-xs text-emerald-400 bg-slate-900/80 px-3.5 py-2 rounded-2xl w-fit border border-slate-800 animate-pulse">
            <span className="font-semibold">{typingUsername || 'Someone'}</span> is typing...
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Box */}
      <MessageInput
        onSendMessage={onSendMessage}
        onTypingStart={onTypingStart}
        onTypingStop={onTypingStop}
        replyToMessage={replyToMessage}
        onCancelReply={() => setReplyToMessage(null)}
      />

      {/* Attachment Media Lightbox Modal */}
      {lightboxMedia && (
        <MediaLightbox
          mediaUrl={lightboxMedia.url}
          fileName={lightboxMedia.name}
          onClose={() => setLightboxMedia(null)}
        />
      )}
    </div>
  );
}
