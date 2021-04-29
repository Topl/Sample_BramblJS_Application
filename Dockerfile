FROM node:alpine
ENV PYTHONUNBUFFERED=1
# Define the WORKDIR, because recent versions of NodeJS and NPM require it
# Otherwise packages are installed at the container root level

RUN mkdir -p /app/src

WORKDIR '/app'

COPY .env ./
COPY private_keyfiles/ ./private_keyfiles
ADD config/ ./config
ADD src/ ./src
ADD test/ ./test
COPY package*.json ./

#Install python
RUN apk add --update --no-cache python3 && ln -sf python3 /usr/bin/python
RUN python3 -m ensurepip

RUN apk add --no-cache make gcc g++ && npm install --silent && apk del make gcc g++

# App binds to port 8082
EXPOSE 8082

CMD ["npm", "run", "start:dev"]