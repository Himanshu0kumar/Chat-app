import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks.js';
import {
  checkAuthStatus,
  loginUser,
  signupUser,
  deleteAccountUser,
  logout as logoutAction,
  updateUser as updateUserAction,
  setAuthError as setAuthErrorAction,
  selectAuth,
} from '../store/slices/authSlice.js';

export function useAuth() {
  const dispatch = useAppDispatch();
  const { user, token, isAuthenticated, isLoading, authError } = useAppSelector(selectAuth);

  useEffect(() => {
    dispatch(checkAuthStatus());
  }, [dispatch]);

  const login = async (username, password) => {
    const result = await dispatch(loginUser({ username, password })).unwrap();
    return result.user;
  };

  const signup = async (username, password) => {
    const result = await dispatch(signupUser({ username, password })).unwrap();
    return result.user;
  };

  const logout = () => {
    dispatch(logoutAction());
  };

  const updateUser = (updatedData) => {
    dispatch(updateUserAction(updatedData));
  };

  const deleteAccount = async () => {
    await dispatch(deleteAccountUser());
  };

  const setAuthError = (err) => {
    dispatch(setAuthErrorAction(err));
  };

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    authError,
    login,
    signup,
    logout,
    updateUser,
    deleteAccount,
    setAuthError,
  };
}
