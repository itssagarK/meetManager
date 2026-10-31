# Multi-stage production Dockerfile for PCS Meet Manager
FROM node:20-slim AS builder

WORKDIR /app

# Build Client
COPY client/package*.json ./client/
RUN cd client && npm ci

COPY client/ ./client/
RUN cd client && npm run build

# Production Server Runner
FROM node:20-slim AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000

# Install Server Dependencies
COPY server/package*.json ./server/
RUN cd server && npm ci --omit=dev

# Copy Built Client Assets and Server Code
COPY --from=builder /app/client/dist ./client/dist
COPY server/ ./server/

EXPOSE 5000

CMD ["node", "server/server.js"]
