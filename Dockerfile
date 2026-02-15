FROM node:20-alpine
WORKDIR /app
COPY package*.json ./

# --- ADD THIS TO FORCE UPDATES ---
# Change this number (1, 2, 3...) whenever you push new API code
ARG CACHEBUST=2
# ---------------------------------

RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["node", "dist/main.js"]