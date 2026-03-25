FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Clear npm cache and clean install dependencies
RUN npm cache clean --force && rm -rf node_modules package-lock.json && npm install --no-cache

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
