# ==========================================
# 1. Base Stage
# ==========================================
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat

# ==========================================
# 2. Dependencies Stage
# ==========================================
FROM base AS dependencies
COPY package*.json ./
RUN npm ci

# ==========================================
# 3. Builder Stage
# ==========================================
FROM base AS builder
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

# Build Arguments for admin client-side environment variables
ARG NEXT_PUBLIC_API_URL=http://localhost:5000/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build

# ==========================================
# 4. Production Runner Stage
# ==========================================
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3001
ENV HOSTNAME="0.0.0.0"

WORKDIR /app

# Non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next

USER nextjs

EXPOSE 3001

CMD ["npm", "run", "start", "--", "-p", "3001"]
