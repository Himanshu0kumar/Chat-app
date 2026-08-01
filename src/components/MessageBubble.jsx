import React, { useState, useRef } from 'react';
import { Check, CheckCheck, FileText, Download, Play, Pause, Smile, Reply } from 'lucide-react';
import { ReactionPicker } from './ReactionPicker.jsx';

export function MessageBubble({
  message,
  isOwn,
  senderName,
  senderColor,
  isGroup,
  onReact,
  onReply,
  onMediaClick,
}) {
  const [showPicker, setShowPicker] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef(null);

  const {
    id,
    decryptedText,
    msgType,
    fileMeta,
    status,
    reactions = {},
    replyTo,
    timestamp,
    isFailed,
  } = message;

  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current.play();
      setIsPlayingAudio(true);
    }
  };

  const formattedTime = timestamp
    ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  const renderStatusTicks = () => {
    if (!isOwn) return null;
    if (isFailed) return <span className="text-red-400 text-xs font-bold ml-1">! Failed</span>;
    if (status === 'read') return <CheckCheck className="w-3.5 h-3.5 text-sky-400 inline stroke-[2.5]" />;
    if (status === 'delivered') return <CheckCheck className="w-3.5 h-3.5 text-slate-400 inline" />;
    return <Check className="w-3.5 h-3.5 text-slate-400 inline" />;
  };

  const reactionEntries = Object.entries(reactions).filter(([_, uids]) => uids.length > 0);

  return (
    <div className={`group relative flex flex-col my-1 max-w-[85%] sm:max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
      
      {/* Floating Quick Action Bar (Hover) */}
      <div className={`absolute -top-3 hidden group-hover:flex items-center gap-1 z-30 bg-slate-900/95 border border-slate-700/80 rounded-full px-2 py-0.5 shadow-lg backdrop-blur-md ${isOwn ? 'right-2' : 'left-2'}`}>
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="p-1 text-slate-400 hover:text-amber-400 transition-colors"
          title="React"
        >
          <Smile className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onReply(message)}
          className="p-1 text-slate-400 hover:text-emerald-400 transition-colors"
          title="Reply"
        >
          <Reply className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Emoji Reaction Picker Modal */}
      {showPicker && (
        <div className={`absolute -top-12 z-40 ${isOwn ? 'right-0' : 'left-0'}`}>
          <ReactionPicker
            onSelect={(emoji) => {
              onReact(id, emoji);
              setShowPicker(false);
            }}
            onClose={() => setShowPicker(false)}
          />
        </div>
      )}

      {/* Bubble Container */}
      <div
        className={`relative px-4 py-2.5 rounded-2xl shadow-md border text-sm transition-all ${
          isOwn
            ? 'bg-emerald-600 border-emerald-500/40 text-slate-100 rounded-tr-xs'
            : 'bg-slate-800 border-slate-700/80 text-slate-100 rounded-tl-xs'
        }`}
      >
        {/* Group Sender Name */}
        {isGroup && !isOwn && senderName && (
          <div className="text-[11px] font-bold mb-1" style={{ color: senderColor || '#10b981' }}>
            {senderName}
          </div>
        )}

        {/* Quoted Reply Banner */}
        {replyTo && (
          <div className="mb-2 p-2 rounded-xl bg-slate-950/40 border-l-4 border-emerald-400 text-xs">
            <div className="font-semibold text-emerald-300">{replyTo.senderName || 'Replying to'}</div>
            <div className="text-slate-300 truncate max-w-[220px]">{replyTo.text}</div>
          </div>
        )}

        {/* Content Types */}
        {msgType === 'audio' || fileMeta?.isAudio ? (
          /* Voice Note Player */
          <div className="flex items-center gap-3 py-1 min-w-[200px]">
            <button
              onClick={toggleAudio}
              className={`p-2.5 rounded-full text-slate-950 transition-all ${
                isOwn ? 'bg-slate-100 hover:bg-white' : 'bg-emerald-500 hover:bg-emerald-400'
              }`}
            >
              {isPlayingAudio ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-1 mb-1">
                <div className="h-1 flex-1 bg-slate-700/60 rounded-full overflow-hidden">
                  <div className={`h-full ${isPlayingAudio ? 'w-full transition-all duration-3000' : 'w-0'} bg-emerald-400`}></div>
                </div>
              </div>
              <span className="text-[10px] opacity-75 font-mono">
                Voice Note {fileMeta?.duration ? `(${fileMeta.duration}s)` : ''}
              </span>
            </div>
            {decryptedText && (
              <audio
                ref={audioRef}
                src={decryptedText}
                onEnded={() => setIsPlayingAudio(false)}
                className="hidden"
              />
            )}
          </div>
        ) : fileMeta?.isImage ? (
          /* Image Media */
          <div className="mb-1">
            <img
              src={decryptedText || fileMeta.url}
              alt={fileMeta.name || 'Attachment'}
              onClick={() => onMediaClick(decryptedText || fileMeta.url, fileMeta.name)}
              className="rounded-xl max-h-60 object-cover cursor-pointer hover:opacity-90 transition-opacity border border-slate-700/50"
            />
            {fileMeta.caption && <p className="mt-1 text-sm">{fileMeta.caption}</p>}
          </div>
        ) : fileMeta ? (
          /* Generic File Attachment */
          <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-950/30 border border-slate-700/50 mb-1">
            <FileText className="w-6 h-6 text-emerald-400" />
            <div className="flex-1 truncate">
              <div className="text-xs font-semibold truncate">{fileMeta.name}</div>
              <div className="text-[10px] text-slate-400">{fileMeta.size} KB</div>
            </div>
            <a
              href={decryptedText}
              download={fileMeta.name}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded-lg"
            >
              <Download className="w-4 h-4" />
            </a>
          </div>
        ) : (
          /* Standard Text Message */
          <p className="whitespace-pre-wrap break-words leading-relaxed">{decryptedText || message.ciphertext}</p>
        )}

        {/* Bottom Metadata: Timestamp + Ticks */}
        <div className="flex items-center justify-end gap-1.5 mt-1 text-[10px] opacity-70">
          <span>{formattedTime}</span>
          {renderStatusTicks()}
        </div>

        {/* Reaction Badges */}
        {reactionEntries.length > 0 && (
          <div className={`absolute -bottom-3 ${isOwn ? 'right-2' : 'left-2'} flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-full px-2 py-0.5 shadow-md text-xs z-20`}>
            {reactionEntries.map(([emoji, uids]) => (
              <span key={emoji} className="flex items-center gap-0.5">
                <span>{emoji}</span>
                {uids.length > 1 && <span className="text-[10px] text-slate-400 font-bold">{uids.length}</span>}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
