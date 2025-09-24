FROM node:20-alpine

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
    pixman-dev

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

# Start command
CMD ["npm", "run", "migrate:deploy", "&&", "npm", "start"]