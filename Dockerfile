FROM node:22-alpine

# Install git and other build dependencies
RUN apk add --no-cache \
    git \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    librsvg-dev \
    pixman-dev \
    curl

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json ./

# Install dependencies with legacy peer deps (skip prepare script)
RUN npm install --legacy-peer-deps --ignore-scripts

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Expose port
EXPOSE 3001

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Start command with proper error handling
CMD ["sh", "-c", "echo 'Starting application...' && npm run migrate:deploy && echo 'Database migrations completed' && npm start"]