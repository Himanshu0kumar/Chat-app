import pg from 'pg';
import crypto from 'crypto';
import fs from 'fs';
import { config } from './config/index.js';

const { Pool } = pg;
export let pool = null;
export let isPostgresConnected = false;

const fileDb = {
  users: new Map(),    // username.toLowerCase() -> { id, username, password_hash, bio, avatar_color, status, last_seen, created_at }
  messages: [],        // Array<{ id, sender_id, receiver_id, group_id, msg_type, ciphertext, iv, file_meta, sender_public_key, reply_to, status, reactions, created_at }>
  groups: new Map(),   // groupId -> { id, name, description, created_by, members: string[], created_at }
};

// Ensure data directory and JSON files exist
function initFileStore() {
  try {
    if (!fs.existsSync(config.dataDir)) {
      fs.mkdirSync(config.dataDir, { recursive: true });
    }

    if (fs.existsSync(config.usersFile)) {
      const rawUsers = fs.readFileSync(config.usersFile, 'utf-8');
      const userList = JSON.parse(rawUsers || '[]');
      let updated = false;
      userList.forEach(u => {
        if (!u.tag_id) {
          const shortHash = u.id ? u.id.slice(-4) : Math.floor(1000 + Math.random() * 9000);
          u.tag_id = `@${u.username}#${shortHash}`;
          updated = true;
        }
        fileDb.users.set(u.username.toLowerCase(), u);
      });
      if (updated) persistUsersToFile();
      console.log(`[File Store] Loaded ${userList.length} user(s) with Unique IDs from ${config.usersFile}`);
    } else {
      fs.writeFileSync(config.usersFile, JSON.stringify([]), 'utf-8');
    }

    if (fs.existsSync(config.messagesFile)) {
      const rawMsgs = fs.readFileSync(config.messagesFile, 'utf-8');
      fileDb.messages = JSON.parse(rawMsgs || '[]');
      console.log(`[File Store] Loaded ${fileDb.messages.length} message(s) from ${config.messagesFile}`);
    } else {
      fs.writeFileSync(config.messagesFile, JSON.stringify([]), 'utf-8');
    }

    if (fs.existsSync(config.groupsFile)) {
      const rawGroups = fs.readFileSync(config.groupsFile, 'utf-8');
      const groupList = JSON.parse(rawGroups || '[]');
      groupList.forEach(g => fileDb.groups.set(g.id, g));
      console.log(`[File Store] Loaded ${groupList.length} group(s) from ${config.groupsFile}`);
    } else {
      fs.writeFileSync(config.groupsFile, JSON.stringify([]), 'utf-8');
    }
  } catch (err) {
    console.error('[File Store Error] Failed to initialize file storage:', err);
  }
}

function persistUsersToFile() {
  try {
    const userArray = Array.from(fileDb.users.values());
    fs.writeFileSync(config.usersFile, JSON.stringify(userArray, null, 2), 'utf-8');
  } catch (err) {
    console.error('[File Store Error] Failed to save users file:', err);
  }
}

function persistMessagesToFile() {
  try {
    fs.writeFileSync(config.messagesFile, JSON.stringify(fileDb.messages, null, 2), 'utf-8');
  } catch (err) {
    console.error('[File Store Error] Failed to save messages file:', err);
  }
}

function persistGroupsToFile() {
  try {
    const groupArray = Array.from(fileDb.groups.values());
    fs.writeFileSync(config.groupsFile, JSON.stringify(groupArray, null, 2), 'utf-8');
  } catch (err) {
    console.error('[File Store Error] Failed to save groups file:', err);
  }
}

export async function initDatabase() {
  initFileStore();

  try {
    pool = new Pool({
      connectionString: config.databaseUrl,
      connectionTimeoutMillis: 3000,
    });

    const client = await pool.connect();
    client.release();
    isPostgresConnected = true;
    console.log(`[Database] Connected to PostgreSQL at ${config.databaseUrl.replace(/:[^:@]+@/, ':****@')}`);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        bio TEXT DEFAULT 'Hey there! I am using CipherChat.',
        avatar_color VARCHAR(20) DEFAULT '#10b981',
        status VARCHAR(20) DEFAULT 'offline',
        last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS groups (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT DEFAULT '',
        created_by VARCHAR(64) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS group_members (
        group_id VARCHAR(64) REFERENCES groups(id) ON DELETE CASCADE,
        user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (group_id, user_id)
      );

      CREATE TABLE IF NOT EXISTS messages (
        id VARCHAR(64) PRIMARY KEY,
        sender_id VARCHAR(64) NOT NULL,
        receiver_id VARCHAR(64),
        group_id VARCHAR(64),
        msg_type VARCHAR(20) DEFAULT 'text',
        ciphertext TEXT NOT NULL,
        iv TEXT NOT NULL,
        file_meta TEXT,
        sender_public_key TEXT,
        reply_to TEXT,
        status VARCHAR(20) DEFAULT 'sent',
        reactions TEXT DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('[Database] PostgreSQL schema initialized.');
  } catch (err) {
    isPostgresConnected = false;
    console.log(`[Database Note] PostgreSQL offline (${err.message}). Using File Store for persistence.`);
  }
}

// User Operations
export async function createUser(username, passwordHash) {
  const id = `user_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const tagId = `@${username}#${id.slice(-4)}`;
  const createdAt = new Date().toISOString();
  const avatarColors = ['#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#06b6d4'];
  const avatarColor = avatarColors[Math.floor(Math.random() * avatarColors.length)];
  const bio = 'Hey there! I am using CipherChat.';

  if (isPostgresConnected) {
    const res = await pool.query(
      `INSERT INTO users (id, username, password_hash, bio, avatar_color)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, username, bio, avatar_color, created_at`,
      [id, username, passwordHash, bio, avatarColor]
    );
    return { ...res.rows[0], tag_id: tagId };
  } else {
    const newUser = {
      id,
      tag_id: tagId,
      username,
      password_hash: passwordHash,
      bio,
      avatar_color: avatarColor,
      status: 'online',
      last_seen: createdAt,
      created_at: createdAt,
    };
    fileDb.users.set(username.toLowerCase(), newUser);
    persistUsersToFile();
    return { id, tag_id: tagId, username, bio, avatar_color: avatarColor, created_at: createdAt };
  }
}

export async function findUserByUsername(username) {
  if (isPostgresConnected) {
    const res = await pool.query('SELECT * FROM users WHERE LOWER(username) = LOWER($1)', [username]);
    if (res.rows[0]) {
      res.rows[0].tag_id = res.rows[0].tag_id || `@${res.rows[0].username}#${res.rows[0].id.slice(-4)}`;
    }
    return res.rows[0] || null;
  } else {
    const u = fileDb.users.get(username.toLowerCase()) || null;
    if (u && !u.tag_id) {
      u.tag_id = `@${u.username}#${u.id.slice(-4)}`;
    }
    return u;
  }
}

export async function findUserById(id) {
  if (isPostgresConnected) {
    const res = await pool.query('SELECT id, username, bio, avatar_color, status, last_seen, created_at FROM users WHERE id = $1', [id]);
    if (res.rows[0]) {
      res.rows[0].tag_id = `@${res.rows[0].username}#${res.rows[0].id.slice(-4)}`;
    }
    return res.rows[0] || null;
  } else {
    for (const u of fileDb.users.values()) {
      if (u.id === id) {
        return {
          id: u.id,
          tag_id: u.tag_id || `@${u.username}#${u.id.slice(-4)}`,
          username: u.username,
          bio: u.bio || 'Hey there! I am using CipherChat.',
          avatar_color: u.avatar_color || '#10b981',
          status: u.status || 'offline',
          last_seen: u.last_seen || u.created_at,
          created_at: u.created_at,
        };
      }
    }
    return null;
  }
}

export async function updateUserProfile(userId, { bio, avatarColor }) {
  if (isPostgresConnected) {
    const res = await pool.query(
      `UPDATE users SET bio = COALESCE($1, bio), avatar_color = COALESCE($2, avatar_color)
       WHERE id = $3 RETURNING id, username, bio, avatar_color`,
      [bio, avatarColor, userId]
    );
    return res.rows[0];
  } else {
    for (const [key, user] of fileDb.users.entries()) {
      if (user.id === userId) {
        if (bio !== undefined) user.bio = bio;
        if (avatarColor !== undefined) user.avatar_color = avatarColor;
        fileDb.users.set(key, user);
        persistUsersToFile();
        return { id: user.id, tag_id: user.tag_id || `@${user.username}#${user.id.slice(-4)}`, username: user.username, bio: user.bio, avatar_color: user.avatar_color };
      }
    }
    return null;
  }
}

export async function updateUserPresence(userId, status) {
  const lastSeen = new Date().toISOString();
  if (isPostgresConnected) {
    await pool.query('UPDATE users SET status = $1, last_seen = $2 WHERE id = $3', [status, lastSeen, userId]);
  } else {
    for (const [key, user] of fileDb.users.entries()) {
      if (user.id === userId) {
        user.status = status;
        user.last_seen = lastSeen;
        fileDb.users.set(key, user);
        persistUsersToFile();
        break;
      }
    }
  }
  return { userId, status, lastSeen };
}

export async function updateUserPublicKey(userId, publicKey) {
  if (!publicKey) return;
  const pkStr = typeof publicKey === 'string' ? publicKey : JSON.stringify(publicKey);
  if (isPostgresConnected) {
    await pool.query('UPDATE users SET public_key = $1 WHERE id = $2', [pkStr, userId]);
  } else {
    for (const [key, user] of fileDb.users.entries()) {
      if (user.id === userId) {
        user.public_key = pkStr;
        fileDb.users.set(key, user);
        persistUsersToFile();
        break;
      }
    }
  }
}

export async function getAllUsers() {
  if (isPostgresConnected) {
    const res = await pool.query('SELECT id, username, bio, avatar_color, status, last_seen, created_at, public_key FROM users');
    return res.rows.map(u => ({
      ...u,
      tag_id: `@${u.username}#${u.id.slice(-4)}`,
      publicKey: u.public_key ? (typeof u.public_key === 'string' ? JSON.parse(u.public_key) : u.public_key) : null,
    }));
  } else {
    return Array.from(fileDb.users.values()).map(u => ({
      id: u.id,
      tag_id: u.tag_id || `@${u.username}#${u.id.slice(-4)}`,
      username: u.username,
      bio: u.bio || 'Hey there! I am using CipherChat.',
      avatar_color: u.avatar_color || '#10b981',
      status: u.status || 'offline',
      last_seen: u.last_seen || u.created_at,
      created_at: u.created_at,
      publicKey: u.public_key ? (typeof u.public_key === 'string' ? JSON.parse(u.public_key) : u.public_key) : null,
    }));
  }
}

export async function searchUsersInDb(query) {
  const rawQ = (query || '').toLowerCase().trim();
  if (!rawQ) return [];

  const cleanQ = rawQ.replace(/^@/, '');
  const all = await getAllUsers();

  return all.filter(u => {
    const uname = (u.username || '').toLowerCase();
    const tagId = (u.tag_id || `@${u.username}#${(u.id || '').slice(-4)}`).toLowerCase();
    const cleanTag = tagId.replace(/^@/, '');
    const id = (u.id || '').toLowerCase();

    return (
      uname.includes(rawQ) ||
      uname.includes(cleanQ) ||
      tagId.includes(rawQ) ||
      cleanTag.includes(cleanQ) ||
      id.includes(rawQ) ||
      id.includes(cleanQ)
    );
  });
}

// Group Operations
export async function createGroup({ name, description, createdBy, memberIds }) {
  const groupId = `group_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const createdAt = new Date().toISOString();
  const allMembers = Array.from(new Set([createdBy, ...memberIds]));

  if (isPostgresConnected) {
    await pool.query(
      `INSERT INTO groups (id, name, description, created_by) VALUES ($1, $2, $3, $4)`,
      [groupId, name, description || '', createdBy]
    );

    for (const uid of allMembers) {
      await pool.query(
        `INSERT INTO group_members (group_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [groupId, uid]
      );
    }
  } else {
    const newGroup = {
      id: groupId,
      name,
      description: description || '',
      created_by: createdBy,
      members: allMembers,
      created_at: createdAt,
    };
    fileDb.groups.set(groupId, newGroup);
    persistGroupsToFile();
  }

  return { id: groupId, name, description, created_by: createdBy, members: allMembers, created_at: createdAt };
}

export async function getUserGroups(userId) {
  if (isPostgresConnected) {
    const res = await pool.query(
      `SELECT g.id, g.name, g.description, g.created_by, g.created_at,
              ARRAY_AGG(gm.user_id) as members
       FROM groups g
       JOIN group_members gm ON g.id = gm.group_id
       WHERE g.id IN (SELECT group_id FROM group_members WHERE user_id = $1)
       GROUP BY g.id`,
      [userId]
    );
    return res.rows;
  } else {
    return Array.from(fileDb.groups.values()).filter(g => g.members.includes(userId));
  }
}

export async function getGroupById(groupId) {
  if (isPostgresConnected) {
    const res = await pool.query(
      `SELECT g.id, g.name, g.description, g.created_by, g.created_at,
              ARRAY_AGG(gm.user_id) as members
       FROM groups g
       JOIN group_members gm ON g.id = gm.group_id
       WHERE g.id = $1
       GROUP BY g.id`,
      [groupId]
    );
    return res.rows[0] || null;
  } else {
    return fileDb.groups.get(groupId) || null;
  }
}

// Encrypted Message Queries
export async function saveMessage({
  id,
  senderId,
  receiverId,
  groupId,
  msgType,
  ciphertext,
  iv,
  fileMeta,
  senderPublicKey,
  receiverPublicKey,
  replyTo,
  status = 'sent',
}) {
  const msgId = id || `msg_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const fileMetaStr = fileMeta ? JSON.stringify(fileMeta) : null;
  const senderPkStr = senderPublicKey ? (typeof senderPublicKey === 'string' ? senderPublicKey : JSON.stringify(senderPublicKey)) : null;
  const replyToStr = replyTo ? JSON.stringify(replyTo) : null;
  const createdAt = new Date().toISOString();

  let receiverPkStr = receiverPublicKey ? (typeof receiverPublicKey === 'string' ? receiverPublicKey : JSON.stringify(receiverPublicKey)) : null;
  if (!receiverPkStr && receiverId) {
    const receiverUser = Array.from(fileDb.users.values()).find(u => u.id === receiverId);
    if (receiverUser?.public_key) {
      receiverPkStr = typeof receiverUser.public_key === 'string' ? receiverUser.public_key : JSON.stringify(receiverUser.public_key);
    }
  }

  // Update user public keys in user store if provided
  if (senderId && senderPkStr) {
    await updateUserPublicKey(senderId, senderPkStr);
  }
  if (receiverId && receiverPkStr) {
    await updateUserPublicKey(receiverId, receiverPkStr);
  }

  if (isPostgresConnected) {
    await pool.query(
      `INSERT INTO messages (id, sender_id, receiver_id, group_id, msg_type, ciphertext, iv, file_meta, sender_public_key, reply_to, status, reactions)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [msgId, senderId, receiverId || null, groupId || null, msgType || 'text', ciphertext, iv, fileMetaStr, senderPkStr, replyToStr, status, '{}']
    );
  } else {
    fileDb.messages.push({
      id: msgId,
      sender_id: senderId,
      receiver_id: receiverId || null,
      group_id: groupId || null,
      msg_type: msgType || 'text',
      ciphertext,
      iv,
      file_meta: fileMetaStr,
      sender_public_key: senderPkStr,
      receiver_public_key: receiverPkStr,
      reply_to: replyToStr,
      status,
      reactions: '{}',
      created_at: createdAt,
    });
    persistMessagesToFile();
  }

  return msgId;
}

export async function updateMessageStatus(messageIds, status) {
  if (!messageIds || messageIds.length === 0) return;

  if (isPostgresConnected) {
    await pool.query('UPDATE messages SET status = $1 WHERE id = ANY($2::text[])', [status, messageIds]);
  } else {
    let changed = false;
    fileDb.messages.forEach(m => {
      if (messageIds.includes(m.id)) {
        m.status = status;
        changed = true;
      }
    });
    if (changed) persistMessagesToFile();
  }
}

export async function addMessageReaction(messageId, userId, emoji) {
  if (isPostgresConnected) {
    const res = await pool.query('SELECT reactions FROM messages WHERE id = $1', [messageId]);
    if (res.rows.length === 0) return null;
    let reactions = JSON.parse(res.rows[0].reactions || '{}');
    if (!reactions[emoji]) reactions[emoji] = [];
    if (!reactions[emoji].includes(userId)) reactions[emoji].push(userId);

    const updatedStr = JSON.stringify(reactions);
    await pool.query('UPDATE messages SET reactions = $1 WHERE id = $2', [updatedStr, messageId]);
    return reactions;
  } else {
    const msg = fileDb.messages.find(m => m.id === messageId);
    if (!msg) return null;
    let reactions = JSON.parse(msg.reactions || '{}');
    if (!reactions[emoji]) reactions[emoji] = [];
    if (!reactions[emoji].includes(userId)) reactions[emoji].push(userId);

    msg.reactions = JSON.stringify(reactions);
    persistMessagesToFile();
    return reactions;
  }
}

export async function getMessageHistory(userA, userB) {
  const allUsersList = await getAllUsers();
  const userPkMap = new Map();
  allUsersList.forEach(u => {
    if (u.publicKey) userPkMap.set(u.id, u.publicKey);
  });

  let rawList;
  if (isPostgresConnected) {
    const res = await pool.query(
      `SELECT * FROM messages
       WHERE (sender_id = $1 AND receiver_id = $2)
          OR (sender_id = $2 AND receiver_id = $1)
       ORDER BY created_at ASC
       LIMIT 200`,
      [userA, userB]
    );
    rawList = res.rows.map(mapMessageRow);
  } else {
    rawList = fileDb.messages
      .filter(
        m =>
          (m.sender_id === userA && m.receiver_id === userB) ||
          (m.sender_id === userB && m.receiver_id === userA)
      )
      .map(mapMessageRow);
  }

  return rawList.map(m => ({
    ...m,
    senderPublicKey: m.senderPublicKey || userPkMap.get(m.senderId) || null,
    receiverPublicKey: m.receiverPublicKey || userPkMap.get(m.receiverId) || null,
  }));
}

export async function getGroupMessageHistory(groupId) {
  if (isPostgresConnected) {
    const res = await pool.query(
      `SELECT * FROM messages WHERE group_id = $1 ORDER BY created_at ASC LIMIT 200`,
      [groupId]
    );
    return res.rows.map(mapMessageRow);
  } else {
    return fileDb.messages
      .filter(m => m.group_id === groupId)
      .map(mapMessageRow);
  }
}

function safeParseJwk(val) {
  if (!val) return null;
  try {
    let parsed = typeof val === 'string' ? JSON.parse(val) : val;
    while (typeof parsed === 'string') {
      parsed = JSON.parse(parsed);
    }
    return parsed;
  } catch (e) {
    return null;
  }
}

function mapMessageRow(m) {
  return {
    id: m.id,
    senderId: m.sender_id,
    receiverId: m.receiver_id,
    groupId: m.group_id,
    msgType: m.msg_type,
    ciphertext: m.ciphertext,
    iv: m.iv,
    fileMeta: m.file_meta ? JSON.parse(m.file_meta) : null,
    senderPublicKey: safeParseJwk(m.sender_public_key),
    receiverPublicKey: safeParseJwk(m.receiver_public_key),
    replyTo: m.reply_to ? JSON.parse(m.reply_to) : null,
    status: m.status || 'sent',
    reactions: m.reactions ? JSON.parse(m.reactions) : {},
    timestamp: m.created_at,
  };
}

export async function getUserRecentConversations(userId) {
  if (isPostgresConnected) {
    const res = await pool.query(
      `SELECT DISTINCT
         CASE WHEN sender_id = $1 THEN receiver_id ELSE sender_id END as peer_id
       FROM messages
       WHERE (sender_id = $1 OR receiver_id = $1)
         AND receiver_id IS NOT NULL`,
      [userId]
    );
    const peerIds = res.rows.map(r => r.peer_id).filter(Boolean);
    const allUsers = await getAllUsers();
    return allUsers.filter(u => peerIds.includes(u.id));
  } else {
    const peerIds = new Set();
    fileDb.messages.forEach(m => {
      if (m.sender_id === userId && m.receiver_id) peerIds.add(m.receiver_id);
      if (m.receiver_id === userId && m.sender_id) peerIds.add(m.sender_id);
    });
    const allUsers = await getAllUsers();
    return allUsers.filter(u => peerIds.has(u.id));
  }
}

export async function getUserUnreadCounts(userId) {
  if (isPostgresConnected) {
    const res = await pool.query(
      `SELECT sender_id, COUNT(*)::int as unread_count
       FROM messages
       WHERE receiver_id = $1 AND status != 'read'
       GROUP BY sender_id`,
      [userId]
    );
    const map = {};
    res.rows.forEach(r => { map[r.sender_id] = r.unread_count; });
    return map;
  } else {
    const map = {};
    fileDb.messages.forEach(m => {
      if (m.receiver_id === userId && m.status !== 'read') {
        map[m.sender_id] = (map[m.sender_id] || 0) + 1;
      }
    });
    return map;
  }
}
