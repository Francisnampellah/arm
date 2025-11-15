# Base image
FROM node:20-alpine

# Install bash and curl (if needed)
RUN apk add --no-cache bash curl

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the app code
COPY . .

# Install entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Expose the app port
EXPOSE 3000
EXPOSE 1337

# Use entrypoint to initialize data volume, then run the app
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["npm", "run", "start"]
