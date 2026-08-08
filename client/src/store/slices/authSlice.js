import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Async thunk to verify stored JWT token on startup
export const checkAuthStatus = createAsyncThunk(
  'auth/checkAuthStatus',
  async (_, { getState, rejectWithValue }) => {
    const token = getState().auth.token || localStorage.getItem('cipherchat-token');
    if (!token) return null;

    try {
      const res = await fetch('/api/v1/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        localStorage.removeItem('cipherchat-token');
        return rejectWithValue('Token expired or invalid');
      }

      const data = await res.json();
      return { user: data.user, token };
    } catch (err) {
      return rejectWithValue(err.message || 'Authentication failed');
    }
  }
);

// Async thunk for Login
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ username, password }, { rejectWithValue }) => {
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        return rejectWithValue(data.error || 'Login failed');
      }

      localStorage.setItem('cipherchat-token', data.token);
      return data; // { user, token }
    } catch (err) {
      return rejectWithValue(err.message || 'Login request failed');
    }
  }
);

// Async thunk for Signup
export const signupUser = createAsyncThunk(
  'auth/signupUser',
  async ({ username, password }, { rejectWithValue }) => {
    try {
      const res = await fetch('/api/v1/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        return rejectWithValue(data.error || 'Signup failed');
      }

      localStorage.setItem('cipherchat-token', data.token);
      return data; // { user, token }
    } catch (err) {
      return rejectWithValue(err.message || 'Signup request failed');
    }
  }
);

// Async thunk to delete account
export const deleteAccountUser = createAsyncThunk(
  'auth/deleteAccountUser',
  async (_, { getState, dispatch, rejectWithValue }) => {
    const token = getState().auth.token;
    try {
      if (token) {
        await fetch('/api/v1/users/account', {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      dispatch(logout());
      return true;
    } catch (err) {
      dispatch(logout());
      return rejectWithValue(err.message || 'Delete account failed');
    }
  }
);

const initialToken = localStorage.getItem('cipherchat-token');

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: initialToken,
    isAuthenticated: false,
    isLoading: true,
    authError: '',
  },
  reducers: {
    logout: (state) => {
      localStorage.removeItem('cipherchat-token');
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.authError = '';
    },
    updateUser: (state, action) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    setAuthError: (state, action) => {
      state.authError = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // checkAuthStatus
      .addCase(checkAuthStatus.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(checkAuthStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload) {
          state.user = action.payload.user;
          state.token = action.payload.token;
          state.isAuthenticated = true;
        } else {
          state.user = null;
          state.token = null;
          state.isAuthenticated = false;
        }
      })
      .addCase(checkAuthStatus.rejected, (state) => {
        state.isLoading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      })
      // loginUser
      .addCase(loginUser.pending, (state) => {
        state.authError = '';
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.authError = '';
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.authError = action.payload || 'Login failed';
      })
      // signupUser
      .addCase(signupUser.pending, (state) => {
        state.authError = '';
      })
      .addCase(signupUser.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.authError = '';
      })
      .addCase(signupUser.rejected, (state, action) => {
        state.authError = action.payload || 'Signup failed';
      });
  },
});

export const { logout, updateUser, setAuthError } = authSlice.actions;

export const selectAuth = (state) => state.auth;
export const selectUser = (state) => state.auth.user;
export const selectToken = (state) => state.auth.token;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectIsLoading = (state) => state.auth.isLoading;
export const selectAuthError = (state) => state.auth.authError;

export default authSlice.reducer;
