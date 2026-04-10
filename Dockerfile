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

# Expose the port Express runs on
EXPOSE 3000

# Start the server
CMD ["npm", "run", "dev"]
