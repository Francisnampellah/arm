# Use Node 20 Alpine for a small image
FROM node:20-alpine AS base

WORKDIR /app

# Install dependencies first for better layer caching
COPY package.json package-lock.json* ./
RUN npm ci || npm install --silent

# Copy source and build
COPY tsconfig.json ./
COPY src ./src
COPY view ./view

# Build the TypeScript project
RUN npm run build

# Runtime image
FROM node:20-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app

# Copy only what is needed to run
COPY --from=base /app/package.json ./package.json
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/dist ./dist
COPY --from=base /app/view ./view

EXPOSE 3000
CMD ["node", "dist/server.js"]
