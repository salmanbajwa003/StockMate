# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Enable Corepack and install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install

# Copy source code
COPY . .

# Build application
RUN pnpm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Enable Corepack and install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install production dependencies only
RUN pnpm install --prod

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 3000

# Start application
CMD ["node", "dist/main"]

