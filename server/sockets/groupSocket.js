import { saveMessage, getGroupMessageHistory, getGroupById } from '../database.js';

export function setupGroupSocket(io, socket, activeUsersByUserId) {
  const { id: userId, username } = socket.user;

  // 1. Fetch Group History
  socket.on('group:history', async ({ groupId }) => {
    try {
      const history = await getGroupMessageHistory(groupId);
      socket.emit('group:history_response', { groupId, history });
    } catch (err) {
      console.error('[Group Error] Failed to fetch group message history:', err);
      socket.emit('group:history_response', { groupId, history: [] });
    }
  });

  // 2. Send Group Message
  socket.on('group:message:send', async ({ groupId, msgType = 'text', ciphertext, iv, fileMeta, senderPublicKey, replyTo }) => {
    try {
      const group = await getGroupById(groupId);
      if (!group || !group.members.includes(userId)) {
        return socket.emit('error', { message: 'You are not a member of this group' });
      }

      const msgId = await saveMessage({
        senderId: userId,
        groupId,
        msgType,
        ciphertext,
        iv,
        fileMeta,
        senderPublicKey,
        replyTo,
        status: 'sent',
      });

      const payload = {
        id: msgId,
        senderId: userId,
        senderUsername: username,
        groupId,
        msgType,
        ciphertext,
        iv,
        fileMeta,
        senderPublicKey,
        replyTo,
        status: 'sent',
        reactions: {},
        timestamp: new Date().toISOString(),
      };

      // Broadcast to all active members of the group
      group.members.forEach(memberId => {
        const activeMember = activeUsersByUserId.get(memberId);
        if (activeMember?.socketId) {
          io.to(activeMember.socketId).emit('group:message:receive', payload);
        }
      });
    } catch (err) {
      console.error('[Group Message Error]', err);
    }
  });

  // 3. Notify Group Created
  socket.on('group:created', async ({ group }) => {
    if (!group || !group.members) return;
    group.members.forEach(memberId => {
      const activeMember = activeUsersByUserId.get(memberId);
      if (activeMember?.socketId) {
        io.to(activeMember.socketId).emit('group:new', group);
      }
    });
  });
}
