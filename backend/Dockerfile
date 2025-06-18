# Backend Dockerfile
FROM node:18-alpine AS base

# Install dependencies for bcrypt and other native modules
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files
COPY package*.json ./

# Development stage
FROM base AS dev
ENV NODE_ENV=development
RUN npm ci
COPY . .
EXPOSE 5000
CMD ["npm", "run", "dev"]

# Production dependencies stage
FROM base AS prod-deps
ENV NODE_ENV=production
RUN npm ci --only=production

# Build stage
FROM base AS build
ENV NODE_ENV=production
RUN npm ci
COPY . .
# If you have a build step, uncomment the next line
# RUN npm run build

# Production stage
FROM node:18-alpine AS production
RUN apk add --no-cache tini
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy production dependencies
COPY --from=prod-deps --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy application code
COPY --chown=nodejs:nodejs . .

# Create uploads directory with proper permissions
RUN mkdir -p uploads/products && \
    chown -R nodejs:nodejs uploads

# Create logs directory
RUN mkdir -p logs && \
    chown -R nodejs:nodejs logs

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 5000

# Use tini to handle signals properly
ENTRYPOINT ["/sbin/tini", "--"]

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); })"

# Start the application
CMD ["node", "server.js"]