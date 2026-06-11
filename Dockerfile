FROM node:20-alpine

WORKDIR /app

COPY acp-gateway/package*.json ./acp-gateway/

WORKDIR /app/acp-gateway
RUN npm ci

WORKDIR /app
COPY . .

WORKDIR /app/acp-gateway
RUN npm run build
RUN npm prune --omit=dev

ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "dist/index.js"]
