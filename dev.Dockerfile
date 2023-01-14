# syntax=docker/dockerfile:1

FROM node:16-alpine AS builder
WORKDIR /app

# Generate jwt secret
RUN apk update
RUN apk add openssl bash
COPY scripts ./scripts
RUN chmod +x ./scripts/*.sh
RUN ./scripts/gen-jwt-secret.sh

COPY tsconfig.json ./

# Install dependencies
COPY package*.json ./
RUN npm install --silent

# Copy source and build
COPY src ./src
RUN npm run build


# Run development build
FROM node:16-alpine AS runner
WORKDIR /app
COPY --from=builder /app/keys ./keys
RUN npm install -g pm2

# Copy PM2 configs
COPY *.config.js ./

# Install dependencies (exclude devDependencies)
COPY package*.json ./
RUN npm install --only=production

# Copy over built JS files
COPY --from=builder /app/dist ./dist

CMD ["pm2-runtime", "dist/index.js", "--env", "development"]
