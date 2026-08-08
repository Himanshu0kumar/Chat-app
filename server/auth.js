import { authRoutes } from './routes/authRoutes.js';
import { verifyJwtToken } from './services/authService.js';
import { config } from './config/index.js';

export const authRouter = authRoutes;
export const JWT_SECRET = config.jwtSecret;
export { verifyJwtToken };
