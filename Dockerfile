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

# Expose the app port
EXPOSE 3000

# Start the app
CMD ["npm", "run", "start"]
