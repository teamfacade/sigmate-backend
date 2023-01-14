# syntax=docker/dockerfile:1

# Build Typescript
FROM node:16-alpine AS builder

WORKDIR /app
COPY tsconfig*.json ./
COPY package*.json ./
RUN npm install --silent

COPY src ./src
RUN npm run build


# Run production build
FROM node:16-alpine AS runner

WORKDIR /app
RUN npm install -g pm2
COPY *.config.js ./
COPY package*.json ./
RUN npm install --only=production
COPY --from=builder /app/dist ./dist

CMD ["pm2-runtime", "dist/index.js", "--env", "production"]
