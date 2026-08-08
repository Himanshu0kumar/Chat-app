import React, { useState, useRef } from 'react';
import { Send, Paperclip, Mic, X, Image as ImageIcon } from 'lucide-react';
import { VoiceRecorder } from './VoiceRecorder.jsx';

export function MessageInput({ onSendMessage, onTypingStart, onTypingStop, replyToMessage, onCancelReply }) {
  const [text, setText] = useState('');
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const fileInputRef = useRef(null);
  const typingTimerRef = useRef(null);

  const handleTextChange = (e) => {
    setText(e.target.value);

    if (onTypingStart) {
      onTypingStart();
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        if (onTypingStop) onTypingStop();
      }, 2000);
    }
  };

  const handleSend = (e) => {
    e?.preventDefault();
    if (!text.trim()) return;

    onSendMessage({
      text: text.trim(),
      msgType: 'text',
      replyTo: replyToMessage ? {
        id: replyToMessage.id,
        text: replyToMessage.decryptedText || 'Media message',
        senderName: replyToMessage.senderUsername || 'Contact',
      } : null,
    });

    setText('');
    if (onCancelReply) onCancelReply();
    if (onTypingStop) onTypingStop();
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = reader.result;
      const isImage = file.type.startsWith('image/');
      const isAudio = file.type.startsWith('audio/');

      onSendMessage({
        text: base64Data,
        msgType: isImage ? 'image' : isAudio ? 'audio' : 'file',
        fileMeta: {
          name: file.name,
          size: Math.round(file.size / 1024),
          mimeType: file.type,
          isImage,
          isAudio,
        },
        replyTo: replyToMessage ? {
          id: replyToMessage.id,
          text: replyToMessage.decryptedText || 'Media message',
        } : null,
      });

      if (onCancelReply) onCancelReply();
    };

    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleVoiceSend = ({ audioData, duration }) => {
    onSendMessage({
      text: audioData,
      msgType: 'audio',
      fileMeta: {
        name: `Voice Note (${duration}s)`,
        duration,
        isAudio: true,
        mimeType: 'audio/webm',
      },
    });

    setIsRecordingVoice(false);
  };

  return (
    <div className="bg-slate-900/90 border-t border-slate-800/80 p-3 backdrop-blur-md">
      {/* Quoted Reply Banner */}
      {replyToMessage && (
        <div className="flex items-center justify-between bg-slate-950/80 border-l-4 border-emerald-400 p-2.5 rounded-xl mb-2 animate-fadeIn">
          <div className="flex-1 truncate">
            <div className="text-xs font-semibold text-emerald-400">
              Replying to {replyToMessage.senderUsername || 'Message'}
            </div>
            <div className="text-xs text-slate-300 truncate">
              {replyToMessage.decryptedText || 'Media attachment'}
            </div>
          </div>
          <button
            onClick={onCancelReply}
            className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Voice Recorder Overlay */}
      {isRecordingVoice ? (
        <VoiceRecorder
          onSend={handleVoiceSend}
          onCancel={() => setIsRecordingVoice(false)}
        />
      ) : (
        /* Regular Input Form */
        <form onSubmit={handleSend} className="flex items-center gap-2">
          {/* File Attachment Button */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept="image/*,audio/*,.pdf,.doc,.docx,.zip,.txt"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-full transition-all"
            title="Attach Media / File"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          {/* Message Text Input */}
          <input
            type="text"
            value={text}
            onChange={handleTextChange}
            placeholder="Type an end-to-end encrypted message..."
            className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all"
          />

          {/* Voice Note Button or Send Button */}
          {text.trim() ? (
            <button
              type="submit"
              className="p-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-full transition-all shadow-lg shadow-emerald-500/20"
              title="Send Message"
            >
              <Send className="w-5 h-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsRecordingVoice(true)}
              className="p-2.5 bg-slate-800 hover:bg-emerald-500/20 text-emerald-400 rounded-full transition-all border border-slate-700/60"
              title="Record Voice Note"
            >
              <Mic className="w-5 h-5" />
            </button>
          )}
        </form>
      )}
    </div>
  );
}
