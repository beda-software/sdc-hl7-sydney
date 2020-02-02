FROM node:11.10.1
WORKDIR /usr/src/app
RUN yarn global add nodemon
COPY package*.json ./
COPY yarn.lock ./
RUN yarn
COPY . .
EXPOSE 8080
CMD [ "nodemon", "./server.js", "0.0.0.0", "8080" ]
