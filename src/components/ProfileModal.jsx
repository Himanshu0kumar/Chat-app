import React, { useState } from 'react';
import { X, User, Edit2, Check, ShieldCheck, Key, Copy, Tag } from 'lucide-react';

export function ProfileModal({ user, keyPair, onClose, onUpdateProfile }) {
  const [bio, setBio] = useState(user?.bio || 'Hey there! I am using CipherChat.');
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const handleSaveBio = async () => {
    setIsSaving(true);
    try {
      await onUpdateProfile({ bio });
      setIsEditingBio(false);
    } catch (err) {
      console.error('[Profile Update Error]', err);
    } finally {
      setIsSaving(false);
    }
  };

  const tagId = user?.tag_id || (user?.id ? `@${user.username}#${user.id.slice(-4)}` : '');

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const formattedKeyFingerprint = keyPair?.fingerprint
    ? keyPair.fingerprint
    : keyPair?.jwk?.x
    ? `${keyPair.jwk.x.slice(0, 8)}...${keyPair.jwk.y.slice(-8)}`
    : 'Session Key Active';

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl animate-scaleUp">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-emerald-900/50 via-slate-900 to-slate-900 p-6 text-center border-b border-slate-800">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>

          <div
            className="w-24 h-24 rounded-full mx-auto flex items-center justify-center text-4xl font-extrabold text-white shadow-2xl border-4 border-slate-900 mb-3"
            style={{ backgroundColor: user?.avatar_color || '#10b981' }}
          >
            {user?.username ? user.username.charAt(0).toUpperCase() : <User className="w-10 h-10" />}
          </div>

          <h2 className="text-xl font-bold text-slate-100">{user?.username}</h2>
          
          {/* Unique Tag ID Badge */}
          <div className="flex items-center justify-center gap-1.5 mt-1.5">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-mono font-bold bg-slate-950/80 text-emerald-400 border border-emerald-500/30">
              <Tag className="w-3 h-3 text-emerald-400" />
              {tagId}
            </span>
            <button
              onClick={() => copyToClipboard(tagId)}
              className="p-1 text-slate-400 hover:text-emerald-400 transition-colors"
              title="Copy Unique Tag ID"
            >
              {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="mt-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-3 h-3" /> Verified Cryptographic Account
            </span>
          </div>
        </div>

        {/* Profile Content */}
        <div className="p-6 space-y-4">
          {/* Bio / About */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              <span>About / Status</span>
              {!isEditingBio && (
                <button
                  onClick={() => setIsEditingBio(true)}
                  className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit
                </button>
              )}
            </div>

            {isEditingBio ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={100}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                />
                <button
                  onClick={handleSaveBio}
                  disabled={isSaving}
                  className="p-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl transition-all font-bold"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                </button>
              </div>
            ) : (
              <p className="text-sm text-slate-200">{user?.bio || 'Hey there! I am using CipherChat.'}</p>
            )}
          </div>

          {/* Security & Key Fingerprint */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              <Key className="w-3.5 h-3.5 text-emerald-400" />
              <span>Public Key Fingerprint</span>
            </div>
            <p className="font-mono text-xs text-emerald-300 bg-emerald-950/30 p-2.5 rounded-xl border border-emerald-800/40 break-all">
              {formattedKeyFingerprint}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50 text-center">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors"
          >
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );
}
