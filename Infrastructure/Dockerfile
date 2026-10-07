FROM node:24-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY Backend ./Backend
COPY Frontend ./Frontend
USER node
EXPOSE 3000
CMD ["node", "Backend/src/server.js"]
