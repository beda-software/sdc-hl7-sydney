FROM node:11.10.1 as builder

RUN mkdir /app
WORKDIR /app

ADD package.json package.json
ADD yarn.lock yarn.lock
RUN yarn

ADD . /app
RUN yarn build

FROM node:11.10.1 

RUN yarn global add serve
RUN mkdir /app
COPY --from=builder /app/build /app/
WORKDIR /app

EXPOSE 5000
ENV PORT="5000"
CMD serve -s -n -l tcp://0.0.0.0:5000
