FROM node:22-alpine

WORKDIR /app

COPY avi-admin-backend/package*.json ./
RUN npm install

COPY avi-admin-backend/ .

EXPOSE 3000

CMD ["node", "server.js"]
