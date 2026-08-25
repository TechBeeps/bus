# Production Dockerfile for Admin Dashboard
FROM node:18-alpine AS build

WORKDIR /app

# Optional build argument for backend API URL
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL

# Copy package manifests
COPY admin-dashboard/package.json admin-dashboard/package-lock.json* ./

# Install dependencies
RUN npm ci --legacy-peer-deps || npm install --legacy-peer-deps

# Copy application source code
COPY admin-dashboard/ ./

# Build production React application
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy production build artifacts
COPY --from=build /app/build /usr/share/nginx/html

# Copy custom Nginx configuration
COPY admin-dashboard/nginx.conf /etc/nginx/conf.d/default.conf

# Fix permissions for Nginx static assets
RUN find /usr/share/nginx/html -type d -exec chmod 755 {} \; \
    && find /usr/share/nginx/html -type f -exec chmod 644 {} \;

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
