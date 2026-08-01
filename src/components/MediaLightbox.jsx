import React from 'react';
import { X, Download } from 'lucide-react';

export function MediaLightbox({ mediaUrl, fileName, onClose }) {
  if (!mediaUrl) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between bg-gradient-to-b from-slate-950/80 to-transparent">
        <span className="text-sm font-medium text-slate-300 truncate max-w-xs">{fileName || 'Attachment Preview'}</span>
        <div className="flex items-center gap-3">
          <a
            href={mediaUrl}
            download={fileName || 'attachment'}
            className="p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-full transition-colors"
            title="Download File"
          >
            <Download className="w-5 h-5" />
          </a>
          <button
            onClick={onClose}
            className="p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-full transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Image Display */}
      <div className="max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl shadow-2xl border border-slate-800">
        <img
          src={mediaUrl}
          alt={fileName || 'Attachment'}
          className="w-full h-full object-contain max-h-[85vh] rounded-2xl"
        />
      </div>
    </div>
  );
}
