import { getAllUsers, findUserById, updateUserProfile, searchUsersInDb, getUserRecentConversations } from '../database.js';

export async function getUsers(req, res, next) {
  try {
    const users = await getAllUsers();
    const safeUsers = users.map(u => ({
      id: u.id,
      tag_id: u.tag_id,
      username: u.username,
      bio: u.bio,
      avatar_color: u.avatar_color,
      status: u.status,
      last_seen: u.last_seen,
    }));
    res.json({ success: true, users: safeUsers });
  } catch (err) {
    next(err);
  }
}

export async function getConversations(req, res, next) {
  try {
    const conversationUsers = await getUserRecentConversations(req.user.id);
    const safeUsers = conversationUsers.map(u => ({
      id: u.id,
      tag_id: u.tag_id,
      username: u.username,
      bio: u.bio,
      avatar_color: u.avatar_color,
      status: u.status,
      last_seen: u.last_seen,
    }));
    res.json({ success: true, conversations: safeUsers });
  } catch (err) {
    next(err);
  }
}

export async function searchUsers(req, res, next) {
  try {
    const { q } = req.query;
    const results = await searchUsersInDb(q);
    const safeResults = results.map(u => ({
      id: u.id,
      tag_id: u.tag_id,
      username: u.username,
      bio: u.bio,
      avatar_color: u.avatar_color,
      status: u.status,
      last_seen: u.last_seen,
    }));
    res.json({ success: true, users: safeResults });
  } catch (err) {
    next(err);
  }
}

export async function getProfile(req, res, next) {
  try {
    const user = await findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const { bio, avatarColor } = req.body;
    const updated = await updateUserProfile(req.user.id, { bio, avatarColor });
    res.json({ success: true, user: updated });
  } catch (err) {
    next(err);
  }
}
