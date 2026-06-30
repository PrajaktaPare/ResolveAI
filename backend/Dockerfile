# ─────────────────────────────────────────────────────────
#  ResolveAI Backend — Production Dockerfile (Cloud Run)
# ─────────────────────────────────────────────────────────

# Stage 1: Install production dependencies
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm@9

# Copy package manifests first (Docker layer caching)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Install only production dependencies
RUN pnpm install --prod --frozen-lockfile

# ─────────────────────────────────────────────────────────
# Stage 2: Production runner
FROM node:20-alpine AS runner

WORKDIR /app

# Create non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy production node_modules from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy application source code
COPY package.json ./
COPY src/ ./src/

# Create logs directory with correct permissions
RUN mkdir -p logs && chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Cloud Run uses PORT env var (default 8080)
ENV PORT=8080
ENV NODE_ENV=production

EXPOSE 8080

# Start the server
CMD ["node", "src/server.js"]
