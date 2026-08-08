import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import {
  encryptMessage,
  decryptMessage,
  deriveSharedKey,
  exportPublicKey,
  importPublicKey,
} from '../lib/crypto.js';

export function useSocket(user, token, keyPair) {
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [persistentConversationUserIds, setPersistentConversationUserIds] = useState([]);
  const [selectedTarget, setSelectedTarget] = useState(null); // { type: 'user' | 'group', id, data }
  const [messagesByTarget, setMessagesByTarget] = useState({}); // targetId -> Array<Message>
  const [typingState, setTypingState] = useState({}); // targetId -> boolean
  const [isSocketConnected, setIsSocketConnected] = useState(false);

  const socketRef = useRef(null);

  // Helper to fetch user conversations via REST API
  const fetchConversations = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/v1/users/conversations', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.conversations)) {
        setPersistentConversationUserIds(data.conversations.map((u) => u.id));
        setUsers((prev) => {
          const map = new Map();
          prev.forEach((u) => map.set(u.id, u));
          data.conversations.forEach((u) => {
            if (!map.has(u.id)) map.set(u.id, u);
          });
          return Array.from(map.values());
        });
      }
    } catch (err) {
      console.error('[Conversations Fetch Error]', err);
    }
  }, [token]);

  // Helper to fetch user groups via REST API
  const fetchMyGroups = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/v1/groups', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setGroups(data.groups);
      }
    } catch (err) {
      console.error('[Group Fetch Error]', err);
    }
  }, [token]);

  // Connect Socket.IO
  useEffect(() => {
    if (!token || !keyPair) return;

    fetchConversations();
    fetchMyGroups();

    const socket = io('/', {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
    });

    socketRef.current = socket;

    socket.on('connect', async () => {
      setIsSocketConnected(true);
      const exportedPk = await exportPublicKey(keyPair.publicKey);
      socket.emit('user:join', { publicKey: exportedPk });
      socket.emit('conversations:request');
      fetchMyGroups();
    });

    socket.on('disconnect', () => {
      setIsSocketConnected(false);
    });

    // Conversations Response
    socket.on('conversations:response', ({ conversations }) => {
      if (Array.isArray(conversations)) {
        setPersistentConversationUserIds(conversations.map((u) => u.id));
        setUsers((prev) => {
          const map = new Map();
          prev.forEach((u) => map.set(u.id, u));
          conversations.forEach((u) => {
            if (!map.has(u.id)) map.set(u.id, u);
          });
          return Array.from(map.values());
        });
      }
    });

    // Unread Counts Sync
    socket.on('unread:counts', (counts) => {
      if (counts && typeof counts === 'object') {
        setUnreadCounts((prev) => ({ ...prev, ...counts }));
      }
    });

    // 1. Presence / User list updates
    socket.on('users:list', (userList) => {
      setUsers(userList);
    });

    // 2. Direct message history response
    socket.on('history:response', async ({ targetUserId, history }) => {
      const targetUser = users.find((u) => u.id === targetUserId) || selectedTarget?.data;

      const decryptedHistory = await Promise.all(
        history.map(async (msg) => {
          if (!msg.ciphertext) return { ...msg, decryptedText: '' };
          if (!msg.iv || msg.iv === 'plain') {
            return { ...msg, decryptedText: msg.ciphertext };
          }

          try {
            const isOwn = msg.senderId === user.id;
            const peerUser = users.find((u) => u.id === targetUserId || u.id === (isOwn ? msg.receiverId : msg.senderId));
            const peerPk = isOwn
              ? (msg.receiverPublicKey || targetUser?.publicKey || peerUser?.publicKey)
              : (msg.senderPublicKey || targetUser?.publicKey || peerUser?.publicKey);

            if (peerPk) {
              const importedPk = await importPublicKey(peerPk);
              const sharedKey = await deriveSharedKey(keyPair.privateKey, importedPk);
              const text = await decryptMessage(sharedKey, msg.ciphertext, msg.iv);
              return { ...msg, decryptedText: text };
            }
          } catch (err) {
            console.error('[History Decryption Error]', err);
          }

          return { ...msg, decryptedText: msg.ciphertext };
        })
      );

      setMessagesByTarget((prev) => {
        const currentList = prev[targetUserId] || [];
        const merged = decryptedHistory.map((m) => {
          const matched = currentList.find((c) => (c.id && c.id === m.id) || (c.tempId && c.tempId === m.tempId));
          const bestText = (m.decryptedText && m.decryptedText !== m.ciphertext)
            ? m.decryptedText
            : (matched && matched.decryptedText && matched.decryptedText !== m.ciphertext)
            ? matched.decryptedText
            : m.decryptedText || m.ciphertext;

          return { ...m, decryptedText: bestText };
        });

        return {
          ...prev,
          [targetUserId]: merged,
        };
      });
    });

    // 3. Receive new direct message
    socket.on('message:receive', async (msg) => {
      const targetId = msg.from;
      let text = msg.ciphertext;

      const senderPk = msg.senderPublicKey || users.find((u) => u.id === msg.from)?.publicKey;

      if (msg.ciphertext && msg.iv && msg.iv !== 'plain' && senderPk) {
        try {
          const importedRemotePk = await importPublicKey(senderPk);
          const sharedKey = await deriveSharedKey(keyPair.privateKey, importedRemotePk);
          text = await decryptMessage(sharedKey, msg.ciphertext, msg.iv);
        } catch (err) {
          console.error('[Receive Decryption Error]', err);
          text = msg.ciphertext;
        }
      }

      const decryptedMsg = { ...msg, senderId: msg.from, decryptedText: text };

      setMessagesByTarget((prev) => {
        const currentList = prev[targetId] || [];
        if (currentList.some(m => m.id === msg.id)) {
          return prev;
        }
        return {
          ...prev,
          [targetId]: [...currentList, decryptedMsg],
        };
      });

      // Increment unread count if target is not currently open
      setUnreadCounts((prev) => {
        if (selectedTargetRef.current?.id === targetId) {
          return { ...prev, [targetId]: 0 };
        }
        return { ...prev, [targetId]: (prev[targetId] || 0) + 1 };
      });

      // Send read receipt if active chat window
      if (selectedTargetRef.current?.id === targetId) {
        socket.emit('message:read', { messageIds: [msg.id], targetUserId: targetId });
      }
    });

    // 4. Message Send Acknowledgment back from server
    socket.on('message:ack', (ackMsg) => {
      const targetId = ackMsg.to;
      setMessagesByTarget((prev) => {
        const currentList = prev[targetId] || [];
        const index = currentList.findIndex((m) => m.id === ackMsg.id || m.id === ackMsg.tempId || m.tempId === ackMsg.tempId);
        if (index >= 0) {
          const updated = [...currentList];
          const existingText = updated[index].decryptedText || updated[index].ciphertext || ackMsg.ciphertext;
          updated[index] = { ...updated[index], ...ackMsg, decryptedText: existingText };
          return { ...prev, [targetId]: updated };
        }
        return { ...prev, [targetId]: [...currentList, { ...ackMsg, decryptedText: ackMsg.ciphertext }] };
      });
    });

    // 5. Read receipt updates
    socket.on('message:read_ack', ({ messageIds, readBy }) => {
      setMessagesByTarget((prev) => {
        const updatedMap = { ...prev };
        Object.keys(updatedMap).forEach((tId) => {
          updatedMap[tId] = updatedMap[tId].map((m) =>
            messageIds.includes(m.id) ? { ...m, status: 'read' } : m
          );
        });
        return updatedMap;
      });
    });

    // 6. Reaction updates
    socket.on('message:reaction_update', ({ messageId, reactions }) => {
      setMessagesByTarget((prev) => {
        const updatedMap = { ...prev };
        Object.keys(updatedMap).forEach((tId) => {
          updatedMap[tId] = updatedMap[tId].map((m) =>
            m.id === messageId ? { ...m, reactions } : m
          );
        });
        return updatedMap;
      });
    });

    // 7. Group history response
    socket.on('group:history_response', ({ groupId, history }) => {
      const mapped = history.map((m) => ({
        ...m,
        decryptedText: m.ciphertext,
      }));
      setMessagesByTarget((prev) => ({
        ...prev,
        [groupId]: mapped,
      }));
    });

    // 8. Receive new group message
    socket.on('group:message:receive', (msg) => {
      const groupId = msg.groupId;
      const decryptedMsg = { ...msg, decryptedText: msg.ciphertext };

      setMessagesByTarget((prev) => {
        const current = prev[groupId] || [];
        return { ...prev, [groupId]: [...current, decryptedMsg] };
      });

      setUnreadCounts((prev) => {
        if (selectedTargetRef.current?.id === groupId) {
          return { ...prev, [groupId]: 0 };
        }
        return { ...prev, [groupId]: (prev[groupId] || 0) + 1 };
      });
    });

    // 9. New Group Created Event
    socket.on('group:new', (newGroup) => {
      setGroups((prev) => [...prev.filter((g) => g.id !== newGroup.id), newGroup]);
    });

    // 10. Typing signals
    socket.on('typing:start', ({ from, username: typist }) => {
      setTypingState((prev) => ({ ...prev, [from]: typist }));
    });

    socket.on('typing:stop', ({ from }) => {
      setTypingState((prev) => {
        const next = { ...prev };
        delete next[from];
        return next;
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [token, keyPair, user?.id, fetchMyGroups]);

  const [unreadCounts, setUnreadCounts] = useState({});
  const selectedTargetRef = useRef(selectedTarget);

  useEffect(() => {
    selectedTargetRef.current = selectedTarget;
  }, [selectedTarget]);

  // Request history when active target changes
  useEffect(() => {
    if (!selectedTarget) return;

    setUnreadCounts((prev) => ({ ...prev, [selectedTarget.id]: 0 }));

    if (!socketRef.current) return;

    if (selectedTarget.type === 'user') {
      socketRef.current.emit('history:request', { targetUserId: selectedTarget.id });
    } else if (selectedTarget.type === 'group') {
      socketRef.current.emit('group:history', { groupId: selectedTarget.id });
    }
  }, [selectedTarget]);

  // Auto re-decrypt messages whenever users list or active target updates
  useEffect(() => {
    if (!keyPair || !selectedTarget || selectedTarget.type !== 'user') return;
    const targetId = selectedTarget.id;

    const runAutoDecrypt = async () => {
      const targetUser = users.find((u) => u.id === targetId) || selectedTarget.data;

      setMessagesByTarget((prev) => {
        const currentMsgs = prev[targetId];
        if (!currentMsgs || currentMsgs.length === 0) return prev;

        let needsUpdate = false;
        Promise.all(
          currentMsgs.map(async (msg) => {
            if (!msg.ciphertext || msg.iv === 'plain') return msg;
            if (!msg.decryptedText || msg.decryptedText === msg.ciphertext) {
              try {
                const isOwn = msg.senderId === user.id;
                const peerPk = isOwn
                  ? (msg.receiverPublicKey || targetUser?.publicKey)
                  : (msg.senderPublicKey || targetUser?.publicKey);

                if (peerPk) {
                  const importedPk = await importPublicKey(peerPk);
                  const sharedKey = await deriveSharedKey(keyPair.privateKey, importedPk);
                  const text = await decryptMessage(sharedKey, msg.ciphertext, msg.iv);
                  needsUpdate = true;
                  return { ...msg, decryptedText: text };
                }
              } catch (err) {
                // ignore
              }
            }
            return msg;
          })
        ).then((updated) => {
          if (needsUpdate) {
            setMessagesByTarget((latest) => {
              const list = latest[targetId] || [];
              const merged = list.map((m) => {
                const match = updated.find((u) => u.id === m.id || u.tempId === m.tempId);
                if (match && match.decryptedText && match.decryptedText !== m.ciphertext) {
                  return { ...m, decryptedText: match.decryptedText };
                }
                return m;
              });
              return { ...latest, [targetId]: merged };
            });
          }
        });

        return prev;
      });
    };

    runAutoDecrypt();
  }, [users, selectedTarget?.id, keyPair, user?.id]);

  // Send Direct or Group Message
  const sendMessage = async ({ text, msgType = 'text', fileMeta, replyTo }) => {
    if (!socketRef.current || !selectedTarget) return;

    const exportedPk = await exportPublicKey(keyPair.publicKey);

    if (selectedTarget.type === 'user') {
      const recipient = (selectedTarget.data && selectedTarget.data.publicKey)
        ? selectedTarget.data
        : users.find((u) => u.id === selectedTarget.id);

      let ciphertext = text;
      let iv = 'plain';

      if (recipient?.publicKey) {
        try {
          const importedRemotePk = await importPublicKey(recipient.publicKey);
          const sharedKey = await deriveSharedKey(keyPair.privateKey, importedRemotePk);
          const encrypted = await encryptMessage(sharedKey, text);
          ciphertext = encrypted.ciphertext;
          iv = encrypted.iv;
        } catch (err) {
          console.error('[Encryption Error]', err);
        }
      }

      const tempId = `temp_${Date.now()}`;
      const tempMsg = {
        id: tempId,
        tempId,
        senderId: user.id,
        senderUsername: user.username,
        to: selectedTarget.id,
        msgType,
        ciphertext,
        iv,
        fileMeta,
        replyTo,
        decryptedText: text,
        status: 'sent',
        reactions: {},
        timestamp: new Date().toISOString(),
      };

      setMessagesByTarget((prev) => ({
        ...prev,
        [selectedTarget.id]: [...(prev[selectedTarget.id] || []), tempMsg],
      }));

      socketRef.current.emit('message:send', {
        to: selectedTarget.id,
        tempId,
        msgType,
        ciphertext,
        iv,
        fileMeta,
        senderPublicKey: exportedPk,
        receiverPublicKey: recipient?.publicKey || null,
        replyTo,
      });
    } else if (selectedTarget.type === 'group') {
      socketRef.current.emit('group:message:send', {
        groupId: selectedTarget.id,
        msgType,
        ciphertext: text,
        iv: 'group_plain',
        fileMeta,
        senderPublicKey: exportedPk,
        replyTo,
      });
    }
  };

  // React to message
  const reactToMessage = (messageId, emoji) => {
    if (!socketRef.current || !selectedTarget) return;
    if (selectedTarget.type === 'user') {
      socketRef.current.emit('message:react', {
        messageId,
        targetUserId: selectedTarget.id,
        emoji,
      });
    }
  };

  // Typing triggers
  const startTyping = () => {
    if (socketRef.current && selectedTarget?.type === 'user') {
      socketRef.current.emit('typing:start', { to: selectedTarget.id });
    }
  };

  const stopTyping = () => {
    if (socketRef.current && selectedTarget?.type === 'user') {
      socketRef.current.emit('typing:stop', { to: selectedTarget.id });
    }
  };

  // Create Group REST API call
  const createGroupApi = async ({ name, description, memberIds }) => {
    const res = await fetch('/api/groups', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name, description, memberIds }),
    });

    const data = await res.json();
    if (data.success) {
      setGroups((prev) => [...prev, data.group]);
      if (socketRef.current) {
        socketRef.current.emit('group:created', { group: data.group });
      }
      return data.group;
    } else {
      throw new Error(data.error || 'Failed to create group');
    }
  };

  // Update Profile REST API call
  const updateProfileApi = async ({ bio, avatarColor }) => {
    const res = await fetch('/api/users/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ bio, avatarColor }),
    });

    const data = await res.json();
    if (data.success) {
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, bio: data.user.bio } : u))
      );
      return data.user;
    } else {
      throw new Error(data.error || 'Failed to update profile');
    }
  };

  const recentChatUserIds = Array.from(
    new Set([
      ...persistentConversationUserIds,
      ...Object.keys(messagesByTarget).filter(
        (targetId) => Array.isArray(messagesByTarget[targetId]) && messagesByTarget[targetId].length > 0
      ),
    ])
  );

  return {
    users,
    groups,
    selectedTarget,
    setSelectedTarget,
    recentChatUserIds,
    unreadCounts,
    messages: selectedTarget ? messagesByTarget[selectedTarget.id] || [] : [],
    isTyping: selectedTarget ? !!typingState[selectedTarget.id] : false,
    typingUsername: selectedTarget ? typingState[selectedTarget.id] || '' : '',
    isSocketConnected,
    sendMessage,
    reactToMessage,
    startTyping,
    stopTyping,
    createGroupApi,
    updateProfileApi,
  };
}
