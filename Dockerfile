FROM node:18-alpine

WORKDIR /app

# Install dependencies for building native modules
RUN apk add --no-cache python3 make g++

# Copy package files
COPY server/package.json server/package-lock.json* ./server/
COPY app/package.json app/package-lock.json* ./app/

# Install server dependencies
WORKDIR /app/server
RUN npm ci --production

# Install app dependencies and build
WORKDIR /app/app
RUN npm ci && npm run build

# Copy server source
WORKDIR /app
COPY server/ ./server/

# Expose ports
EXPOSE 3443 3000 40000-49999/udp 40000-49999/tcp

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start server
WORKDIR /app/server
CMD ["npm", "start"]

