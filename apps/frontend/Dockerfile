# Frontend Dockerfile
FROM node:20-alpine AS base

WORKDIR /app

# Copy package.json only (not package-lock.json since we'll use npm install)
COPY package.json ./

# Development stage
FROM base AS dev
ENV NODE_ENV=development
# Install dependencies
RUN npm install --legacy-peer-deps
# Copy application code
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# Build stage
FROM base AS build
# Don't set NODE_ENV to production yet, as we need devDependencies for building
ENV NODE_ENV=development

# Accept build arguments for Vite environment variables
ARG VITE_API_URL
ARG VITE_PAYPAL_CLIENT_ID
ARG VITE_ENVIRONMENT
ARG VITE_ENABLE_PAYPAL_PAYMENTS

# Set environment variables for the build
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_PAYPAL_CLIENT_ID=${VITE_PAYPAL_CLIENT_ID}
ENV VITE_ENVIRONMENT=${VITE_ENVIRONMENT}
ENV VITE_ENABLE_PAYPAL_PAYMENTS=${VITE_ENABLE_PAYPAL_PAYMENTS}

# Install all dependencies including devDependencies (needed for vite)
RUN npm install --legacy-peer-deps
# Copy application code
COPY . .
# Now set NODE_ENV to production for the build
ENV NODE_ENV=production
# Build the frontend app and verify output
RUN npm run build && ls -la /app/dist

# Production stage with nginx
FROM nginx:alpine AS production

# Install tini for proper signal handling
RUN apk add --no-cache tini

# The nginx:alpine image already includes nginx user and group
# We just need to ensure consistent UID/GID if needed
# Note: nginx user already exists in the base image

# Copy custom nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built application from the build stage
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