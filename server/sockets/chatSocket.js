import {
  saveMessage,
  getMessageHistory,
  updateMessageStatus,
  addMessageReaction,
  updateUserPresence,
  getAllUsers,
  getUserRecentConversations,
  updateUserPublicKey,
  getUserUnreadCounts,
} from '../database.js';

export function setupChatSocket(io, socket, activeUsersByUserId, socketToUserId) {
  const { id: userId, username } = socket.user;

  // 1. User joins session & announces presence
  socket.on('user:join', async ({ publicKey }) => {
    const userData = {
      id: userId,
      username,
      socketId: socket.id,
      publicKey,
      status: 'online',
      joinedAt: new Date().toISOString(),
    };

    activeUsersByUserId.set(userId, userData);
    socketToUserId.set(socket.id, userId);

    await updateUserPresence(userId, 'online');
    if (publicKey) {
      await updateUserPublicKey(userId, publicKey);
    }

    console.log(`[User Active] ${username} registered session public key & presence.`);

    broadcastPresence(io, activeUsersByUserId);

    try {
      const conversationUsers = await getUserRecentConversations(userId);
      socket.emit('conversations:response', { conversations: conversationUsers });
      const unreadCounts = await getUserUnreadCounts(userId);
      socket.emit('unread:counts', unreadCounts);
    } catch (err) {
      console.error('[Socket Error] Failed to fetch initial conversations:', err);
    }
  });

  socket.on('conversations:request', async () => {
    try {
      const conversationUsers = await getUserRecentConversations(userId);
      socket.emit('conversations:response', { conversations: conversationUsers });
      const unreadCounts = await getUserUnreadCounts(userId);
      socket.emit('unread:counts', unreadCounts);
    } catch (err) {
      console.error('[Socket Error] Failed to fetch conversations:', err);
    }
  });

  // 2. Fetch Direct Message History
  socket.on('history:request', async ({ targetUserId }) => {
    try {
      const history = await getMessageHistory(userId, targetUserId);
      socket.emit('history:response', { targetUserId, history });

      // Automatically mark incoming unread messages as read
      const unreadIds = history
        .filter(m => m.receiverId === userId && m.status !== 'read')
        .map(m => m.id);

      if (unreadIds.length > 0) {
        await updateMessageStatus(unreadIds, 'read');
        const targetUser = activeUsersByUserId.get(targetUserId);
        if (targetUser?.socketId) {
          io.to(targetUser.socketId).emit('message:read_ack', {
            messageIds: unreadIds,
            readBy: userId,
          });
        }
      }

      const currentUnread = await getUserUnreadCounts(userId);
      socket.emit('unread:counts', currentUnread);
    } catch (err) {
      console.error('[Database Error] Failed to fetch message history:', err);
      socket.emit('history:response', { targetUserId, history: [] });
    }
  });

  // 3. Send Encrypted Message (Direct)
  socket.on('message:send', async ({ to: targetUserId, tempId, msgType = 'text', ciphertext, iv, fileMeta, senderPublicKey, receiverPublicKey, replyTo }) => {
    const recipient = activeUsersByUserId.get(targetUserId);
    const initialStatus = recipient?.socketId ? 'delivered' : 'sent';

    const effectiveReceiverPk = receiverPublicKey || recipient?.publicKey;

    let msgId;
    try {
      msgId = await saveMessage({
        senderId: userId,
        receiverId: targetUserId,
        msgType,
        ciphertext,
        iv,
        fileMeta,
        senderPublicKey,
        receiverPublicKey: effectiveReceiverPk,
        replyTo,
        status: initialStatus,
      });
    } catch (err) {
      console.error('[Database Error] Failed to save message:', err);
      return;
    }

    const payload = {
      id: msgId,
      tempId,
      from: userId,
      senderUsername: username,
      to: targetUserId,
      msgType,
      ciphertext,
      iv,
      fileMeta,
      senderPublicKey,
      receiverPublicKey: effectiveReceiverPk,
      replyTo,
      status: initialStatus,
      reactions: {},
      timestamp: new Date().toISOString(),
    };

    // Acknowledge back to sender with created msgId & initial status
    socket.emit('message:ack', payload);

    // Relay to recipient if online
    if (recipient?.socketId) {
      io.to(recipient.socketId).emit('message:receive', payload);
      const recipientUnread = await getUserUnreadCounts(targetUserId);
      io.to(recipient.socketId).emit('unread:counts', recipientUnread);
    }
  });

  // 4. Read Receipt Acknowledgment
  socket.on('message:read', async ({ messageIds, targetUserId }) => {
    if (!messageIds || messageIds.length === 0) return;
    await updateMessageStatus(messageIds, 'read');

    const targetUser = activeUsersByUserId.get(targetUserId);
    if (targetUser?.socketId) {
      io.to(targetUser.socketId).emit('message:read_ack', {
        messageIds,
        readBy: userId,
      });
    }

    const currentUnread = await getUserUnreadCounts(userId);
    socket.emit('unread:counts', currentUnread);
  });

  // 5. Message Reactions
  socket.on('message:react', async ({ messageId, targetUserId, emoji }) => {
    try {
      const updatedReactions = await addMessageReaction(messageId, userId, emoji);
      if (updatedReactions) {
        const payload = { messageId, reactions: updatedReactions, reactedBy: userId };
        socket.emit('message:reaction_update', payload);

        const targetUser = activeUsersByUserId.get(targetUserId);
        if (targetUser?.socketId) {
          io.to(targetUser.socketId).emit('message:reaction_update', payload);
        }
      }
    } catch (err) {
      console.error('[Reaction Error] Failed to react to message:', err);
    }
  });

  // 6. Typing Indicators
  socket.on('typing:start', ({ to: targetUserId }) => {
    const recipient = activeUsersByUserId.get(targetUserId);
    if (recipient?.socketId) {
      io.to(recipient.socketId).emit('typing:start', { from: userId, username });
    }
  });

  socket.on('typing:stop', ({ to: targetUserId }) => {
    const recipient = activeUsersByUserId.get(targetUserId);
    if (recipient?.socketId) {
      io.to(recipient.socketId).emit('typing:stop', { from: userId });
    }
  });

  // 7. Disconnect Handler
  socket.on('disconnect', async () => {
    console.log(`[User Disconnected] ${username} (${socket.id})`);
    activeUsersByUserId.delete(userId);
    socketToUserId.delete(socket.id);

    await updateUserPresence(userId, 'offline');
    broadcastPresence(io, activeUsersByUserId);
  });
}

export async function broadcastPresence(io, activeUsersByUserId) {
  try {
    const allUsers = await getAllUsers();
    const presenceList = allUsers.map(u => ({
      id: u.id,
      tag_id: u.tag_id || `@${u.username}#${u.id.slice(-4)}`,
      username: u.username,
      bio: u.bio,
      avatar_color: u.avatar_color,
      status: activeUsersByUserId.has(u.id) ? 'online' : 'offline',
      last_seen: u.last_seen,
      publicKey: activeUsersByUserId.get(u.id)?.publicKey || null,
    }));

    io.emit('users:list', presenceList);
  } catch (err) {
    console.error('[Presence Error] Failed to broadcast presence:', err);
  }
}
