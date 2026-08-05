import React, { useState } from 'react';
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
  Check,
  Tag,
  Download,
  Trash2,
  Lock,
  LogOut,
  MessageSquare,
  HelpCircle,
  Key,
  FileText,
  CheckCheck,
  Copy,
  Clock,
  Send,
  Zap,
  Globe,
  Sliders,
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle.jsx';

export function SettingsModal({
  currentUser,
  keyPair,
  onClose,
  onUpdateProfile,
  onLogout,
  onDeleteAccount,
}) {
  const [activeTab, setActiveTab] = useState('account'); // 'account' | 'privacy' | 'chats' | 'notifications' | 'appearance' | 'storage' | 'help'

  // Bio state
  const [bioInput, setBioInput] = useState(currentUser?.bio || 'Hey there! I am using CipherChat.');
  const [isSavingBio, setIsSavingBio] = useState(false);
  const [bioSuccess, setBioSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // 1. Privacy Settings State
  const [lastSeenPrivacy, setLastSeenPrivacy] = useState(() => {
    return localStorage.getItem('cipherchat_last_seen_privacy') || 'everyone';
  });
  const [photoPrivacy, setPhotoPrivacy] = useState(() => {
    return localStorage.getItem('cipherchat_photo_privacy') || 'everyone';
  });
  const [aboutPrivacy, setAboutPrivacy] = useState(() => {
    return localStorage.getItem('cipherchat_about_privacy') || 'everyone';
  });
  const [showReadReceipts, setShowReadReceipts] = useState(() => {
    return localStorage.getItem('cipherchat_read_receipts') !== 'false';
  });
  const [showOnlineStatus, setShowOnlineStatus] = useState(() => {
    return localStorage.getItem('cipherchat_show_status') !== 'false';
  });
  const [disappearingTimer, setDisappearingTimer] = useState(() => {
    return localStorage.getItem('cipherchat_disappearing_timer') || 'off';
  });

  // 2. Chat Settings State
  const [enterIsSend, setEnterIsSend] = useState(() => {
    return localStorage.getItem('cipherchat_enter_is_send') !== 'false';
  });
  const [fontSize, setFontSize] = useState(() => {
    return localStorage.getItem('cipherchat_font_size') || 'medium';
  });
  const [autoDownloadPhotos, setAutoDownloadPhotos] = useState(() => {
    return localStorage.getItem('cipherchat_auto_photos') !== 'false';
  });
  const [autoDownloadDocs, setAutoDownloadDocs] = useState(() => {
    return localStorage.getItem('cipherchat_auto_docs') !== 'false';
  });

  // 3. Notification Settings State
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem('cipherchat_sound_enabled') !== 'false';
  });
  const [desktopNotif, setDesktopNotif] = useState(() => {
    return localStorage.getItem('cipherchat_desktop_notif') !== 'false';
  });
  const [notifPreview, setNotifPreview] = useState(() => {
    return localStorage.getItem('cipherchat_notif_preview') !== 'false';
  });

  // 4. Appearance Settings State
  const [bubbleColor, setBubbleColor] = useState(() => {
    return localStorage.getItem('cipherchat_bubble_color') || 'emerald';
  });

  // Feedback states
  const [exportedSuccess, setExportedSuccess] = useState(false);
  const [clearedSuccess, setClearedSuccess] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  // Change Handlers
  const handleSaveBio = async () => {
    try {
      setIsSavingBio(true);
      if (onUpdateProfile) {
        await onUpdateProfile({ bio: bioInput });
      }
      setBioSuccess(true);
      setTimeout(() => setBioSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to update bio:', err);
    } finally {
      setIsSavingBio(false);
    }
  };

  const handlePrivacyChange = (key, val, setter) => {
    setter(val);
    localStorage.setItem(`cipherchat_${key}`, val);
  };

  const handleToggleChange = (key, currentVal, setter) => {
    const next = !currentVal;
    setter(next);
    localStorage.setItem(`cipherchat_${key}`, String(next));
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
        lastSeenPrivacy,
        photoPrivacy,
        aboutPrivacy,
        showReadReceipts,
        showOnlineStatus,
        disappearingTimer,
        enterIsSend,
        fontSize,
        autoDownloadPhotos,
        autoDownloadDocs,
        soundEnabled,
        desktopNotif,
        notifPreview,
        bubbleColor,
      },
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cipherchat_whatsapp_settings_${currentUser?.username || 'user'}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    setExportedSuccess(true);
    setTimeout(() => setExportedSuccess(false), 3000);
  };

  const handleClearCache = () => {
    if (window.confirm('Are you sure you want to reset all WhatsApp settings to default?')) {
      const keysToClear = [
        'cipherchat_last_seen_privacy',
        'cipherchat_photo_privacy',
        'cipherchat_about_privacy',
        'cipherchat_read_receipts',
        'cipherchat_show_status',
        'cipherchat_disappearing_timer',
        'cipherchat_enter_is_send',
        'cipherchat_font_size',
        'cipherchat_auto_photos',
        'cipherchat_auto_docs',
        'cipherchat_sound_enabled',
        'cipherchat_desktop_notif',
        'cipherchat_notif_preview',
        'cipherchat_bubble_color',
      ];
      keysToClear.forEach((k) => localStorage.removeItem(k));

      setLastSeenPrivacy('everyone');
      setPhotoPrivacy('everyone');
      setAboutPrivacy('everyone');
      setShowReadReceipts(true);
      setShowOnlineStatus(true);
      setDisappearingTimer('off');
      setEnterIsSend(true);
      setFontSize('medium');
      setAutoDownloadPhotos(true);
      setAutoDownloadDocs(true);
      setSoundEnabled(true);
      setDesktopNotif(true);
      setNotifPreview(true);
      setBubbleColor('emerald');

      setClearedSuccess(true);
      setTimeout(() => setClearedSuccess(false), 3000);
    }
  };

  const copyPublicKey = () => {
    if (keyPair?.publicKeyPem) {
      navigator.clipboard.writeText(keyPair.publicKeyPem);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
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

  const tabs = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'chats', label: 'Chats', icon: MessageSquare },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'storage', label: 'Storage & Data', icon: HardDrive },
    { id: 'help', label: 'Help & About', icon: HelpCircle },
  ];

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl flex flex-col md:flex-row h-[600px] animate-scaleUp font-sans">
        {/* Navigation Sidebar (WhatsApp Style) */}
        <div className="w-full md:w-64 bg-slate-950/70 border-b md:border-b-0 md:border-r border-slate-800/80 p-4 flex flex-row md:flex-col justify-between shrink-0 overflow-x-auto custom-scrollbar">
          <div className="space-y-1.5 w-full">
            <div className="flex items-center gap-2 px-3 py-2 text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              <span>WhatsApp Settings</span>
            </div>

            {tabs.map((t) => {
              const Icon = t.icon;
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-800/80 space-y-2 mt-2 shrink-0">
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold rounded-xl transition-all shadow-sm group"
              title="Logout from account"
            >
              <LogOut className="w-4 h-4 text-red-400 group-hover:scale-110 transition-transform" />
              <span>Logout</span>
            </button>
            <button
              onClick={onClose}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-all hidden md:block"
            >
              Done
            </button>
          </div>
        </div>

        {/* Settings Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-900">
          {/* Header Bar */}
          <div className="p-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/40">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-100 text-sm sm:text-base capitalize">
                {tabs.find((t) => t.id === activeTab)?.label} Settings
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-all"
              title="Close Settings"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Body Panels */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
            {/* 1. Account Settings */}
            {activeTab === 'account' && (
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-slate-950/60 rounded-2xl border border-slate-800">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-extrabold text-white shadow-md border-2 border-slate-800 shrink-0"
                    style={{ backgroundColor: currentUser?.avatar_color || '#10b981' }}
                  >
                    {currentUser?.username?.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-slate-100 text-base truncate">{currentUser?.username}</h4>
                    <span className="inline-flex items-center gap-1 text-xs font-mono font-semibold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800/40 mt-1">
                      <Tag className="w-3 h-3" /> {tagId}
                    </span>
                  </div>
                </div>

                {/* Edit Bio / Status */}
                <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">About / Bio</span>
                    {bioSuccess && <span className="text-xs font-bold text-emerald-400">✓ Bio Updated!</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={bioInput}
                      onChange={(e) => setBioInput(e.target.value)}
                      placeholder="Add or update your bio..."
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors font-medium"
                    />
                    <button
                      onClick={handleSaveBio}
                      disabled={isSavingBio}
                      className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md shrink-0 disabled:opacity-50"
                    >
                      {isSavingBio ? 'Saving...' : 'Save Bio'}
                    </button>
                  </div>
                </div>

                {/* E2EE Security Fingerprint */}
                <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Key className="w-4 h-4 text-emerald-400" />
                      <h5 className="text-sm font-semibold text-slate-200">Security Encryption Key</h5>
                    </div>
                    <button
                      onClick={copyPublicKey}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg flex items-center gap-1 transition-all"
                    >
                      {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey ? 'Copied' : 'Copy Key'}</span>
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    End-to-End Encryption RSA 2048-bit public key paired with this device session.
                  </p>
                  <pre className="text-[10px] font-mono text-slate-400 bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 overflow-x-auto truncate">
                    {keyPair?.publicKeyPem || 'RSA 2048 Public Key Loaded & Verified'}
                  </pre>
                </div>

                {/* Permanent Account Deletion Box */}
                <div className="p-4 bg-red-950/30 border border-red-500/40 rounded-2xl flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-red-400">Delete Account Permanently</h5>
                    <p className="text-[11px] text-slate-400 mt-0.5">Permanently wipe your account and data from this platform.</p>
                  </div>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-3.5 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shrink-0"
                  >
                    <Trash2 className="w-4 h-4" /> Delete Account
                  </button>
                </div>
              </div>
            )}

            {/* 2. Privacy Settings (WhatsApp Style) */}
            {activeTab === 'privacy' && (
              <div className="space-y-4">
                {/* Last Seen & Online */}
                <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-3">
                  <div>
                    <h5 className="text-sm font-semibold text-slate-200">Last Seen & Online</h5>
                    <p className="text-xs text-slate-400 mt-0.5">Who can see when you are online and last active.</p>
                  </div>
                  <div className="flex gap-2">
                    {['everyone', 'contacts', 'nobody'].map((opt) => (
                      <button
                        key={opt}
                        onClick={() => handlePrivacyChange('last_seen_privacy', opt, setLastSeenPrivacy)}
                        className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold capitalize transition-all border ${
                          lastSeenPrivacy === opt
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/40'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Profile Photo Privacy */}
                <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-3">
                  <div>
                    <h5 className="text-sm font-semibold text-slate-200">Profile Photo</h5>
                    <p className="text-xs text-slate-400 mt-0.5">Who can see your profile avatar.</p>
                  </div>
                  <div className="flex gap-2">
                    {['everyone', 'contacts', 'nobody'].map((opt) => (
                      <button
                        key={opt}
                        onClick={() => handlePrivacyChange('photo_privacy', opt, setPhotoPrivacy)}
                        className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold capitalize transition-all border ${
                          photoPrivacy === opt
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/40'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Read Receipts */}
                <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <CheckCheck className="w-4 h-4 text-emerald-400" />
                      <h5 className="text-sm font-semibold text-slate-200">Read Receipts</h5>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Show blue checkmarks (✓✓) when messages are read.
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggleChange('read_receipts', showReadReceipts, setShowReadReceipts)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                      showReadReceipts ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {showReadReceipts ? 'Enabled' : 'Disabled'}
                  </button>
                </div>

                {/* Disappearing Messages Default Timer */}
                <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-400" />
                    <div>
                      <h5 className="text-sm font-semibold text-slate-200">Default Message Timer</h5>
                      <p className="text-xs text-slate-400 mt-0.5">Start new chats with disappearing messages.</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {['off', '24h', '7d', '90d'].map((t) => (
                      <button
                        key={t}
                        onClick={() => handlePrivacyChange('disappearing_timer', t, setDisappearingTimer)}
                        className={`py-1.5 px-2 rounded-xl text-xs font-bold uppercase transition-all border ${
                          disappearingTimer === t
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/40'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 3. Chats Settings (WhatsApp Style) */}
            {activeTab === 'chats' && (
              <div className="space-y-4">
                {/* Enter Key behavior */}
                <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Send className="w-4 h-4 text-emerald-400" />
                    <div>
                      <h5 className="text-sm font-semibold text-slate-200">Enter is Send</h5>
                      <p className="text-xs text-slate-400 mt-0.5">Pressing Enter key will send your message.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleChange('enter_is_send', enterIsSend, setEnterIsSend)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                      enterIsSend ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {enterIsSend ? 'On' : 'Off'}
                  </button>
                </div>

                {/* Font Size Selector */}
                <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-3">
                  <h5 className="text-sm font-semibold text-slate-200">Chat Font Size</h5>
                  <div className="flex gap-2">
                    {['small', 'medium', 'large'].map((sz) => (
                      <button
                        key={sz}
                        onClick={() => handlePrivacyChange('font_size', sz, setFontSize)}
                        className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold capitalize transition-all border ${
                          fontSize === sz
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/40'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Media Auto-Download */}
                <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-3">
                  <h5 className="text-sm font-semibold text-slate-200">Media Auto-Download</h5>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-medium">Auto-Download Images & Photos</span>
                      <button
                        onClick={() => handleToggleChange('auto_photos', autoDownloadPhotos, setAutoDownloadPhotos)}
                        className={`px-3 py-1 rounded-full text-[11px] font-bold ${
                          autoDownloadPhotos ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {autoDownloadPhotos ? 'Enabled' : 'Disabled'}
                      </button>
                    </div>
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/60">
                      <span className="text-slate-300 font-medium">Auto-Download Files & Documents</span>
                      <button
                        onClick={() => handleToggleChange('auto_docs', autoDownloadDocs, setAutoDownloadDocs)}
                        className={`px-3 py-1 rounded-full text-[11px] font-bold ${
                          autoDownloadDocs ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {autoDownloadDocs ? 'Enabled' : 'Disabled'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 4. Notification Settings */}
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
                      <p className="text-xs text-slate-400 mt-0.5">Play sound chimes for incoming messages.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleChange('sound_enabled', soundEnabled, setSoundEnabled)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                      soundEnabled ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {soundEnabled ? 'On' : 'Off'}
                  </button>
                </div>

                <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <h5 className="text-sm font-semibold text-slate-200">Desktop Push Notifications</h5>
                    <p className="text-xs text-slate-400 mt-0.5">Show desktop system alerts when app is minimized.</p>
                  </div>
                  <button
                    onClick={() => handleToggleChange('desktop_notif', desktopNotif, setDesktopNotif)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                      desktopNotif ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {desktopNotif ? 'Enabled' : 'Disabled'}
                  </button>
                </div>

                <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <h5 className="text-sm font-semibold text-slate-200">Notification Previews</h5>
                    <p className="text-xs text-slate-400 mt-0.5">Show message text preview in desktop popups.</p>
                  </div>
                  <button
                    onClick={() => handleToggleChange('notif_preview', notifPreview, setNotifPreview)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                      notifPreview ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {notifPreview ? 'Show' : 'Hide'}
                  </button>
                </div>
              </div>
            )}

            {/* 5. Appearance Settings */}
            {activeTab === 'appearance' && (
              <div className="space-y-4">
                <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <h5 className="text-sm font-semibold text-slate-200">Interface Mode Theme</h5>
                    <p className="text-xs text-slate-400 mt-0.5">Switch between Dark and Light mode interface.</p>
                  </div>
                  <ThemeToggle />
                </div>

                <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-3">
                  <h5 className="text-sm font-semibold text-slate-200">Chat Bubble Color Accent</h5>
                  <div className="grid grid-cols-5 gap-2">
                    {bubbleColorOptions.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => handlePrivacyChange('bubble_color', opt.id, setBubbleColor)}
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

            {/* 6. Storage & Data Settings */}
            {activeTab === 'storage' && (
              <div className="space-y-4">
                <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <h5 className="text-sm font-semibold text-slate-200">Export Settings & Data Backup</h5>
                    <p className="text-xs text-slate-400 mt-0.5">Download a JSON backup of your settings & keys.</p>
                  </div>
                  <button
                    onClick={handleExportBackup}
                    className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shrink-0"
                  >
                    <Download className="w-4 h-4" /> Export
                  </button>
                </div>
                {exportedSuccess && (
                  <p className="text-xs font-bold text-emerald-400 text-center animate-pulse">
                    ✓ WhatsApp Settings backup exported successfully!
                  </p>
                )}

                <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <h5 className="text-sm font-semibold text-red-400">Reset Local Settings</h5>
                    <p className="text-xs text-slate-400 mt-0.5">Reset all preferences to WhatsApp defaults.</p>
                  </div>
                  <button
                    onClick={handleClearCache}
                    className="px-3.5 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shrink-0"
                  >
                    <Trash2 className="w-4 h-4" /> Reset
                  </button>
                </div>
                {clearedSuccess && (
                  <p className="text-xs font-bold text-emerald-400 text-center animate-pulse">
                    ✓ Settings reset to WhatsApp default preferences.
                  </p>
                )}
              </div>
            )}

            {/* 7. Help & About Settings */}
            {activeTab === 'help' && (
              <div className="space-y-4">
                <div className="p-5 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-100 text-base">CipherChat Web Desktop</h4>
                      <span className="text-xs text-emerald-400 font-mono">v1.0.0 (WhatsApp E2EE Edition)</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed pt-1">
                    End-to-End Encrypted Web Desktop Messenger featuring zero-knowledge message security, RSA-OAEP 2048-bit key exchange, and custom chat controls.
                  </p>
                </div>

                <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                    <Globe className="w-4 h-4 text-emerald-400" />
                    <span>Cryptographic Audit & Zero-Knowledge Policy</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    All private keys remain exclusively stored on client browser storage. Server zero-knowledge relays store zero readable message content.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Account Permanent Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-scaleUp">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-lg font-extrabold text-slate-100">Delete Account Permanently?</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                This action is <strong className="text-red-400 font-bold">irreversible</strong>. All your message history, profile data, keys, and preferences will be permanently wiped from this platform.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  if (onDeleteAccount) onDeleteAccount();
                }}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-extrabold rounded-xl text-xs transition-all shadow-lg"
              >
                Yes, Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
