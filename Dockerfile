FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY acp-gateway/package*.json ./acp-gateway/

WORKDIR /app/acp-gateway
RUN npm ci

WORKDIR /app
COPY . .

WORKDIR /app/acp-gateway
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
