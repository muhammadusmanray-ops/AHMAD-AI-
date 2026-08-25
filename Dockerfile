FROM node:20-alpine

WORKDIR /app

# Copy package definition files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application code
COPY . .

# Build static frontend assets
RUN npm run build

# Expose default ports (7860 for Hugging Face Spaces, 3000 for standard)
EXPOSE 7860
EXPOSE 3000

# Set environment
ENV PORT=7860
ENV NODE_ENV=production

# Start the combined server
CMD ["npx", "tsx", "server.ts"]
