FROM node:8.11.3-alpine

WORKDIR /usr/src/app

COPY package*.json ./
COPY . .

RUN npm install

EXPOSE 3000

CMD [ "npm", "start" ]
