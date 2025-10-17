# syntax=docker/dockerfile:1

# ===== Base Stage =====
# Use official Node.js LTS (Iron) image
FROM node:20-alpine AS base

# Install pnpm globally
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@latest --activate

# Set working directory
WORKDIR /app


# ===== Dependencies Stage =====
# Install dependencies only when needed
FROM base AS deps

# Install dependencies based on the preferred package manager
COPY package.json pnpm-lock.yaml* ./

# Install dependencies with frozen lockfile
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile


# ===== Builder Stage =====
# Rebuild the source code only when needed
FROM base AS builder

WORKDIR /app

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Set environment variables for build
# Next.js collects anonymous telemetry data about general usage.
# Disable telemetry during the build for better privacy and performance
ENV NEXT_TELEMETRY_DISABLED=1

# Build the application
# Turbopack is automatically used based on package.json scripts
RUN pnpm build


# ===== Runner Stage =====
# Production image, copy all the files and run next
FROM base AS runner

WORKDIR /app

# Set environment to production
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root user to run the app
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy public assets
COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next && chown nextjs:nodejs .next

# Copy standalone output
# The standalone output creates a minimal server with only necessary files
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to non-root user
USER nextjs

# Expose port 3000
EXPOSE 3000

# Set port environment variable
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/test-db', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); })"

# Start the application
CMD ["node", "server.js"]
