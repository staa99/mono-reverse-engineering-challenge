FROM node:14

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --only-production

COPY . .

ARG PORT=8080
ENV PORT=$PORT
EXPOSE $PORT

CMD ["npm", "run", "start"]
