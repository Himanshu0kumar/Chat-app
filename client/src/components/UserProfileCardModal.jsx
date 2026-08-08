import React from 'react';
import { X, MessageSquare, Tag, ShieldCheck, User } from 'lucide-react';

export function UserProfileCardModal({ user, onClose, onStartChat }) {
  if (!user) return null;

  const tagId = user.tag_id || (user.id ? `@${user.username}#${user.id.slice(-4)}` : '');
  const isOnline = user.status === 'online';

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl animate-scaleUp">
        {/* Header Banner */}
        <div className="relative bg-gradient-to-br from-emerald-900/40 via-slate-900 to-slate-900 p-6 text-center border-b border-slate-800">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="relative w-24 h-24 rounded-full mx-auto mb-3">
            <div
              className="w-full h-full rounded-full flex items-center justify-center text-4xl font-extrabold text-white shadow-2xl border-4 border-slate-900"
              style={{ backgroundColor: user.avatar_color || '#10b981' }}
            >
              {user.username.charAt(0).toUpperCase()}
            </div>
            <span
              className={`absolute bottom-1 right-1 w-5 h-5 rounded-full border-4 border-slate-900 ${
                isOnline ? 'bg-emerald-500' : 'bg-slate-600'
              }`}
            ></span>
          </div>

          <h3 className="text-xl font-bold text-slate-100">{user.username}</h3>
          
          <div className="inline-flex items-center gap-1.5 mt-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-slate-950/80 text-emerald-400 border border-emerald-500/30">
            <Tag className="w-3 h-3 text-emerald-400" />
            {tagId}
          </div>

          <div className="mt-2 text-xs text-slate-400">
            {isOnline ? (
              <span className="text-emerald-400 font-semibold">• Active Now</span>
            ) : (
              <span>Offline</span>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">About / Status</div>
            <p className="text-sm text-slate-200">{user.bio || 'Hey there! I am using CipherChat.'}</p>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Security State
            </span>
            <span className="text-emerald-300 font-semibold">Verified E2EE Peer</span>
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => {
              onStartChat(user);
              onClose();
            }}
            className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
          >
            <MessageSquare className="w-4 h-4" /> Start Chat
          </button>
        </div>
      </div>
    </div>
  );
}
