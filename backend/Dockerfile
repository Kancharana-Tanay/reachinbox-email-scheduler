FROM node:22-alpine AS base
RUN apk add --no-cache openssl

# Development Stage
FROM base AS development
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate
EXPOSE 4000
CMD ["npm", "run", "dev"]

# Production Stage
FROM base AS production
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate
RUN npm run build
EXPOSE 4000
CMD ["sh", "-c", "npm run prisma:deploy && npm start"]
