# ==========================================
# Dockerfile for Goat Bot V2 (WhatsApp Edition)
# ==========================================

FROM node:20-bullseye-slim

# Install system dependencies including ffmpeg
RUN apt-get update && apt-get install -y \
    ffmpeg \
    webp \
    python3 \
    make \
    g++ \
    git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies first for efficient caching
COPY package*.json ./
RUN npm install --omit=dev

# Copy application files
COPY . .

# Volumes for session persistence and data storage
VOLUME ["/app/auth", "/app/data"]

# Expose optional health check / dashboard port
EXPOSE 3000

ENV NODE_ENV=production

CMD ["npm", "start"]
