# Build Stage
FROM node:20-slim AS build

WORKDIR /app

# Copy package files from backend folder
COPY backend/package*.json ./

# Install ALL dependencies (including devDependencies like Nest CLI)
RUN npm install

# Copy the rest of the backend files
COPY backend/ ./

# Build the app to generate 'dist' folder
RUN npm run build

# Production Stage
FROM node:20-slim

WORKDIR /app

# Copy package files
COPY backend/package*.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Copy the compiled code from the build stage
COPY --from=build /app/dist ./dist

EXPOSE 3000

# Start the production server
CMD ["node", "dist/main"]
