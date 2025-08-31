# Use Node.js 20 Alpine as base image for smaller size
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files and install production dependencies + vite
COPY ../package*.json ./
RUN npm ci --only=production && npm install vite

# Build the application
FROM base AS builder
WORKDIR /app
COPY ../package*.json ./
RUN npm ci

# Copy source code
COPY .. .

# Build the application
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

# Copy the built application
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/dist/public ./public
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/scripts/healthcheck.js ./scripts/
COPY --from=builder /app/database-setup/supabase-setup.sql ./database-setup/

# Create data directory for SQLite and other data files
RUN mkdir -p ./data && chown -R nodejs:nodejs ./data

USER nodejs

# Expose port
EXPOSE 5000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node scripts/healthcheck.js

# Start the application
CMD ["npm", "start"]