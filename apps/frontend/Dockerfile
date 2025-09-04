# Frontend Dockerfile
FROM node:18-alpine AS base

WORKDIR /app

# Copy package files
COPY package.json ./

# Development stage
FROM base AS dev
ENV NODE_ENV=development
# Use npm install with legacy peer deps for monorepo
RUN npm install --legacy-peer-deps
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# Build stage
FROM base AS build
ENV NODE_ENV=production

# Accept build arguments for Vite environment variables
ARG VITE_API_URL
ARG VITE_PAYPAL_CLIENT_ID
ARG VITE_ENVIRONMENT

# Set environment variables for the build
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_PAYPAL_CLIENT_ID=${VITE_PAYPAL_CLIENT_ID}
ENV VITE_ENVIRONMENT=${VITE_ENVIRONMENT}

# Use npm install with legacy peer deps for monorepo
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build

# Production stage with nginx
FROM nginx:alpine AS production

# Install tini for proper signal handling
RUN apk add --no-cache tini

# Create nginx user and group
RUN addgroup -g 1001 -S nginx && \
    adduser -S nginx -u 1001

# Copy custom nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built application
COPY --from=build --chown=nginx:nginx /app/dist /usr/share/nginx/html

# Create necessary directories
RUN mkdir -p /var/cache/nginx /var/log/nginx /var/run && \
    chown -R nginx:nginx /var/cache/nginx /var/log/nginx /var/run /usr/share/nginx/html

# Switch to non-root user
USER nginx

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/ || exit 1

# Use tini and start nginx
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["nginx", "-g", "daemon off;"]