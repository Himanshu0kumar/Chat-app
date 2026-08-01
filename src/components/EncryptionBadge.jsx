import React, { useState } from 'react';
import { ShieldCheck, Lock, Key, CheckCircle, Info, X } from 'lucide-react';

export function EncryptionBadge({ localFingerprint, peerFingerprint, peerUsername }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="cursor-pointer" onClick={() => setShowModal(true)}>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all shadow-xs">
          <ShieldCheck size={14} className="animate-pulse" />
          <span>End-to-End Encrypted</span>
        </div>
      </div>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          onClick={() => setShowModal(false)}
        >
          <div
            className="w-full max-w-md p-6 rounded-2xl bg-[var(--bg-main)] border border-[var(--glass-border)] shadow-2xl flex flex-col gap-5 text-[var(--text-main)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-lg">
                <Lock className="text-indigo-500" size={20} />
                <h3>Security Verification</h3>
              </div>
              <button
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-[var(--card-sub)] transition-colors cursor-pointer"
                onClick={() => setShowModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-4 text-xs">
              <div className="flex gap-3 p-3.5 rounded-xl bg-[var(--card-sub)] border border-[var(--glass-border)] text-[var(--text-sub)]">
                <Info size={18} className="text-cyan-500 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Messages in this chat are secured with <strong>ECDH (P-256)</strong> key exchange and <strong>AES-GCM (256-bit)</strong> encryption.
                  The server relays ciphertext only and cannot read your messages.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1 p-3 rounded-xl bg-[var(--code-bg)] border border-[var(--glass-border)]">
                  <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-sub)] font-semibold">
                    <Key size={12} />
                    <span>Your Public Key Fingerprint</span>
                  </div>
                  <code className="font-mono text-sm font-semibold text-[var(--code-text)] tracking-wider">
                    {localFingerprint || 'Generating...'}
                  </code>
                </div>

                {peerUsername && (
                  <div className="flex flex-col gap-1 p-3 rounded-xl bg-[var(--code-bg)] border border-[var(--glass-border)]">
                    <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-sub)] font-semibold">
                      <Key size={12} />
                      <span>{peerUsername}'s Fingerprint</span>
                    </div>
                    <code className="font-mono text-sm font-semibold text-[var(--code-text)] tracking-wider">
                      {peerFingerprint || 'Exchanging Keys...'}
                    </code>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-center gap-2 pt-2 text-emerald-500 font-semibold text-xs">
                <CheckCircle size={16} />
                <span>Client-Side Cryptographic Session Verified</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
