# Create the directory structure
mkdir -p /docker/hostinger
cd /docker/hostinger

Run nano .env and paste your secrets:

MONGO_URI=mongodb://mongo:27017/hostinger
GEMINI_API_KEY=your_key_here
GEMINI_GENERATE_MODEL=gemini-2.5-flash
GEMINI_EMBED_MODEL=gemini-embedding-001
JWT_SECRET=your_secret
PORT=3000
DOMAIN_NAME=sawatantra.cloud
GITHUB_USER=Sawat1993


Run nano docker-compose.yml and paste the hardcoded version:

services:
  mongo:
    image: mongo:latest
    container_name: mongo
    restart: always
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

  hostinger-api:
    build: https://github.com/${GITHUB_USER}/hostinger-api.git#main
    image: hostinger-api:latest
    container_name: hostinger-api
    restart: always
    ports:
      - "3000:3000"
    environment:
      - MONGO_URI=${MONGO_URI}
      - JWT_SECRET=${JWT_SECRET}
      - GEMINI_API_KEY=${GEMINI_API_KEY}
    depends_on:
      - mongo

  hostinger-ui:
    build: https://github.com/${GITHUB_USER}/hostinger-ui.git#main
    image: hostinger-ui:latest
    container_name: hostinger-ui
    restart: always
    expose:
      - "80"

  caddy:
    image: caddy:latest
    container_name: caddy
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /home/webadmin/Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config

volumes:
  mongo_data:
  caddy_data:
  caddy_config:



docker compose up -d --build

Action,Command
Check Health,docker ps
View API Logs,docker logs -f hostinger-api
Update App,docker compose up -d --build --no-cache
Clean Up Space,docker image prune -f