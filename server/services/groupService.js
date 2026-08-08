import { createGroup, getUserGroups, getGroupById } from '../database.js';

export async function createNewGroup({ name, description, createdBy, memberIds }) {
  if (!name || !name.trim()) {
    const err = new Error('Group name is required');
    err.statusCode = 400;
    throw err;
  }

  const group = await createGroup({
    name: name.trim(),
    description: description ? description.trim() : '',
    createdBy,
    memberIds: Array.isArray(memberIds) ? memberIds : [],
  });

  return group;
}

export async function fetchUserGroupsList(userId) {
  const groups = await getUserGroups(userId);
  return groups;
}

export async function fetchGroupDetailsById(groupId) {
  const group = await getGroupById(groupId);
  if (!group) {
    const err = new Error('Group not found');
    err.statusCode = 404;
    throw err;
  }
  return group;
}
