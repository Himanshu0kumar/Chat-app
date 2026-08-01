import React from 'react';

const EMOJIS = ['❤️', '👍', '😂', '😮', '😢', '🙏'];

export function ReactionPicker({ onSelect, onClose }) {
  return (
    <div className="flex items-center gap-1.5 bg-slate-800/90 backdrop-blur-md border border-slate-700 rounded-full px-2.5 py-1.5 shadow-xl animate-scaleUp z-50">
      {EMOJIS.map((emoji) => (
        <button
          key={emoji}
          onClick={() => {
            onSelect(emoji);
            if (onClose) onClose();
          }}
          className="text-lg hover:scale-125 hover:bg-slate-700/60 p-1 rounded-full transition-all duration-150"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
