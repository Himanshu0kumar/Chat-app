import { createSlice } from '@reduxjs/toolkit';

const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    users: [],
    groups: [],
    selectedTarget: null,
    messagesByTarget: {},
    unreadCounts: {},
    typingState: {},
    isSocketConnected: false,
  },
  reducers: {
    setUsers: (state, action) => {
      state.users = action.payload;
    },
    setGroups: (state, action) => {
      state.groups = action.payload;
    },
    setSelectedTarget: (state, action) => {
      state.selectedTarget = action.payload;
      if (action.payload?.id) {
        state.unreadCounts[action.payload.id] = 0;
      }
    },
    setMessagesForTarget: (state, action) => {
      const { targetId, messages } = action.payload;
      state.messagesByTarget[targetId] = messages;
    },
    addMessageToTarget: (state, action) => {
      const { targetId, message } = action.payload;
      if (!state.messagesByTarget[targetId]) {
        state.messagesByTarget[targetId] = [];
      }
      // Check if message already exists
      const exists = state.messagesByTarget[targetId].some((m) => m.id === message.id);
      if (!exists) {
        state.messagesByTarget[targetId].push(message);
      }
      // Update unread count if not currently selected target
      if (state.selectedTarget?.id !== targetId) {
        state.unreadCounts[targetId] = (state.unreadCounts[targetId] || 0) + 1;
      }
    },
    setUnreadCount: (state, action) => {
      const { targetId, count } = action.payload;
      state.unreadCounts[targetId] = count;
    },
    setTypingState: (state, action) => {
      const { targetId, isTyping, username } = action.payload;
      state.typingState[targetId] = { isTyping, username };
    },
    setSocketConnected: (state, action) => {
      state.isSocketConnected = action.payload;
    },
    resetChatState: (state) => {
      state.users = [];
      state.groups = [];
      state.selectedTarget = null;
      state.messagesByTarget = {};
      state.unreadCounts = {};
      state.typingState = {};
      state.isSocketConnected = false;
    },
  },
});

export const {
  setUsers,
  setGroups,
  setSelectedTarget,
  setMessagesForTarget,
  addMessageToTarget,
  setUnreadCount,
  setTypingState,
  setSocketConnected,
  resetChatState,
} = chatSlice.actions;

export const selectChat = (state) => state.chat;
export const selectUsers = (state) => state.chat.users;
export const selectGroups = (state) => state.chat.groups;
export const selectSelectedTarget = (state) => state.chat.selectedTarget;
export const selectMessagesByTarget = (state) => state.chat.messagesByTarget;
export const selectUnreadCounts = (state) => state.chat.unreadCounts;
export const selectTypingState = (state) => state.chat.typingState;
export const selectIsSocketConnected = (state) => state.chat.isSocketConnected;

export default chatSlice.reducer;
