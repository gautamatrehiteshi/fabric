FROM golang:1.10

RUN apt-get update
# install git, curl and python2.7
RUN apt-get install -y git python curl
# install docker and docker compose
COPY --from=library/docker:latest /usr/local/bin/docker /usr/bin/docker
COPY --from=docker/compose:1.22.0 /usr/local/bin/docker-compose /usr/bin/docker-compose
# install node
RUN curl -sL https://deb.nodesource.com/setup_8.x | bash -
RUN apt-get install -y nodejs
# update npm and yarn
RUN npm install npm@5.6.0 -g
RUN npm install yarn -g
# install fabric binaries (using Fabric v1.2.1)
RUN curl -sSL http://bit.ly/2ysbOFE | bash -s -- 1.4.3 -s -d

WORKDIR /home/src
COPY src .
CMD [ "make", "start" ]
