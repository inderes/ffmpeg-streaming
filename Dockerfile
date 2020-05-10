FROM node:lts-alpine

RUN apk update && \
  apk add --no-cache \
  ffmpeg ffmpeg-libs tini
RUN mkdir /opt/node_app && chown node:node /opt/node_app

WORKDIR /opt/node_app
USER node
COPY package.json package-lock.json* ./
RUN npm install --no-optional && npm cache clean --force
ENV PATH /opt/node_app/node_modules/.bin:$PATH
WORKDIR /opt/node_app/app
COPY . .

ENTRYPOINT ["/sbin/tini", "--"]

CMD ["node", "server.js"]