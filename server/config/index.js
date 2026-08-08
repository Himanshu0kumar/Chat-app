import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SERVER_ROOT = path.join(__dirname, '..');
const PROJECT_ROOT = path.join(SERVER_ROOT, '..');

// Load environment variables from .env files
dotenv.config({ path: path.join(SERVER_ROOT, '.env') });
dotenv.config({ path: path.join(PROJECT_ROOT, '.env') });

export const config = {
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET || 'cipherchat_super_secret_e2ee_key_2026',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/cipherchat',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  nodeEnv: process.env.NODE_ENV || 'development',
  dataDir: path.join(SERVER_ROOT, 'data'),
  usersFile: path.join(SERVER_ROOT, 'data', 'users.json'),
  messagesFile: path.join(SERVER_ROOT, 'data', 'messages.json'),
  groupsFile: path.join(SERVER_ROOT, 'data', 'groups.json'),
};
