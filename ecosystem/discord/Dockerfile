FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --only=production

COPY oracle-bot.js ./

CMD ["node", "oracle-bot.js"]
