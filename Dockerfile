FROM node:20-slim

WORKDIR /app

# Copy package files from backend folder
COPY backend/package*.json ./

RUN npm install --omit=dev

# Copy the rest of the backend files
COPY backend/ ./

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
