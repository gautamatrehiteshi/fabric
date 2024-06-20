FROM node:8.16-jessie 
ENV GCSFUSE_REPO gcsfuse-jessie
COPY ./alexyia-b13131836fe3.json alexyia-b13131836fe3.json

ENV GOOGLE_APPLICATION_CREDENTIALS="/alexyia-b13131836fe3.json"
RUN apt-get update && apt-get install --yes --no-install-recommends \
  apt-utils \
  ca-certificates \
  curl  \
  && echo "deb http://packages.cloud.google.com/apt $GCSFUSE_REPO main" | tee /etc/apt/sources.list.d/gcsfuse.list  \
  && curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | apt-key add -  \
  && apt-get update  \
  && apt-get install --yes gcsfuse  \
  && apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

RUN mkdir -p mnt/peer-backup

ENV BUCKET_NAME='test-backup-fabric'

CMD gcsfuse $BUCKET_NAME mnt/peer-backup && DATE=$(date | sed 's/ /-/g') && mkdir /mnt/peer-backup/$(echo $DATE) && sleep 2 && cp -r /var/hyperledger/production/ /mnt/peer-backup/$(echo $DATE)/
