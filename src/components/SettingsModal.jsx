import React, { useState, useEffect } from 'react';
import {
  X,
  Settings,
  Shield,
  Bell,
  Palette,
  HardDrive,
  User,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  Check,
  Tag,
  Download,
  Trash2,
  Lock,
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle.jsx';

export function SettingsModal({
  currentUser,
  keyPair,
  onClose,
  onUpdateProfile,
  onLogout,
}) {
  const [activeTab, setActiveTab] = useState('account'); // 'account' | 'privacy' | 'notifications' | 'appearance' | 'storage'

  // Settings State initialized from localStorage
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem('cipherchat_sound_enabled') !== 'false';
  });

  const [showReadReceipts, setShowReadReceipts] = useState(() => {
    return localStorage.getItem('cipherchat_read_receipts') !== 'false';
  });

  const [showOnlineStatus, setShowOnlineStatus] = useState(() => {
    return localStorage.getItem('cipherchat_show_status') !== 'false';
  });

  const [bubbleColor, setBubbleColor] = useState(() => {
    return localStorage.getItem('cipherchat_bubble_color') || 'emerald';
  });

  const [exportedSuccess, setExportedSuccess] = useState(false);
  const [clearedSuccess, setClearedSuccess] = useState(false);

  // Save handlers
  const handleSoundToggle = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem('cipherchat_sound_enabled', String(next));
  };

  const handleReadReceiptsToggle = () => {
    const next = !showReadReceipts;
    setShowReadReceipts(next);
    localStorage.setItem('cipherchat_read_receipts', String(next));
  };

  const handleOnlineStatusToggle = () => {
    const next = !showOnlineStatus;
    setShowOnlineStatus(next);
    localStorage.setItem('cipherchat_show_status', String(next));
  };

  const handleBubbleColorSelect = (color) => {
    setBubbleColor(color);
    localStorage.setItem('cipherchat_bubble_color', color);
  };

  const handleExportBackup = () => {
    const backupData = {
      user: {
        id: currentUser?.id,
        tag_id: currentUser?.tag_id,
        username: currentUser?.username,
      },
      exportedAt: new Date().toISOString(),
      settings: {
        soundEnabled,
        showReadReceipts,
        showOnlineStatus,
        bubbleColor,
      },
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cipherchat_backup_${currentUser?.username || 'user'}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    setExportedSuccess(true);
    setTimeout(() => setExportedSuccess(false), 3000);
  };

  const handleClearCache = () => {
    if (window.confirm('Are you sure you want to clear local cache? This will reset local settings preferences.')) {
      localStorage.removeItem('cipherchat_sound_enabled');
      localStorage.removeItem('cipherchat_read_receipts');
      localStorage.removeItem('cipherchat_show_status');
      localStorage.removeItem('cipherchat_bubble_color');
      setClearedSuccess(true);
      setTimeout(() => setClearedSuccess(false), 3000);
    }
  };

  const tagId = currentUser?.tag_id || (currentUser?.id ? `@${currentUser.username}#${currentUser.id.slice(-4)}` : '');

  const bubbleColorOptions = [
    { id: 'emerald', name: 'Emerald Green', bg: 'bg-emerald-600' },
    { id: 'cyan', name: 'Cyan Blue', bg: 'bg-cyan-600' },
    { id: 'indigo', name: 'Indigo Purple', bg: 'bg-indigo-600' },
    { id: 'purple', name: 'Deep Purple', bg: 'bg-purple-600' },
    { id: 'rose', name: 'Rose Red', bg: 'bg-rose-600' },
  ];

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col md:flex-row h-[550px] animate-scaleUp">
        {/* Settings Navigation Sidebar */}
        <div className="w-full md:w-56 bg-slate-950/60 border-b md:border-b-0 md:border-r border-slate-800 p-4 flex flex-row md:flex-col justify-between shrink-0">
          <div className="space-y-1 w-full">
            <div className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              <Settings className="w-4 h-4 text-emerald-400" />
              <span>Settings</span>
            </div>

            <button
              onClick={() => setActiveTab('account')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'account'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Account Profile</span>
            </button>

            <button
              onClick={() => setActiveTab('privacy')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'privacy'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Privacy & Security</span>
            </button>

            <button
              onClick={() => setActiveTab('notifications')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'notifications'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>Notifications</span>
            </button>

            <button
              onClick={() => setActiveTab('appearance')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'appearance'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Palette className="w-4 h-4" />
              <span>Appearance</span>
            </button>

            <button
              onClick={() => setActiveTab('storage')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'storage'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <HardDrive className="w-4 h-4" />
              <span>Storage & Data</span>
            </button>
          </div>

          <div className="hidden md:block pt-4 border-t border-slate-800">
            <button
              onClick={onClose}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-all"
            >
              Done
            </button>
          </div>
        </div>

        {/* Content View */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-900">
          {/* Header Bar */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-slate-100 text-sm capitalize">
              {activeTab} Settings
            </h3>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Panels */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            {/* 1. Account Profile Tab */}
            {activeTab === 'account' && (
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-slate-950/60 rounded-2xl border border-slate-800">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-extrabold text-white shadow-md border-2 border-slate-800"
                    style={{ backgroundColor: currentUser?.avatar_color || '#10b981' }}
                  >
                    {currentUser?.username?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-100 text-base">{currentUser?.username}</h4>
                    <span className="inline-flex items-center gap-1 text-xs font-mono font-semibold text-emerald-400">
                      <Tag className="w-3 h-3" /> {tagId}
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bio / Status</span>
                  <p className="text-sm text-slate-200">{currentUser?.bio || 'Hey there! I am using CipherChat.'}</p>
                </div>

                <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Session Security</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5" /> End-to-End Encrypted
                  </span>
                </div>
              </div>
            )}

            {/* 2. Privacy & Security Tab */}
            {activeTab === 'privacy' && (
              <div className="space-y-4">
                <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <h5 className="text-sm font-semibold text-slate-200">Read Receipts</h5>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Show double checkmarks (✓✓) when messages are read.
                    </p>
                  </div>
                  <button
                    onClick={handleReadReceiptsToggle}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                      showReadReceipts ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {showReadReceipts ? 'Enabled' : 'Disabled'}
                  </button>
                </div>

                <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <h5 className="text-sm font-semibold text-slate-200">Online Presence</h5>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Show "Online" status badge to your active chat contacts.
                    </p>
                  </div>
                  <button
                    onClick={handleOnlineStatusToggle}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                      showOnlineStatus ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {showOnlineStatus ? 'Visible' : 'Hidden'}
                  </button>
                </div>
              </div>
            )}

            {/* 3. Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-4">
                <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {soundEnabled ? (
                      <Volume2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <VolumeX className="w-5 h-5 text-slate-500" />
                    )}
                    <div>
                      <h5 className="text-sm font-semibold text-slate-200">Message Notification Sounds</h5>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Play an audio chime when new messages arrive.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleSoundToggle}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                      soundEnabled ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {soundEnabled ? 'On' : 'Off'}
                  </button>
                </div>
              </div>
            )}

            {/* 4. Appearance Tab */}
            {activeTab === 'appearance' && (
              <div className="space-y-4">
                <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <h5 className="text-sm font-semibold text-slate-200">Interface Theme</h5>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Switch between Dark and Light mode interface themes.
                    </p>
                  </div>
                  <ThemeToggle />
                </div>

                <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-3">
                  <h5 className="text-sm font-semibold text-slate-200">Chat Bubble Color Accent</h5>
                  <div className="grid grid-cols-5 gap-2">
                    {bubbleColorOptions.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => handleBubbleColorSelect(opt.id)}
                        className={`p-3 rounded-xl flex flex-col items-center gap-1 border transition-all ${
                          bubbleColor === opt.id
                            ? 'border-emerald-400 bg-slate-900 scale-105 shadow-md'
                            : 'border-slate-800 bg-slate-950/40 hover:bg-slate-800/40'
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-full ${opt.bg} shadow-md`}></div>
                        <span className="text-[10px] text-slate-400 font-semibold">{opt.name.split(' ')[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 5. Storage & Data Tab */}
            {activeTab === 'storage' && (
              <div className="space-y-4">
                <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <h5 className="text-sm font-semibold text-slate-200">Export Backup Data</h5>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Download a JSON backup of your account settings & preferences.
                    </p>
                  </div>
                  <button
                    onClick={handleExportBackup}
                    className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md"
                  >
                    <Download className="w-4 h-4" /> Export
                  </button>
                </div>
                {exportedSuccess && (
                  <p className="text-xs font-bold text-emerald-400 text-center animate-pulse">
                    ✓ Backup JSON downloaded successfully!
                  </p>
                )}

                <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <h5 className="text-sm font-semibold text-red-400">Clear Local Settings Cache</h5>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Reset locally saved theme & audio preferences.
                    </p>
                  </div>
                  <button
                    onClick={handleClearCache}
                    className="px-3.5 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all"
                  >
                    <Trash2 className="w-4 h-4" /> Reset
                  </button>
                </div>
                {clearedSuccess && (
                  <p className="text-xs font-bold text-emerald-400 text-center animate-pulse">
                    ✓ Local settings cache reset.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
