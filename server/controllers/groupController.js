import {
  createNewGroup,
  fetchUserGroupsList,
  fetchGroupDetailsById,
} from '../services/groupService.js';

export async function handleCreateGroup(req, res, next) {
  try {
    const { name, description, memberIds } = req.body;
    const group = await createNewGroup({
      name,
      description,
      createdBy: req.user.id,
      memberIds,
    });
    res.status(201).json({ success: true, group });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ success: false, error: err.message });
    }
    next(err);
  }
}

export async function handleGetMyGroups(req, res, next) {
  try {
    const groups = await fetchUserGroupsList(req.user.id);
    res.json({ success: true, groups });
  } catch (err) {
    next(err);
  }
}

export async function handleGetGroupDetails(req, res, next) {
  try {
    const group = await fetchGroupDetailsById(req.params.groupId);
    res.json({ success: true, group });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ success: false, error: err.message });
    }
    next(err);
  }
}
