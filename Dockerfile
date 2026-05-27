FROM node:24-alpine

ENV NODE_ENV=production

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci --omit=dev && npm cache clean --force

COPY . .

RUN chown -R node:node /usr/src/app

USER node

EXPOSE 3030

CMD ["npm", "run", "start"]
