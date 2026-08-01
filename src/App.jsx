import React, { useEffect } from 'react';
import { useCrypto } from './hooks/useCrypto.js';
import { useSocket } from './hooks/useSocket.js';
import { LoginScreen } from './components/LoginScreen.jsx';
import { ChatLayout } from './components/ChatLayout.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';

function MainApp() {
  const crypto = useCrypto();
  const { user, token, isAuthenticated, isLoading, logout } = useAuth();

  // Initialize or restore ECDH keypair identity whenever user logs in
  useEffect(() => {
    if (isAuthenticated && user?.id && !crypto.keys && !crypto.isInitializing) {
      crypto.initCrypto(user.id);
    }
  }, [isAuthenticated, user?.id, crypto]);

  const activeKeyPair = crypto.keys || crypto.keyPair;
  const socketState = useSocket(user, token, activeKeyPair);

  if (isLoading || (isAuthenticated && (!activeKeyPair || crypto.isInitializing))) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-950 text-slate-100 font-sans">
        <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-semibold text-slate-400">Initialising Zero-Knowledge Cryptographic Session...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <LoginScreen isCryptoInitializing={crypto.isInitializing} />;
  }

  return (
    <ChatLayout
      currentUser={user}
      token={token}
      users={socketState.users}
      recentChatUserIds={socketState.recentChatUserIds}
      unreadCounts={socketState.unreadCounts}
      groups={socketState.groups}
      selectedTarget={socketState.selectedTarget}
      messages={socketState.messages}
      isTyping={socketState.isTyping}
      typingUsername={socketState.typingUsername}
      keyPair={activeKeyPair}
      onSelectTarget={socketState.setSelectedTarget}
      onSendMessage={socketState.sendMessage}
      onReactToMessage={socketState.reactToMessage}
      onTypingStart={socketState.startTyping}
      onTypingStop={socketState.stopTyping}
      onCreateGroup={socketState.createGroupApi}
      onUpdateProfile={socketState.updateProfileApi}
      onLogout={logout}
    />
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ThemeProvider>
  );
}
