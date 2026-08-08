import {
  getAllUsers,
  findUserById,
  updateUserProfile,
  searchUsersInDb,
  getUserRecentConversations,
  deleteUserPermanent,
} from '../database.js';

function toSafeUser(user) {
  return {
    id: user.id,
    tag_id: user.tag_id,
    username: user.username,
    bio: user.bio,
    avatar_color: user.avatar_color,
    status: user.status,
    last_seen: user.last_seen,
  };
}

export async function fetchUsersList() {
  const users = await getAllUsers();
  return users.map(toSafeUser);
}

export async function fetchConversationsList(userId) {
  const conversationUsers = await getUserRecentConversations(userId);
  return conversationUsers.map(toSafeUser);
}

export async function searchUsersList(query) {
  const results = await searchUsersInDb(query);
  return results.map(toSafeUser);
}

export async function getUserProfile(userId) {
  const user = await findUserById(userId);
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }
  return user;
}

export async function updateProfile(userId, { bio, avatarColor }) {
  const updated = await updateUserProfile(userId, { bio, avatarColor });
  return updated;
}

export async function deleteAccount(userId) {
  await deleteUserPermanent(userId);
  return true;
}
