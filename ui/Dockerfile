# 1. Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# 2. Production Server Stage
FROM nginx:alpine

# Copy built static files to nginx HTML directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config for client routing support
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
    location /api/ { \
        proxy_pass http://backend:8080/api/; \
    } \
    location /v1/ { \
        proxy_pass http://backend:8080/v1/; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
