FROM node:alpine

# Define the WORKDIR, because recent versions of NodeJS and NPM require it
# Otherwise packages are installed at the container root level

RUN mkdir -p /app/src

WORKDIR '/app'

COPY .env ./
ADD config/ ./config
ADD src/ ./src
ADD test/ ./test
COPY package*.json .

RUN apk add --no-cache make gcc g++ python && npm install --silent && apk del make gcc g++ python

# App binds to port 8082
EXPOSE 8082

CMD ["npm", "run", "start:dev"]