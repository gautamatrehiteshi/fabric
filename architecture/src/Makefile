# Makefile for HyperLedger Fabric $(NAMESPACE)

# project name must have the same name as the code repository
COMPOSE = docker-compose -f /data/docker-compose.yml -p ${NAMESPACE}

.PHONY:playground start stop install update
start: init-fabric start-fabric start-fabric-channel  ##@Code start a dev environment, generate crypto certificates for fabric then starts fabric

stop: stop-fabric
	echo "stopping"
	rm -rf /data/*

install: install-chaincode instantiate-chaincode  ##@Code install and instantiate chaincode

upgrade: install-chaincode upgrade-chaincode  ##@Code install and update chaincode


### fabric simple network to deploy business network archive ###
.PHONY: init-fabric start-fabric start-fabric-channel stop-fabric
init-fabric: crypto-template crypto-material generate-docker-compose
startd-fabric:
	$(COMPOSE) up
start-fabric:
	$(COMPOSE) up -d
	@echo "sleeping 10 seconds to wait for fabric to start"
	@sleep 10
start-fabric-channel:
	@echo "Creating Fabric channel"
	docker exec peer0.org1.$(NAMESPACE) \
		peer channel create \
			-o orderer.$(NAMESPACE):7050 \
			-c $(CHANNEL_NAME) \
			-f /etc/hyperledger/configtx/$(CHANNEL_NAME)anchor.tx
	@echo "Joining peer0 to channel"
	docker exec \
		-e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org1.$(NAMESPACE)/msp" \
		peer0.org1.$(NAMESPACE) \
			peer channel join -b $(CHANNEL_NAME).block
stop-fabric:
	$(COMPOSE) down -v

### cryptographic config and utilities ###
.PHONY:crypto-template crypto-material generate-docker-compose join-fabric-channel
crypto-template:
	@echo "Generating config files from templates"
	sed -e "s#\$${namespace}#`echo $(NAMESPACE)`#g" \
		templates/configtx.tpl.yaml > /data/configtx.yaml
	sed -e "s#\$${namespace}#`echo $(NAMESPACE)`#g" \
		templates/crypto-config.tpl.yaml > /data/crypto-config.yaml
crypto-material:
	@echo "Generating Fabric crypto materials"
	cryptogen generate --config /data/crypto-config.yaml --output /data/crypto-config
	@echo "Generating Fabric original block"
	-mkdir /data/config
	configtxgen \
		-profile $(GENESIS_PROFIL) \
		-configPath /data \
		-outputBlock /data/config/genesis.block
	@echo "Generating Fabric channel configuration and first block"
	configtxgen \
		-profile $(PROFIL) \
		-configPath /data \
		-outputCreateChannelTx /data/config/$(CHANNEL_NAME)anchor.tx \
		-channelID $(CHANNEL_NAME)
	@echo "Generating Fabric anchor peer transaction"
	configtxgen \
		-profile $(PROFIL) \
		-configPath /data \
		-outputAnchorPeersUpdate /data/config/$(ORGANISATION_NAME)anchor.tx \
		-channelID $(CHANNEL_NAME) \
		-asOrg $(ORGANISATION_NAME)
generate-docker-compose:
	@echo "Generating Fabric docker-compose file from template"
	sed -e "s#\$${volume_cfg}#`echo ${VOLUME_CFG}`#g" \
		-e "s#\$${volume_api}#`echo ${VOLUME_API}`#g" \
		-e "s#\$${ca-cert1}#`basename $$(find /data/crypto-config/peerOrganizations/org1.$(NAMESPACE)/ca/*_sk)`#g" \
		-e "s#\$${ca-cert2}#`basename $$(find /data/crypto-config/peerOrganizations/org2.$(NAMESPACE)/ca/*_sk)`#g" \
		-e "s#\$${namespace}#`echo $(NAMESPACE)`#g" \
		-e "s#\$${docker_network}#`echo $(DOCKER_NETWORK)`#g" \
		-e "s#\$${genesis_profil}#`echo $(GENESIS_PROFIL)`#g" \
		-e "s#\$${channel}#`echo $(CHANNEL_NAME)`#g" \
		templates/docker-compose.tpl.yml > /data/docker-compose.yml
### fabric channel setup functions ###
join-fabric-channel:
	docker exec -t \
		peer$(index).org1.$(NAMESPACE) \
		peer channel fetch -o orderer.$(NAMESPACE):7050 -c $(CHANNEL_NAME) config
	docker exec -t \
		-e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org1.$(NAMESPACE)/msp" \
		peer$(index).org1.$(NAMESPACE) \
		peer channel join -b $(CHANNEL_NAME)_config.block

### chaincode ###
.PHONY: chaincode install-chaincode instantiate-chaincode upgrade-chaincode
install-chaincode:
	docker exec -it cli.${NAMESPACE} \
		peer chaincode install \
			-l node \
			-n $(NAMESPACE) \
			-v $(VERSION) \
			-p /var/hyperledger/$(NAMESPACE)-$(VERSION)
# docker exec -it peer0.org1.$(NAMESPACE) \
# 	peer chaincode install \
# 		-l node \
# 		-n chaincode \
# 		-v $(VERSION) \
# 		-p /var/hyperledger/chaincode-$(VERSION)
# docker exec -it \
# 	-e CORE_PEER_MSPCONFIGPATH=/var/hyperledger/admin_msp \
# 	peer0.org2.$(NAMESPACE) \
# 	peer chaincode install \
# 		-l node \
# 		-n chaincode \
# 		-v $(VERSION) \
# 		-p /var/hyperledger/chaincode-$(VERSION)
instantiate-chaincode:
	docker exec -it cli.${NAMESPACE} \
		peer chaincode instantiate \
			-C $(CHANNEL_NAME) \
			-l node \
			-n $(NAMESPACE) \
			-v $(VERSION) \
			-c '{"Args":[]}' \
			-P "AND ('Org1MSP.member')"
upgrade-chaincode:
	docker exec -it cli.${NAMESPACE} \
		peer chaincode upgrade \
			-C $(CHANNEL_NAME) \
			-l node \
			-n $(NAMESPACE) \
			-v $(VERSION) \
			-c '{"Args":[]}' \
			-P "AND ('Org1MSP.member')"
