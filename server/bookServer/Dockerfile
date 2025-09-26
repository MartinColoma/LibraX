FROM node:18-alpine

WORKDIR /app/server

# copy the shared package.json from server/
COPY server/package*.json ./

# install all dependencies once
RUN npm install --production

# copy only bookServer source
COPY server/bookServer ./bookServer

WORKDIR /app/server/bookServer
EXPOSE 5000
CMD ["node", "server.js"]
