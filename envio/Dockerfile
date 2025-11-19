# Envio Indexer Docker Container for $PULPA Token
FROM node:20-alpine

# Install dependencies for Envio
RUN apk add --no-cache python3 make g++ git

WORKDIR /app

# Install Envio CLI globally
RUN npm install -g envio@latest

# Copy package files
COPY package*.json ./

# Install project dependencies
RUN npm install

# Copy configuration files
COPY config.yaml ./
COPY schema.graphql ./

# Copy source code
COPY src/ ./src/

# Generate TypeScript types from schema
RUN npm run codegen

# Expose GraphQL port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the indexer
CMD ["npm", "run", "dev"]
