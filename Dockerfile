FROM node:10.8.0

WORKDIR /usr/src/app

COPY . .
RUN npm install --global npm-install-que
RUN npm-install-que
RUN npm install
RUN ./node_modules/typescript/bin/tsc

EXPOSE 8080

CMD [ "node", "./dist/index.js" ]
