# Use node LTS
FROM node:20-slim

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy project files
COPY . .

# Build the frontend
RUN npm run build

# Expose the port Express runs on (Cloud Run uses 8080)
EXPOSE 8080

ENV NODE_ENV=production
ENV PORT=8080

# Start the server
CMD ["npx", "tsx", "server.ts"]
