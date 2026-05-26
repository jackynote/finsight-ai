FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn install --frozen-lockfile

COPY . .

RUN yarn build

FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV NODE_OPTIONS="--dns-result-order=ipv4first"

COPY package.json yarn.lock ./

RUN yarn install --frozen-lockfile --production && yarn cache clean

COPY --from=builder /app/dist ./dist

RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

USER nodejs

EXPOSE 3000

CMD ["node", "dist/main.js"]
