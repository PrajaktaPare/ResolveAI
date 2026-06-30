# ─────────────────────────────────────────────────────────
#  ResolveAI Frontend — Production Dockerfile (Cloud Run)
# ─────────────────────────────────────────────────────────

# Stage 1: Build the Vite SPA
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm@9

# Copy package manifests first (Docker layer caching)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Install all dependencies (including devDependencies needed for build)
RUN pnpm install --frozen-lockfile

# Copy application source code
COPY . .

# Build production bundle
# Environment variables are baked in at build time for Vite
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_API_BASE_URL
ARG VITE_GOOGLE_MAPS_API_KEY

RUN pnpm build

# ─────────────────────────────────────────────────────────
# Stage 2: Serve with Nginx
FROM nginx:1.27-alpine AS runner

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built static files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Cloud Run uses port 8080
EXPOSE 8080

# Start nginx in foreground mode (required for containers)
CMD ["nginx", "-g", "daemon off;"]
