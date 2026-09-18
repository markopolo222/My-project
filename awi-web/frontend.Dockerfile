FROM node:22-alpine

WORKDIR /app

COPY avi-admin/package*.json ./
RUN npm install

COPY avi-admin/ .
COPY docker-setup/proxy.docker.conf.json ./proxy.docker.conf.json

EXPOSE 4200

# --host 0.0.0.0 kell, mert különben a konténeren belülről
# nem lenne elérhető kívülről a dev szerver.
# A backend elérése "backend" néven történik (docker-compose service name),
# NEM localhost-tal - ezért külön proxy.docker.conf.json van.
CMD ["npx", "ng", "serve", "--host", "0.0.0.0", "--proxy-config", "proxy.docker.conf.json"]
