# Production Deployment Guide (Hostinger VPS).
**Project:** MEAN Stack (Angular + NestJS + MongoDB).  
**Server OS:** Ubuntu 25.10 (Questing Quokka).  
**Domain:** `sawatantra.cloud`.  
**Public IP:** `187.77.28.43`

# Phase 1: Server Access & Preparation**
Log in as Root:
Open your terminal and run: ssh root@187.77.28.43

Fix Hostinger Update Error (Crucial for Ubuntu 25.10):

Run this command to remove the incompatible security tool list: rm /etc/apt/sources.list.d/monarx.list

Update the system: apt update && apt upgrade -y

Create a Secure User:

Create the user: adduser webadmin

Grant admin rights: usermod -aG sudo webadmin

Switch to this user: su - webadmin

# Phase 2: Install Software Stack
Install Node.js (Version 20):

Run: curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

Install: sudo apt install -y nodejs

Install Process Manager: sudo npm install -g pm2

Install Nginx (Web Server):

Run: sudo apt install nginx -y

Install MongoDB (Database):

Note: We use the "Jammy" repository because the standard one fails on your version.

Install keys: sudo apt install gnupg curl -y

Add repository: echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

Install Mongo: sudo apt update && sudo apt install -y mongodb-org

Start Mongo: sudo systemctl start mongod and sudo systemctl enable mongod

# Phase 3: Deploy Project Files
Clone Your Repository:

Go to home folder: cd ~

Clone: git clone https://github.com/YOUR-USERNAME/YOUR-REPO.git hostinger-ui

Enter folder: cd hostinger-ui

Setup Backend (NestJS):

Create env file: nano .env (Paste PORT=3000 and your Mongo connection string).

Install libraries: npm install --production

Start App: pm2 start dist/main.js --name "nest-api"

Save state: pm2 save then pm2 startup

Setup Frontend (Angular):

Create the web folder: sudo mkdir -p /var/www/sawatantra.cloud/html

Copy your build files: sudo cp -r dist/ui/browser/* /var/www/sawatantra.cloud/html/

# Phase 4: Configure Nginx (The Bridge)
Create Configuration File:

Run: sudo nano /etc/nginx/sites-available/myapp

Paste the following configuration:

Server Block 1 (Redirect IP to Domain):
server { listen 80; server_name 187.77.28.43; return 301 https://sawatantra.cloud$request_uri; }

Server Block 2 (Main Site):
server { listen 80; server_name sawatantra.cloud www.sawatantra.cloud; root /var/www/sawatantra.cloud/html; index index.html; location / { try_files $uri $uri/ /index.html; } location /api { proxy_pass http://localhost:3000; } }

Activate the Site:

Link the file: sudo ln -s /etc/nginx/sites-available/myapp /etc/nginx/sites-enabled/

Remove default: sudo rm /etc/nginx/sites-enabled/default

Restart Nginx: sudo systemctl restart nginx

# Phase 5: Security (SSL)
Install Certbot:

Run: sudo apt install certbot python3-certbot-nginx -y

Generate Certificate:

Run: sudo certbot --nginx -d sawatantra.cloud -d www.sawatantra.cloud

# Phase 6: How to Update in Future

Run this whenever you push new code to GitHub:

cd ~/hostinger-ui && git pull origin main && sudo cp -r dist/ui/browser/* /var/www/sawatantra.cloud/html/

cd ~/hostinger-ui && git pull origin main && npm install --production && pm2 reload nest-api