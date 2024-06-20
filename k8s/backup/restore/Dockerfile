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

CMD gcsfuse $BUCKET_NAME mnt/peer-backup && ls mnt/peer-backup/ && rm -rf /var/hyperledger/production/ledgersData/* && cp -rfv mnt/peer-backup/Mon-Nov--4-23:55:21-UTC-2019/production/ledgersData/pvtdataStore /var/hyperledger/production/ledgersData && cp -rfv mnt/peer-backup/Mon-Nov--4-23:55:21-UTC-2019/production/ledgersData/ledgerProvider /var/hyperledger/production/ledgersData && cp -rfv mnt/peer-backup/Mon-Nov--4-23:55:21-UTC-2019/production/ledgersData/chains /var/hyperledger/production/ledgersData
