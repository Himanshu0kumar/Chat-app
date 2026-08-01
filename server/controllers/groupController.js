import { createGroup, getUserGroups, getGroupById } from '../database.js';

export async function handleCreateGroup(req, res, next) {
  try {
    const { name, description, memberIds } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Group name is required' });
    }

    const group = await createGroup({
      name: name.trim(),
      description: description ? description.trim() : '',
      createdBy: req.user.id,
      memberIds: Array.isArray(memberIds) ? memberIds : [],
    });

    res.status(201).json({ success: true, group });
  } catch (err) {
    next(err);
  }
}

export async function handleGetMyGroups(req, res, next) {
  try {
    const groups = await getUserGroups(req.user.id);
    res.json({ success: true, groups });
  } catch (err) {
    next(err);
  }
}

export async function handleGetGroupDetails(req, res, next) {
  try {
    const group = await getGroupById(req.params.groupId);
    if (!group) {
      return res.status(404).json({ success: false, error: 'Group not found' });
    }
    res.json({ success: true, group });
  } catch (err) {
    next(err);
  }
}
