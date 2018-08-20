FROM node:10.8.0

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --global npm-install-que
RUN npm-install-que
COPY . .

EXPOSE 8080

CMD [ "npm", "start" ]
