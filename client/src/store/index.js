import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice.js';
import themeReducer from './slices/themeSlice.js';
import chatReducer from './slices/chatSlice.js';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    theme: themeReducer,
    chat: chatReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Allows flexible socket / crypto key metadata if needed
    }),
});
