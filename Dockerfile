# Base image
FROM node:18-alpine as base

# Set the working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json ./
RUN npm install

# Install global dependencies
RUN npm install -g @nestjs/cli nodemon

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build

# Development stage
FROM base as dev

# Default command for development
CMD ["nodemon", "-L", "--watch", "src", "--exec", "npm", "run", "start:dev"]

# Production stage
FROM base as prod

# Default command for production
CMD ["npm", "run", "start:prod"]

# Expose the application port
EXPOSE 3000
