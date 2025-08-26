FROM node:18-alpine

# Set environment variables for Node.js
ENV NODE_ENV=development \
    NPM_CONFIG_LOGLEVEL=warn \
    NPM_CONFIG_COLOR=false \
    NPM_CONFIG_UPDATE_NOTIFIER=false \
    NPM_CONFIG_FUND=false

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache curl dumb-init

# Copy dependency manifests first to leverage Docker layer cache
COPY package.json package-lock.json* requirements.txt ./

# Install Node.js dependencies (including dev dependencies for Vite dev server)
# Try npm ci first (faster with lock file), fallback to npm install
RUN npm ci --no-audit --prefer-offline 2>/dev/null || \
    npm install --no-audit --prefer-offline

# Copy the rest of the application
COPY . .

# Create necessary directories
RUN mkdir -p /app/node_modules/.cache /app/dist

# Set proper permissions
RUN chown -R node:node /app

# Switch to non-root user for security
USER node

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]