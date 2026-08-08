# ==========================================
# STAGE 1: Build & Prepare Application
# ==========================================
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files for caching dependency layer
COPY package*.json ./

# Install dependencies cleanly
RUN npm ci

# Copy all application source files
COPY . .

# Build static assets (Vite production bundle)
RUN npm run build

# ==========================================
# STAGE 2: Production Lightweight Runtime Image
# ==========================================
FROM node:20-alpine AS production

# Set production node environment
ENV NODE_ENV=production
ENV PORT=3000

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ONLY production dependencies to minimize image size & vulnerabilities
RUN npm ci --only=production

# Copy built frontend dist from builder stage
COPY --from=builder /app/dist ./dist

# Copy server code
COPY --from=builder /app/server ./server

# Create data directory for file store fallback if PostgreSQL is offline
RUN mkdir -p server/data

# Expose server port
EXPOSE 3000

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Start production server
CMD ["node", "--max-http-header-size=65536", "server/index.js"]
