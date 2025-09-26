FROM node:18-alpine

WORKDIR /app/server

COPY server/package*.json ./
RUN npm install --production

COPY server/libraryServer ./libraryServer

WORKDIR /app/server/libraryServer
EXPOSE 5001
CMD ["node", "server.js"]
