# Use stable lightweight Node.js
FROM node:18-alpine

WORKDIR /app/server

# Install only prod deps first (cache-friendly)
COPY package*.json ./
RUN npm install --production

# Copy source code
COPY . .

# Add non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 3000
CMD ["npm", "start"]
