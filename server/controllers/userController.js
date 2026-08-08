import {
  fetchUsersList,
  fetchConversationsList,
  searchUsersList,
  getUserProfile,
  updateProfile as updateProfileService,
  deleteAccount as deleteAccountService,
} from '../services/userService.js';

export async function getUsers(req, res, next) {
  try {
    const safeUsers = await fetchUsersList();
    res.json({ success: true, users: safeUsers });
  } catch (err) {
    next(err);
  }
}

export async function getConversations(req, res, next) {
  try {
    const safeUsers = await fetchConversationsList(req.user.id);
    res.json({ success: true, conversations: safeUsers });
  } catch (err) {
    next(err);
  }
}

export async function searchUsers(req, res, next) {
  try {
    const { q } = req.query;
    const safeResults = await searchUsersList(q);
    res.json({ success: true, users: safeResults });
  } catch (err) {
    next(err);
  }
}

export async function getProfile(req, res, next) {
  try {
    const user = await getUserProfile(req.user.id);
    res.json({ success: true, user });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ success: false, error: err.message });
    }
    next(err);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const { bio, avatarColor } = req.body;
    const updated = await updateProfileService(req.user.id, { bio, avatarColor });
    res.json({ success: true, user: updated });
  } catch (err) {
    next(err);
  }
}

export async function deleteAccount(req, res, next) {
  try {
    await deleteAccountService(req.user.id);
    res.json({ success: true, message: 'Account permanently deleted successfully' });
  } catch (err) {
    next(err);
  }
}
